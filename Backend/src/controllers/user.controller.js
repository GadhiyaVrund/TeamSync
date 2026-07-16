import {asyncHandler} from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { Team } from '../models/team.model.js';
import { JoinRequest } from '../models/joinRequest.model.js';
import { TeamInvite } from '../models/teamInvite.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { AuditLog } from '../models/auditLog.model.js';
import { getAuthCookieOptions, issueAuthTokens } from '../services/auth.service.js';

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, mobileNo, password } = req.body;

    if(!(username && email && mobileNo && password)) {
        throw new ApiError(400, 'All fields are required');
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new ApiError(409, 'User with given email or username already exists');
    }

    const user = await User.create({ username, email, mobileNo, password });
    if(!user){
        throw new ApiError(500, 'User registration failed');
    }

    const createdUser = await User.findById(user._id).select('-refreshToken');
    const { authToken, refreshToken } = await issueAuthTokens(user);
    const rules = getAuthCookieOptions();


    return res
    .status(201)
    .cookie('authToken', authToken, rules)
    .cookie('refreshToken', refreshToken, rules)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
})


const loginUser = asyncHandler(async (req, res) => {
    const { email,mobileNo, password } = req.body;

    if(!((email || mobileNo) && password)) {
        throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({
        $or: [{ email }, { mobileNo }]
    }).select('+password');


    if(!user){
        throw new ApiError(401, 'User not found...');
    }

    if(!(await user.comparePassword(password))){
        throw new ApiError(401, 'Invalid Password...');
    }


    const { authToken, refreshToken } = await issueAuthTokens(user);
    //store tokens in cookies 
    const rules = getAuthCookieOptions();

    return res
    .status(200)
    .cookie('authToken', authToken, rules)
    .cookie('refreshToken', refreshToken, rules)
    .json(new ApiResponse(200, { authToken, refreshToken }, 'Login successful'));

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: "" } },
        { new: true }
    )

    return res
    .status(200)
    .clearCookie('authToken')
    .clearCookie('refreshToken')
    .json(new ApiResponse(200, null, 'Logout successful'));


})



const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, 'User session is invalid');
    }

    return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'User fetched successfully'));
});


const refreshAuthToken = asyncHandler(async (req, res) => {
    const storedRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!storedRefreshToken) {
        throw new ApiError(401, 'Refresh token is missing');
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(
            storedRefreshToken,
            process.env.REFRESH_TOKEN
        );
    } catch (_error) {
        throw new ApiError(401, 'Refresh token is invalid');
    }

    const user = await User.findById(decodedToken?._id).select('+refreshToken');

    if (!user || user.refreshToken !== storedRefreshToken) {
        throw new ApiError(401, 'Refresh token does not match the latest token');
    }

    const tokenOrganizationId = decodedToken?.organization?.toString?.() || decodedToken?.organization;
    const userOrganizationId = user.organization?.toString?.();

    // Backward compatible: older refresh tokens may not include organization.
    if (tokenOrganizationId && tokenOrganizationId !== userOrganizationId) {
        throw new ApiError(401, 'Refresh token tenant mismatch');
    }

    const { authToken, refreshToken } = await issueAuthTokens(user);
    const rules = getAuthCookieOptions();

    return res
    .status(200)
    .cookie('authToken', authToken, rules)
    .cookie('refreshToken', refreshToken, rules)
    .json(new ApiResponse(200, { authToken, refreshToken }, 'Tokens refreshed successfully'));
});



const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organization._id;

    if (!req.user || req.user._id.toString() !== id) {
        throw new ApiError(403, 'Not authorized to update this account');
    }

    const allowedFields = ['username', 'email', 'mobileNo', 'password'];
    const { currentPassword, confirmPassword } = req.body;

    const updates = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, 'No valid fields provided for update');
    }

    if (updates.password) {
        if (!currentPassword || !confirmPassword) {
            throw new ApiError(400, 'Current password and password confirmation are required');
        }

        if (updates.password !== confirmPassword) {
            throw new ApiError(400, 'New password and confirmation do not match');
        }
    }

    // Check for uniqueness conflicts for username/email/mobileNo
    const conflictQuery = [];
    if (updates.email) conflictQuery.push({ email: updates.email });
    if (updates.username) conflictQuery.push({ username: updates.username });
    if (updates.mobileNo) conflictQuery.push({ mobileNo: updates.mobileNo });

    if (conflictQuery.length) {
        const conflict = await User.findOne({
            $or: conflictQuery,
            organization: organizationId,
            _id: { $ne: id }
        });
        if (conflict) {
            throw new ApiError(409, 'One of the provided fields is already in use');
        }
    }

    const user = await User.findOne({ _id: id, organization: organizationId }).select('+password');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (updates.password) {
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw new ApiError(401, 'Current password is incorrect');
        }
    }

    Object.assign(user, updates);
    await user.save();

    const updated = await User.findOne({ _id: id, organization: organizationId }).select('-refreshToken');
    return res.status(200).json(new ApiResponse(200, 'User updated successfully', updated));
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organization._id;

    if (!req.user || req.user._id.toString() !== id) {
        throw new ApiError(403, 'Not authorized to delete this account');
    }

    const user = await User.findOne({ _id: id, organization: organizationId });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    await User.deleteOne({ _id: id, organization: organizationId });

    return res
    .status(200)
    .clearCookie('authToken')
    .clearCookie('refreshToken')
    .json(new ApiResponse(200, 'Account deleted successfully'));
});

const getUserNotifications = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const userEmail = req.user.email;
    const organizationId = req.organization._id;

    const joinRequestsPromise = JoinRequest.find({
        organization: organizationId,
        userId,
        status: 'pending',
        createdBy: { $ne: userId }
    })
        .populate('teamId', 'name')
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 });

    const teamInvitesPromise = TeamInvite.find({
        organization: organizationId,
        status: 'pending',
        expiresAt: { $gt: new Date() },
        $or: [
            { userId },
            ...(userEmail ? [{ email: userEmail.toLowerCase() }] : [])
        ]
    })
        .populate('teamId', 'name')
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 });

    const [joinRequests, teamInvites] = await Promise.all([
        joinRequestsPromise,
        teamInvitesPromise
    ]);

    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { requests: joinRequests, invites: teamInvites },
                'Notifications fetched successfully'
            )
        );
});

const searchUsers = asyncHandler(async (req, res) => {
    const query = String(req.query.q || '').trim();
    const organizationId = req.organization._id;
    if (!query) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], 'Users fetched successfully'));
    }

    const users = await User.find({
        organization: organizationId,
        _id: { $ne: req.user._id },
        username: { $regex: query, $options: 'i' }
    })
        .select('_id username')
        .limit(10)
        .lean();

    return res
        .status(200)
        .json(new ApiResponse(200, users, 'Users fetched successfully'));
});


const recentActivities = asyncHandler(async (req, res) => {

    const userid = req.user._id;
    const organizationId = req.organization._id;

    if (!userid) {
        throw new ApiError(401, 'User session is invalid');
    }

    // Example activity query (replace with actual activity logic)
    const activities = await AuditLog.find({ performedBy: userid, organization: organizationId })  
        .populate('performedBy', 'username')
        .populate('todo', 'name')
        .populate('team', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    return res
        .status(200)
        .json(new ApiResponse(200, activities, 'Recent activities fetched successfully'));
});

export {
    registerUser,
    loginUser, 
    logoutUser,
    updateUser,
    deleteUser,
    getCurrentUser,
    refreshAuthToken,
    getUserNotifications,
    searchUsers,
    recentActivities
}
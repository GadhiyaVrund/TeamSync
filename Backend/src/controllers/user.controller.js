import {asyncHandler} from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

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

    //wait untill user is created
    const createdUser = await User.findById(user._id);


    return res
    .status(201)
    .json(new ApiResponse(201, 'User registered successfully', createdUser));
})


const genereateAuthReftoken = async (user) =>{
    const authToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { authToken, refreshToken };
}


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


    const { authToken, refreshToken } = await genereateAuthReftoken(user);
    //store tokens in cookies 
    const rules = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    }

    return res
    .status(200)
    .cookie('authToken', authToken, rules)
    .cookie('refreshToken', refreshToken, rules)
    .json(new ApiResponse(200, 'Login successful', { authToken, refreshToken }));

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
    .json(new ApiResponse(200, 'Logout successful'));


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

    const { authToken, refreshToken } = await genereateAuthReftoken(user);
    const rules = {
        httpOnly: true,
        secure: true,
    };

    return res
    .status(200)
    .cookie('authToken', authToken, rules)
    .cookie('refreshToken', refreshToken, rules)
    .json(new ApiResponse(200, 'Tokens refreshed successfully', { authToken, refreshToken }));
});



const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const allowedFields = ['username', 'email', 'mobileNo', 'password'];

    const updates = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, 'No valid fields provided for update');
    }

    // Check for uniqueness conflicts for username/email/mobileNo
    const conflictQuery = [];
    if (updates.email) conflictQuery.push({ email: updates.email });
    if (updates.username) conflictQuery.push({ username: updates.username });
    if (updates.mobileNo) conflictQuery.push({ mobileNo: updates.mobileNo });

    if (conflictQuery.length) {
        const conflict = await User.findOne({
            $or: conflictQuery,
            _id: { $ne: id }
        });
        if (conflict) {
            throw new ApiError(409, 'One of the provided fields is already in use');
        }
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    Object.assign(user, updates);
    await user.save();

    const updated = await User.findById(id).select('-refreshToken');
    return res.status(200).json(new ApiResponse(200, 'User updated successfully', updated));
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!req.user || req.user._id.toString() !== id) {
        throw new ApiError(403, 'Not authorized to delete this account');
    }

    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    await User.deleteOne({ _id: id });

    return res
    .status(200)
    .clearCookie('authToken')
    .clearCookie('refreshToken')
    .json(new ApiResponse(200, 'Account deleted successfully'));
});




export {
    registerUser,
    loginUser, 
    logoutUser,
    updateUser,
    deleteUser,
    getCurrentUser,
    refreshAuthToken
}
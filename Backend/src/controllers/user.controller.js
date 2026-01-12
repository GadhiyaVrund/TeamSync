import {asyncHandler} from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';

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
    await user.save({validationBeforeSave: false});

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
        throw new ApiError(401, 'Invalid credentials');
    }

    if(!(await user.comparePassword(password))){
        throw new ApiError(401, 'Invalid Password...');
    }

    const { authToken, refreshToken } = await genereateAuthReftoken(user);

    return res
    .status(200)
    .json(new ApiResponse(200, 'Login successful', { authToken, refreshToken }));

})




export {
    registerUser,
    loginUser
}
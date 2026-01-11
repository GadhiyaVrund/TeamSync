import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';

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

    return res
    .status(201)
    .json(new ApiResponse(201, 'User registered successfully', { userId: user._id }));
})

export {
    registerUser
}
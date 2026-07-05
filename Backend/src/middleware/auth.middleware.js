import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';

const verifyJwt = asyncHandler(async (req, res, next) => {
    const authToken = req.cookies?.authToken;
        
    if (!authToken) {
        throw new ApiError(401, 'Authentication token is missing');
    }

    
    let decodedToken;

    try {
        decodedToken = jwt.verify(
            authToken,
            process.env.ACCESS_TOKEN 
        );
    } catch (_error) {
        throw new ApiError(401, 'Authentication token is invalid');
    }

    const user = await User.findById(decodedToken?._id).select('-refreshToken');

    if (!user) {
        throw new ApiError(401, 'User not found for provided token');
    }

    req.user = user;
    req.authToken = authToken;

    next();
});

export { verifyJwt };
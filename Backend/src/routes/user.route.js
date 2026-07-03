import {
    registerUser, loginUser, logoutUser,
    updateUser, deleteUser, getCurrentUser,
    refreshAuthToken, getUserNotifications,
    searchUsers, recentActivities 
} from "../controllers/user.controller.js";

import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { loginRateLimiter, registerRateLimiter } from '../middleware/ratelimit.middleware.js';


const router = express.Router();

router.route('/register').post(registerRateLimiter, registerUser);
router.route('/login').post(loginRateLimiter, loginUser);
router.route('/logout').post(verifyJwt,logoutUser);
router.route('/me').get(verifyJwt, getCurrentUser);
router.route('/notifications').get(verifyJwt, getUserNotifications);
router.route('/search').get(verifyJwt, searchUsers);
router.route('/refresh').post(refreshAuthToken);
router.route('/:id').patch(verifyJwt, updateUser);
router.route('/:id').delete(verifyJwt, deleteUser);
router.route('/activities').get(verifyJwt, recentActivities);
export default router;
import {
    registerUser, loginUser, logoutUser,
    updateUser, deleteUser, getCurrentUser,
    refreshAuthToken, getUserNotifications,
    searchUsers, recentActivities 
} from "../controllers/user.controller.js";

import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { verifyTenant } from '../middleware/tenant.middleware.js';
import { loginRateLimiter, registerRateLimiter } from '../middleware/ratelimit.middleware.js';


const router = express.Router();
const protectedMiddlewares = [verifyJwt, verifyTenant];

router.route('/register').post(registerRateLimiter, registerUser);
router.route('/login').post(loginRateLimiter, loginUser);
router.route('/logout').post(...protectedMiddlewares, logoutUser);
router.route('/me').get(...protectedMiddlewares, getCurrentUser);
router.route('/notifications').get(...protectedMiddlewares, getUserNotifications);
router.route('/search').get(...protectedMiddlewares, searchUsers);
router.route('/refresh').post(refreshAuthToken);
router.route('/:id').patch(...protectedMiddlewares, updateUser);
router.route('/:id').delete(...protectedMiddlewares, deleteUser);
router.route('/activities').get(...protectedMiddlewares, recentActivities);
export default router;
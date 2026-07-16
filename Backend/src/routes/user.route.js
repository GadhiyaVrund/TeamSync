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
const authMiddlewares = [verifyJwt];
const tenantMiddlewares = [verifyJwt, verifyTenant];

router.route('/register').post(registerRateLimiter, registerUser);
router.route('/login').post(loginRateLimiter, loginUser);
router.route('/logout').post(...authMiddlewares, logoutUser);
router.route('/me').get(...authMiddlewares, getCurrentUser);
router.route('/notifications').get(...tenantMiddlewares, getUserNotifications);
router.route('/search').get(...tenantMiddlewares, searchUsers);
router.route('/refresh').post(refreshAuthToken);
router.route('/:id').patch(...tenantMiddlewares, updateUser);
router.route('/:id').delete(...tenantMiddlewares, deleteUser);
router.route('/activities').get(...tenantMiddlewares, recentActivities);
export default router;
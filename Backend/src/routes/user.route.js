import { registerUser, loginUser, logoutUser, updateUser, deleteUser, getCurrentUser, refreshAuthToken, getUserNotifications, searchUsers } from "../controllers/user.controller.js";

import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';


const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJwt,logoutUser);
router.route('/me').get(verifyJwt, getCurrentUser);
router.route('/notifications').get(verifyJwt, getUserNotifications);
router.route('/search').get(verifyJwt, searchUsers);
router.route('/refresh').post(refreshAuthToken);
router.route('/:id').patch(verifyJwt, updateUser);
router.route('/:id').delete(verifyJwt, deleteUser);
export default router;
import { registerUser, loginUser, logoutUser, updateUser, deleteUser, getCurrentUser, refreshAuthToken } from "../controllers/user.controller.js";

import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';


const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(verifyJwt,loginUser);
router.route('/logout').post(verifyJwt,logoutUser);
router.route('/me').get(verifyJwt, getCurrentUser);
router.route('/refresh').post(refreshAuthToken);
router.route('/:id').patch(verifyJwt, updateUser);
router.route('/:id').delete(verifyJwt, deleteUser);
export default router;
import { registerUser, loginUser, logoutUser, updateUser, deleteUser } from "../controllers/user.controller.js";

import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';


const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(verifyJwt,loginUser);
router.route('/logout').post(verifyJwt,logoutUser);
router.route('/:id').patch(verifyJwt, updateUser);
router.route('/:id').delete(verifyJwt, deleteUser);
export default router;
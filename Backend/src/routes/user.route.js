import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { verify } from "jsonwebtoken";
import express from 'express';



const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(verify,loginUser);
router.route('/logout').post(verify,logoutUser);
export default router;
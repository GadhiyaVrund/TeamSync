import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';
import {
  requestToJoinTeam,
  acceptJoinRequest,
  approveJoinRequest,
  rejectJoinRequest
} from '../controllers/joinRequest.controller.js';

const router = express.Router();

router.use(verifyJwt);

// User to admin join request
router.route('/teams/:teamId')
  .post(requestToJoinTeam);

// Admin actions
router.route('/:requestId/approve')
  .post(approveJoinRequest);

router.route('/:requestId/accept')
  .post(acceptJoinRequest);

router.route('/:requestId/reject')
  .post(rejectJoinRequest);

export default router;

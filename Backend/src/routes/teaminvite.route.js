import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';
import {
  createTeamInvite,
  acceptTeamInvite
} from '../controllers/teaminvite.controller.js';

const router = express.Router();

router.use(verifyJwt);

// Admin to user invite
router.route('/teams/:teamId')
  .post(createTeamInvite);

// Invited user accepts invite
router.route('/:inviteId/accept')
  .post(acceptTeamInvite);

export default router;

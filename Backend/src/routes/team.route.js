import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';
import {
  createTeam,
  getUserTeams,
  getTeamById,
  updateTeam,
  getLogs,
  deleteTeam,
  addMember,
  removeMember,
  updateMemberRole,
  leaveTeam
} from '../controllers/team.controller.js';
import { requestUserToJoinTeam } from '../controllers/joinRequest.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJwt);

// Team routes
router.route('/')
  .post(createTeam)           // Create a new team
  .get(getUserTeams);         // Get all teams for authenticated user

router.route('/:teamId')
  .get(getTeamById)           // Get team by ID
  .patch(updateTeam)          // Update team details
  .delete(deleteTeam);        // Delete team

router.route('/:teamId/logs')
  .get(getLogs);              // Get team logs

// Member management routes
router.route('/:teamId/members')
  .post(addMember);           // Add member to team

router.route('/:teamId/members/:memberId')
  .delete(removeMember)       // Remove member from team
  .patch(updateMemberRole);   // Update member role

router.route('/:teamId/leave')
  .post(leaveTeam);           // Leave team

router.route('/:teamId/request-user')
  .post(requestUserToJoinTeam);



export default router;
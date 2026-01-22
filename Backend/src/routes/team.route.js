import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';
import {
  createTeam,
  getUserTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  updateMemberRole,
  createTask,
  getTeamTasks,
  updateTask,
  deleteTask,
  leaveTeam
} from '../controllers/team.controller.js';

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

// Member management routes
router.route('/:teamId/members')
  .post(addMember);           // Add member to team

router.route('/:teamId/members/:memberId')
  .delete(removeMember)       // Remove member from team
  .patch(updateMemberRole);   // Update member role

router.route('/:teamId/leave')
  .post(leaveTeam);           // Leave team



export default router;

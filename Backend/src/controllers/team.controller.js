import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Team from '../models/team.model.js';
import { Todo } from '../models/todos.model.js';
import { User } from '../models/user.model.js';

// Create a new team
const createTeam = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user._id;

  if (!name) {
    throw new ApiError(400, 'Team name is required');
  }

  // Check if team with same name already exists for this user
  const existingTeam = await Team.findOne({ 
    name, 
    'members.user': userId 
  });

  if (existingTeam) {
    throw new ApiError(409, 'You already have a team with this name');
  }

  // Create team with creator as admin
  const team = await Team.create({
    name,
    description,
    members: [
      {
        user: userId,
        role: 'admin',
        joinedAt: new Date()
      }
    ]
  });

  const createdTeam = await Team.findById(team._id)
    .populate('members.user', 'username email fullName');

  return res
    .status(201)
    .json(new ApiResponse(201, createdTeam, 'Team created successfully'));
});

// Get all teams for the authenticated user
const getUserTeams = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const teams = await Team.find({ 'members.user': userId })
    .populate('members.user', 'username email fullName')
    .populate('tasks')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, teams, 'Teams fetched successfully'));
});

// Get team by ID
const getTeamById = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user._id;

  const team = await Team.findById(teamId)
    .populate('members.user', 'username email fullName')
    .populate({
      path: 'tasks',
      populate: {
        path: 'assignedTo',
        select: 'username email fullName'
      }
    });

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if user is a member of the team
  const isMember = team.members.some(
    (member) => member.user._id.toString() === userId.toString()
  );

  if (!isMember) {
    throw new ApiError(403, 'You are not a member of this team');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, team, 'Team fetched successfully'));
});

// Update team details
const updateTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { name, description, isActive } = req.body;
  const userId = req.user._id;

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if user is admin of the team
  const userMember = team.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!userMember || userMember.role !== 'admin') {
    throw new ApiError(403, 'Only team admins can update team details');
  }

  // Update fields
  if (name) team.name = name;
  if (description !== undefined) team.description = description;
  if (isActive !== undefined) team.isActive = isActive;

  await team.save();

  const updatedTeam = await Team.findById(teamId)
    .populate('members.user', 'username email fullName');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTeam, 'Team updated successfully'));
});

// Delete team
const deleteTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user._id;

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if user is admin of the team
  const userMember = team.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!userMember || userMember.role !== 'admin') {
    throw new ApiError(403, 'Only team admins can delete the team');
  }

  // Delete all tasks associated with this team
  await Todo.deleteMany({ team: teamId });

  // Delete the team
  await Team.findByIdAndDelete(teamId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Team and all associated tasks deleted successfully'));
});

// Add member to team
const addMember = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { userId: newUserId, role = 'member' } = req.body;
  const userId = req.user._id;

  if (!newUserId) {
    throw new ApiError(400, 'User ID is required');
  }

  // Check if the user to be added exists
  const userExists = await User.findById(newUserId);
  if (!userExists) {
    throw new ApiError(404, 'User not found');
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if current user is admin of the team
  const currentUserMember = team.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!currentUserMember || currentUserMember.role !== 'admin') {
    throw new ApiError(403, 'Only team admins can add members');
  }

  // Check if user is already a member
  const memberExists = team.members.some(
    (member) => member.user.toString() === newUserId.toString()
  );

  if (memberExists) {
    throw new ApiError(409, 'User is already a member of this team');
  }

  // Add member
  team.members.push({
    user: newUserId,
    role,
    joinedAt: new Date()
  });

  await team.save();

  const updatedTeam = await Team.findById(teamId)
    .populate('members.user', 'username email fullName');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTeam, 'Member added successfully'));
});

// Remove member from team
const removeMember = asyncHandler(async (req, res) => {
  const { teamId, memberId } = req.params;
  const userId = req.user._id;

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if current user is admin of the team
  const currentUserMember = team.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!currentUserMember || currentUserMember.role !== 'admin') {
    throw new ApiError(403, 'Only team admins can remove members');
  }

  // Check if member exists in team
  const memberToRemove = team.members.find(
    (member) => member.user.toString() === memberId.toString()
  );

  if (!memberToRemove) {
    throw new ApiError(404, 'Member not found in this team');
  }

  // Prevent removing the last admin
  const adminCount = team.members.filter((member) => member.role === 'admin').length;
  if (memberToRemove.role === 'admin' && adminCount === 1) {
    throw new ApiError(400, 'Cannot remove the last admin. Promote another member first');
  }

  // Remove member
  team.members = team.members.filter(
    (member) => member.user.toString() !== memberId.toString()
  );

  await team.save();

  const updatedTeam = await Team.findById(teamId)
    .populate('members.user', 'username email fullName');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTeam, 'Member removed successfully'));
});

// Update member role
const updateMemberRole = asyncHandler(async (req, res) => {
  const { teamId, memberId } = req.params;
  const { role } = req.body;
  const userId = req.user._id;

  if (!role || !['admin', 'member', 'viewer'].includes(role)) {
    throw new ApiError(400, 'Valid role is required (admin, member, or viewer)');
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if current user is admin of the team
  const currentUserMember = team.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!currentUserMember || currentUserMember.role !== 'admin') {
    throw new ApiError(403, 'Only team admins can update member roles');
  }

  // Find the member to update
  const memberToUpdate = team.members.find(
    (member) => member.user.toString() === memberId.toString()
  );

  if (!memberToUpdate) {
    throw new ApiError(404, 'Member not found in this team');
  }

  // Prevent demoting the last admin
  const adminCount = team.members.filter((member) => member.role === 'admin').length;
  if (memberToUpdate.role === 'admin' && role !== 'admin' && adminCount === 1) {
    throw new ApiError(400, 'Cannot demote the last admin. Promote another member first');
  }

  // Update role
  memberToUpdate.role = role;

  await team.save();

  const updatedTeam = await Team.findById(teamId)
    .populate('members.user', 'username email fullName');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTeam, 'Member role updated successfully'));
});

// Create task for team
const createTask = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { name, description, assignedTo, status } = req.body;
  const userId = req.user._id;

  if (!name) {
    throw new ApiError(400, 'Task name is required');
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if user is a member of the team
  const isMember = team.members.some(
    (member) => member.user.toString() === userId.toString()
  );

  if (!isMember) {
    throw new ApiError(403, 'You are not a member of this team');
  }

  // If assignedTo is provided, verify they are a team member
  if (assignedTo) {
    const assigneeIsMember = team.members.some(
      (member) => member.user.toString() === assignedTo.toString()
    );

    if (!assigneeIsMember) {
      throw new ApiError(400, 'Assigned user is not a member of this team');
    }
  }

  // Create task
  const task = await Todo.create({
    name,
    description,
    team: teamId,
    assignedTo: assignedTo || null,
    status: status || 'pending'
  });

  // Add task to team
  team.tasks.push(task._id);
  await team.save();

  const createdTask = await Todo.findById(task._id)
    .populate('assignedTo', 'username email fullName')
    .populate('team', 'name');

  return res
    .status(201)
    .json(new ApiResponse(201, createdTask, 'Task created successfully'));
});

// Get all tasks for a team
const getTeamTasks = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user._id;

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if user is a member of the team
  const isMember = team.members.some(
    (member) => member.user.toString() === userId.toString()
  );

  if (!isMember) {
    throw new ApiError(403, 'You are not a member of this team');
  }

  const tasks = await Todo.find({ team: teamId })
    .populate('assignedTo', 'username email fullName')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, 'Tasks fetched successfully'));
});

// Update task
const updateTask = asyncHandler(async (req, res) => {
  const { teamId, taskId } = req.params;
  const { name, description, assignedTo, status, completed } = req.body;
  const userId = req.user._id;

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if user is a member of the team
  const isMember = team.members.some(
    (member) => member.user.toString() === userId.toString()
  );

  if (!isMember) {
    throw new ApiError(403, 'You are not a member of this team');
  }

  const task = await Todo.findOne({ _id: taskId, team: teamId });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // If assignedTo is being updated, verify they are a team member
  if (assignedTo !== undefined) {
    if (assignedTo) {
      const assigneeIsMember = team.members.some(
        (member) => member.user.toString() === assignedTo.toString()
      );

      if (!assigneeIsMember) {
        throw new ApiError(400, 'Assigned user is not a member of this team');
      }
    }
    task.assignedTo = assignedTo || null;
  }

  // Update fields
  if (name) task.name = name;
  if (description !== undefined) task.description = description;
  if (status) task.status = status;
  if (completed !== undefined) task.completed = completed;

  await task.save();

  const updatedTask = await Todo.findById(taskId)
    .populate('assignedTo', 'username email fullName')
    .populate('team', 'name');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, 'Task updated successfully'));
});

// Delete task
const deleteTask = asyncHandler(async (req, res) => {
  const { teamId, taskId } = req.params;
  const userId = req.user._id;

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if user is a member of the team
  const userMember = team.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!userMember) {
    throw new ApiError(403, 'You are not a member of this team');
  }

  const task = await Todo.findOne({ _id: taskId, team: teamId });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Remove task from team
  team.tasks = team.tasks.filter(
    (task) => task.toString() !== taskId.toString()
  );
  await team.save();

  // Delete task
  await Todo.findByIdAndDelete(taskId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Task deleted successfully'));
});

// Leave team
const leaveTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user._id;

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Check if user is a member of the team
  const userMember = team.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!userMember) {
    throw new ApiError(404, 'You are not a member of this team');
  }

  // Prevent last admin from leaving
  const adminCount = team.members.filter((member) => member.role === 'admin').length;
  if (userMember.role === 'admin' && adminCount === 1) {
    throw new ApiError(400, 'Cannot leave as the last admin. Promote another member or delete the team');
  }

  // Remove user from team
  team.members = team.members.filter(
    (member) => member.user.toString() !== userId.toString()
  );

  await team.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Successfully left the team'));
});

export {
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
};

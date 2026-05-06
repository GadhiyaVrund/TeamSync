import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Team } from '../models/team.model.js';
import { Todo } from '../models/todos.model.js';
import { User } from '../models/user.model.js';

// Create a new team
const createTeam = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user._id;

  if (!name || name.trim() === '') {
    throw new ApiError(400, 'Team name is required');
  }
  if(description && description.length > 500) {
    throw new ApiError(400, 'Description is required and cannot exceed 500 characters');
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
    .populate({ path: 'tasks', options: { sort: { createdAt: -1 } } })
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
        select: 'username'
      },
      options: { sort: { createdAt: -1 } }
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

//status change kari devanu chhe k member task complete kayra pela leave na kari sake
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

  // aya add karvanu chhe k member task complete kayra pela leave na kari sake


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
  leaveTeam
};

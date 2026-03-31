import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Team } from '../models/team.model.js';
import { User } from '../models/user.model.js';
import { JoinRequest } from '../models/joinRequest.model.js';

const isTeamAdmin = (team, userId) => {
  return team.members.some(
    (member) =>
      member.user.toString() === userId.toString() && member.role === 'admin'
  );
};

const isTeamMember = (team, userId) => {
  return team.members.some(
    (member) => member.user.toString() === userId.toString()
  );
};

const requestToJoinTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const currentUserId = req.user._id;

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  if (isTeamMember(team, currentUserId)) {
    throw new ApiError(400, 'You are already a member of this team');
  }

  const existingRequest = await JoinRequest.findOne({
    teamId,
    userId: currentUserId
  });

  if (existingRequest?.status === 'pending') {
    throw new ApiError(400, 'A pending join request already exists');
  }

  let joinRequest;

  if (existingRequest) {
    existingRequest.status = 'pending';
    existingRequest.createdBy = currentUserId;
    joinRequest = await existingRequest.save();
  } else {
    joinRequest = await JoinRequest.create({
      teamId,
      userId: currentUserId,
      status: 'pending',
      createdBy: currentUserId
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, joinRequest, 'Join request submitted successfully'));
});

const requestUserToJoinTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { userId: targetUserId } = req.body;
  const currentUserId = req.user._id;

  if (!targetUserId) {
    throw new ApiError(400, 'Target userId is required');
  }

  if (targetUserId.toString() === currentUserId.toString()) {
    throw new ApiError(400, 'You cannot invite yourself');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  if (!isTeamAdmin(team, currentUserId)) {
    throw new ApiError(403, 'Only team admins can invite users');
  }

  const targetUser = await User.findById(targetUserId).select('_id');
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (isTeamMember(team, targetUserId)) {
    throw new ApiError(400, 'User is already a member of this team');
  }

  const existingRequest = await JoinRequest.findOne({
    teamId,
    userId: targetUserId
  });

  if (existingRequest?.status === 'pending') {
    throw new ApiError(400, 'A pending join request already exists');
  }

  let joinRequest;

  if (existingRequest) {
    existingRequest.status = 'pending';
    existingRequest.createdBy = currentUserId;
    joinRequest = await existingRequest.save();
  } else {
    joinRequest = await JoinRequest.create({
      teamId,
      userId: targetUserId,
      status: 'pending',
      createdBy: currentUserId
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, joinRequest, 'Join request sent successfully'));
});

const approveJoinRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const currentUserId = req.user._id;

  const joinRequest = await JoinRequest.findById(requestId);
  if (!joinRequest) {
    throw new ApiError(404, 'Join request not found');
  }

  if (joinRequest.status !== 'pending') {
    throw new ApiError(400, 'Join request is no longer pending');
  }

  const team = await Team.findById(joinRequest.teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  if (!isTeamAdmin(team, currentUserId)) {
    throw new ApiError(403, 'Only team admins can approve join requests');
  }

  if (isTeamMember(team, joinRequest.userId)) {
    throw new ApiError(400, 'User is already a team member');
  }

  team.members.push({
    user: joinRequest.userId,
    role: 'member',
    joinedAt: new Date()
  });

  joinRequest.status = 'approved';

  await Promise.all([team.save(), joinRequest.save()]);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Join request approved successfully'));
});

const acceptJoinRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const currentUserId = req.user._id;

  const joinRequest = await JoinRequest.findById(requestId);
  if (!joinRequest) {
    throw new ApiError(404, 'Join request not found');
  }

  if (joinRequest.status !== 'pending') {
    throw new ApiError(400, 'Join request is no longer pending');
  }

  if (joinRequest.userId.toString() !== currentUserId.toString()) {
    throw new ApiError(403, 'You are not allowed to accept this request');
  }

  const team = await Team.findById(joinRequest.teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  if (isTeamMember(team, currentUserId)) {
    throw new ApiError(400, 'You are already a member of this team');
  }

  team.members.push({
    user: currentUserId,
    role: 'member',
    joinedAt: new Date()
  });

  joinRequest.status = 'approved';

  await Promise.all([team.save(), joinRequest.save()]);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Join request accepted successfully'));
});

const rejectJoinRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const currentUserId = req.user._id;

  const joinRequest = await JoinRequest.findById(requestId);
  if (!joinRequest) {
    throw new ApiError(404, 'Join request not found');
  }

  const team = await Team.findById(joinRequest.teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  const isAdmin = isTeamAdmin(team, currentUserId);
  const isTargetUser = joinRequest.userId.toString() === currentUserId.toString();
  if (!isAdmin && !isTargetUser) {
    throw new ApiError(403, 'You are not allowed to reject this request');
  }

  if (joinRequest.status !== 'pending') {
    throw new ApiError(400, 'Only pending requests can be rejected');
  }

  joinRequest.status = 'rejected';
  await joinRequest.save();

  return res
    .status(200)
    .json(new ApiResponse(200, joinRequest, 'Join request rejected successfully'));
});

export {
  requestToJoinTeam,
  requestUserToJoinTeam,
  approveJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest
};

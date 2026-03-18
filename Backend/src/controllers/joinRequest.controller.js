import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Team } from '../models/team.model.js';
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
    joinRequest = await existingRequest.save();
  } else {
    joinRequest = await JoinRequest.create({
      teamId,
      userId: currentUserId,
      status: 'pending'
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, joinRequest, 'Join request submitted successfully'));
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

  if (!isTeamAdmin(team, currentUserId)) {
    throw new ApiError(403, 'Only team admins can reject join requests');
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

export { requestToJoinTeam, approveJoinRequest, rejectJoinRequest };

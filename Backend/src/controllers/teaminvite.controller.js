import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Team } from '../models/team.model.js';
import { TeamInvite } from '../models/teamInvite.model.js';
import { User } from '../models/user.model.js';

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

const createTeamInvite = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { userId, email } = req.body;
  const currentUserId = req.user._id;
  const organizationId = req.organization._id;

  if (!userId && !email) {
    throw new ApiError(400, 'Either userId or email is required');
  }

  const team = await Team.findOne({ _id: teamId, organization: organizationId });
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  if (!isTeamAdmin(team, currentUserId)) {
    throw new ApiError(403, 'Only team admins can invite users');
  }

  let inviteUserId = null;
  let inviteEmail = null;

  if (userId) {
    const targetUser = await User.findOne({ _id: userId, organization: organizationId });
    if (!targetUser) {
      throw new ApiError(404, 'Target user not found');
    }

    inviteUserId = targetUser._id;
    inviteEmail = targetUser.email;

    if (isTeamMember(team, inviteUserId)) {
      throw new ApiError(400, 'User is already a team member');
    }
  } else {
    inviteEmail = String(email).trim().toLowerCase();
    if (!inviteEmail) {
      throw new ApiError(400, 'Valid email is required');
    }

    const existingUser = await User.findOne({ email: inviteEmail });
    if (existingUser) {
      inviteUserId = existingUser._id;
      if (isTeamMember(team, inviteUserId)) {
        throw new ApiError(400, 'User is already a team member');
      }
    }
  }

  const existingPendingInvite = await TeamInvite.findOne({
    teamId,
    organization: organizationId,
    status: 'pending',
    $or: [
      ...(inviteUserId ? [{ userId: inviteUserId }] : []),
      ...(inviteEmail ? [{ email: inviteEmail }] : [])
    ]
  });

  if (existingPendingInvite) {
    throw new ApiError(400, 'A pending invite already exists');
  }

  const teamInvite = await TeamInvite.create({
    teamId,
    organization: organizationId,
    userId: inviteUserId,
    email: inviteEmail,
    role: 'member',
    status: 'pending',
    token: crypto.randomBytes(24).toString('hex'),
    createdBy: currentUserId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  return res
    .status(200)
    .json(new ApiResponse(200, teamInvite, 'Team invite created successfully'));
});

const acceptTeamInvite = asyncHandler(async (req, res) => {
  const { inviteId } = req.params;
  const currentUserId = req.user._id;
  const organizationId = req.organization._id;

  const invite = await TeamInvite.findOne({ _id: inviteId, organization: organizationId });
  if (!invite) {
    throw new ApiError(404, 'Invite not found');
  }

  if (invite.status !== 'pending') {
    throw new ApiError(400, 'Invite is no longer pending');
  }

  if (new Date(invite.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(400, 'Invite has expired');
  }

  if (invite.userId && invite.userId.toString() !== currentUserId.toString()) {
    throw new ApiError(403, 'This invite is not assigned to your account');
  }

  if (
    !invite.userId &&
    invite.email &&
    req.user.email?.toLowerCase() !== invite.email.toLowerCase()
  ) {
    throw new ApiError(403, 'This invite is not assigned to your email');
  }

  const team = await Team.findOne({ _id: invite.teamId, organization: organizationId });
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

  invite.status = 'accepted';
  invite.userId = currentUserId;

  await Promise.all([team.save(), invite.save()]);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Invite accepted successfully'));
});

export { createTeamInvite, acceptTeamInvite };

import crypto from 'crypto';
import mongoose from 'mongoose';
import { Organization } from '../models/organization.model.js';
import { User } from '../models/user.model.js';
import { Team } from '../models/team.model.js';
import { Todo } from '../models/todos.model.js';
import { JoinRequest } from '../models/joinRequest.model.js';
import { TeamInvite } from '../models/teamInvite.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { ApiError } from '../utils/ApiError.js';
import { issueAuthTokens } from './auth.service.js';

const JOIN_CODE_LENGTH = 16;
const JOIN_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const INCOMPLETE_TODO_STATUSES = ['to-do', 'pending', 'in-progress', 'in-review'];

const normalizeOrganizationName = (name) => String(name || '').trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeJoinCode = (joinCode) => String(joinCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const formatJoinCode = (joinCode) => {
  const normalized = normalizeJoinCode(joinCode);
  return normalized.match(/.{1,4}/g)?.join('-') || normalized;
};

const generateJoinCode = async (session) => {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let candidate = '';

    for (let index = 0; index < JOIN_CODE_LENGTH; index += 1) {
      candidate += JOIN_CODE_ALPHABET[crypto.randomInt(JOIN_CODE_ALPHABET.length)];
    }

    const existingOrganization = await Organization.findOne({ joinCode: candidate }).session(session);
    if (!existingOrganization) {
      return candidate;
    }
  }

  throw new ApiError(500, 'Unable to generate a unique join code');
};

const findOrganizationMember = (organization, userId) => {
  if (!organization) {
    return null;
  }

  return organization.members.find((member) => {
    const memberUserId = member.userId || member.user;
    return memberUserId?.toString?.() === userId.toString();
  }) || null;
};

const loadEligibleUser = async (userId, session) => {
  const user = await User.findById(userId).session(session);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.organization) {
    throw new ApiError(409, 'User already belongs to an organization');
  }

  return user;
};

const createOrganizationForUser = async ({ userId, name }) => {
  const normalizedName = normalizeOrganizationName(name);

  if (!normalizedName) {
    throw new ApiError(400, 'Organization name is required');
  }

  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const user = await loadEligibleUser(userId, session);
      const duplicateOrganization = await Organization.findOne({
        name: { $regex: `^${escapeRegExp(normalizedName)}$`, $options: 'i' }
      }).session(session);

      if (duplicateOrganization) {
        throw new ApiError(409, 'Organization name already exists');
      }

      const joinCode = await generateJoinCode(session);
      const [organization] = await Organization.create([
        {
          name: normalizedName,
          joinCode,
          joinCodeGeneratedAt: new Date(),
          isActive: true,
          members: [
            {
              userId: user._id,
              user: user._id,
              role: 'admin',
              joinedAt: new Date()
            }
          ]
        }
      ], { session });

      user.organization = organization._id;
      await user.save({ session, validateBeforeSave: false });

      await AuditLog.insertMany([
        {
          performedBy: user._id,
          organization: organization._id,
          todo: null,
          team: null,
          action: 'organization_created',
          metadata: {
            organizationName: organization.name,
            joinCode: organization.joinCode
          }
        },
        {
          performedBy: user._id,
          organization: organization._id,
          todo: null,
          team: null,
          action: 'role_changed',
          metadata: {
            previousRole: null,
            newRole: 'admin'
          }
        }
      ], { session });

      const refreshedUser = await User.findById(user._id).session(session).select('-refreshToken');
      const { authToken, refreshToken } = await issueAuthTokens(user, { session });

      result = {
        user: refreshedUser,
        organization,
        authToken,
        refreshToken
      };
    });

    return result;
  } finally {
    session.endSession();
  }
};

const joinOrganizationForUser = async ({ userId, name, joinCode }) => {
  const normalizedName = normalizeOrganizationName(name);
  const normalizedJoinCode = normalizeJoinCode(joinCode);

  if (!normalizedName) {
    throw new ApiError(400, 'Organization name is required');
  }

  if (!normalizedJoinCode) {
    throw new ApiError(400, 'Join code is required');
  }

  if (normalizedJoinCode.length < 12 || normalizedJoinCode.length > 16) {
    throw new ApiError(400, 'Join code is invalid');
  }

  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const user = await loadEligibleUser(userId, session);
      const organization = await Organization.findOne({
        name: { $regex: `^${escapeRegExp(normalizedName)}$`, $options: 'i' },
        joinCode: normalizedJoinCode,
        isActive: true
      }).session(session);

      if (!organization) {
        throw new ApiError(404, 'Organization not found or join code is invalid');
      }

      const existingMember = findOrganizationMember(organization, user._id);
      if (existingMember) {
        throw new ApiError(409, 'User is already a member of this organization');
      }

      organization.members.push({
        userId: user._id,
        user: user._id,
        role: 'member',
        joinedAt: new Date()
      });

      user.organization = organization._id;

      await Promise.all([
        organization.save({ session }),
        user.save({ session, validateBeforeSave: false }),
        AuditLog.create([
          {
            performedBy: user._id,
            organization: organization._id,
            todo: null,
            team: null,
            action: 'organization_joined',
            metadata: {
              organizationName: organization.name,
              joinCode: organization.joinCode
            }
          },
          {
            performedBy: user._id,
            organization: organization._id,
            todo: null,
            team: null,
            action: 'role_changed',
            metadata: {
              previousRole: null,
              newRole: 'member'
            }
          }
        ], { session })
      ]);

      const refreshedUser = await User.findById(user._id).session(session).select('-refreshToken');
      const { authToken, refreshToken } = await issueAuthTokens(user, { session });

      result = {
        user: refreshedUser,
        organization,
        authToken,
        refreshToken
      };
    });

    return result;
  } finally {
    session.endSession();
  }
};

const getOrganizationForUser = async (userId) => {
  const user = await User.findById(userId).select('organization');

  if (!user?.organization) {
    return null;
  }

  return Organization.findById(user.organization)
    .populate('members.userId', 'username email')
    .populate('members.user', 'username email');
};

const regenerateOrganizationJoinCode = async ({ userId }) => {
  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user?.organization) {
        throw new ApiError(404, 'Organization not found');
      }

      const organization = await Organization.findById(user.organization).session(session);
      if (!organization || organization.isActive === false) {
        throw new ApiError(404, 'Organization not found');
      }

      const member = findOrganizationMember(organization, user._id);
      if (!member || member.role !== 'admin') {
        throw new ApiError(403, 'Only organization admins can regenerate the join code');
      }

      const previousJoinCode = organization.joinCode;
      organization.joinCode = await generateJoinCode(session);
      organization.joinCodeGeneratedAt = new Date();
      await organization.save({ session });

      await AuditLog.create([
        {
          performedBy: user._id,
          organization: organization._id,
          todo: null,
          team: null,
          action: 'join_code_regenerated',
          metadata: {
            previousJoinCode,
            joinCode: organization.joinCode
          }
        }
      ], { session });

      result = organization;
    });

    return result;
  } finally {
    session.endSession();
  }
};

const canUserLeaveOrganization = async ({ userId, organizationId }) => {
  const memberTaskCounts = await Todo.aggregate([
    {
      $match: {
        organization: new mongoose.Types.ObjectId(organizationId),
        assignedTo: new mongoose.Types.ObjectId(userId),
        status: { $in: INCOMPLETE_TODO_STATUSES }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  if (memberTaskCounts.length > 0) {
    const statusSummary = memberTaskCounts.map((entry) => `${entry._id}: ${entry.count}`).join(', ');
    throw new ApiError(400, `Cannot leave organization while assigned todos are still incomplete (${statusSummary})`);
  }

  const teams = await Team.find({
    organization: organizationId,
    'members.user': userId
  }).select('members name');

  const blockingTeam = teams.find((team) => {
    const member = team.members.find((teamMember) => teamMember.user.toString() === userId.toString());
    if (!member || member.role !== 'admin') {
      return false;
    }

    const adminCount = team.members.filter((teamMember) => teamMember.role === 'admin').length;
    return adminCount <= 1;
  });

  if (blockingTeam) {
    throw new ApiError(400, `Cannot leave organization while you are the only admin of team "${blockingTeam.name}"`);
  }
};

const leaveOrganizationForUser = async ({ userId }) => {
  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user?.organization) {
        throw new ApiError(404, 'Organization not found');
      }

      const organization = await Organization.findById(user.organization).session(session);
      if (!organization) {
        throw new ApiError(404, 'Organization not found');
      }

      const member = findOrganizationMember(organization, user._id);
      if (!member) {
        throw new ApiError(404, 'User is not a member of this organization');
      }

      await canUserLeaveOrganization({ userId: user._id, organizationId: organization._id });

      organization.members = organization.members.filter((organizationMember) => {
        const memberUserId = organizationMember.userId || organizationMember.user;
        return memberUserId?.toString?.() !== user._id.toString();
      });

      const teamMemberships = await Team.find({
        organization: organization._id,
        'members.user': user._id
      }).session(session);

      for (const team of teamMemberships) {
        team.members = team.members.filter((teamMember) => teamMember.user.toString() !== user._id.toString());
        await team.save({ session });
      }

      await Promise.all([
        JoinRequest.deleteMany({
          organization: organization._id,
          $or: [
            { userId: user._id },
            { createdBy: user._id }
          ]
        }).session(session),
        TeamInvite.deleteMany({
          organization: organization._id,
          $or: [
            { userId: user._id },
            { email: user.email }
          ]
        }).session(session),
        organization.save({ session }),
        AuditLog.create([
          {
            performedBy: user._id,
            organization: organization._id,
            todo: null,
            team: null,
            action: 'organization_left',
            metadata: {
              organizationName: organization.name,
              userEmail: user.email
            }
          }
        ], { session })
      ]);

      user.organization = null;
      await user.save({ session, validateBeforeSave: false });

      const refreshedUser = await User.findById(user._id).session(session).select('-refreshToken');
      const { authToken, refreshToken } = await issueAuthTokens(user, { session });

      result = {
        user: refreshedUser,
        organization: null,
        authToken,
        refreshToken
      };
    });

    return result;
  } finally {
    session.endSession();
  }
};

export {
  createOrganizationForUser,
  formatJoinCode,
  getOrganizationForUser,
  joinOrganizationForUser,
  leaveOrganizationForUser,
  normalizeJoinCode,
  regenerateOrganizationJoinCode
};
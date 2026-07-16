import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  createOrganizationForUser,
  formatJoinCode,
  getOrganizationForUser,
  joinOrganizationForUser,
  leaveOrganizationForUser,
  regenerateOrganizationJoinCode
} from '../services/organization.service.js';
import { getAuthCookieOptions } from '../services/auth.service.js';

const createOrganization = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!req.user) {
    throw new ApiError(401, 'Authentication is required');
  }

  const result = await createOrganizationForUser({
    userId: req.user._id,
    name
  });

  return res
    .status(201)
    .cookie('authToken', result.authToken, getAuthCookieOptions())
    .cookie('refreshToken', result.refreshToken, getAuthCookieOptions())
    .json(new ApiResponse(201, {
      user: result.user,
      organization: {
        ...result.organization.toObject(),
        formattedJoinCode: formatJoinCode(result.organization.joinCode)
      }
    }, 'Organization created successfully'));
});

const joinOrganization = asyncHandler(async (req, res) => {
  const { name, organizationName, joinCode } = req.body;

  if (!req.user) {
    throw new ApiError(401, 'Authentication is required');
  }

  const result = await joinOrganizationForUser({
    userId: req.user._id,
    name: name || organizationName,
    joinCode
  });

  return res
    .status(200)
    .cookie('authToken', result.authToken, getAuthCookieOptions())
    .cookie('refreshToken', result.refreshToken, getAuthCookieOptions())
    .json(new ApiResponse(200, {
      user: result.user,
      organization: {
        ...result.organization.toObject(),
        formattedJoinCode: formatJoinCode(result.organization.joinCode)
      }
    }, 'Organization joined successfully'));
});

const leaveOrganization = asyncHandler(async (req, res) => {
  const result = await leaveOrganizationForUser({
    userId: req.user._id
  });

  return res
    .status(200)
    .cookie('authToken', result.authToken, getAuthCookieOptions())
    .cookie('refreshToken', result.refreshToken, getAuthCookieOptions())
    .json(new ApiResponse(200, result.user, 'Organization left successfully'));
});

const regenerateJoinCode = asyncHandler(async (req, res) => {
  const organization = await regenerateOrganizationJoinCode({
    userId: req.user._id
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {
      ...organization.toObject(),
      formattedJoinCode: formatJoinCode(organization.joinCode)
    }, 'Join code regenerated successfully'));
});

const getMyOrganization = asyncHandler(async (req, res) => {
  const organization = await getOrganizationForUser(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, organization ? {
      ...organization.toObject(),
      formattedJoinCode: formatJoinCode(organization.joinCode)
    } : null, organization ? 'Organization fetched successfully' : 'No organization assigned'));
});

export {
  createOrganization,
  getMyOrganization,
  joinOrganization,
  leaveOrganization,
  regenerateJoinCode
};
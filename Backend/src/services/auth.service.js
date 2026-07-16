import { ApiError } from '../utils/ApiError.js';

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
});

const issueAuthTokens = async (user, { session } = {}) => {
  if (!user) {
    throw new ApiError(400, 'User is required to issue auth tokens');
  }

  const authToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false, session });

  return { authToken, refreshToken };
};

export {
  getAuthCookieOptions,
  issueAuthTokens
};
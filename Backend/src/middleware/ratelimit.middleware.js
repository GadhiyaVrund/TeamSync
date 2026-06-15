import rateLimit from 'express-rate-limit';
import {
    GLOBAL_RATE_LIMIT_MAX,
    LOGIN_RATE_LIMIT_MAX,
    RATE_LIMIT_LEGACY_HEADERS,
    RATE_LIMIT_STANDARD_HEADERS,
    RATE_LIMIT_STATUS_CODE,
    RATE_LIMIT_WINDOW_MS,
    REGISTER_RATE_LIMIT_MAX,
    shouldSkipGlobalRateLimit,
} from '../config/rateLimit.config.js';

const createRateLimitErrorResponse = (message, rateLimitInfo = {}) => {
    const resetAt = rateLimitInfo.resetTime instanceof Date
        ? rateLimitInfo.resetTime.toISOString()
        : rateLimitInfo.resetTime ?? null;

    return {
        success: false,
        statusCode: RATE_LIMIT_STATUS_CODE,
        message,
        errors: [
            {
                message,
                limit: rateLimitInfo.limit ?? null,
                remaining: rateLimitInfo.remaining ?? null,
                resetAt,
            },
        ],
    };
};

const createRateLimitStore = () => {
    // Returning undefined keeps the current deployment in-memory only.
    // Swap this function for a Redis-backed store later and every limiter will inherit it.
    return undefined;
};

const createRateLimitHandler = (message) => {
    return (request, response, _next) => {
        const resetTime = request.rateLimit?.resetTime;
        const retryAfterSeconds = resetTime instanceof Date
            ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
            : Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);

        response
            .status(RATE_LIMIT_STATUS_CODE)
            .set('Retry-After', String(retryAfterSeconds));

        response.json({
            ...createRateLimitErrorResponse(message, request.rateLimit),
            retryAfterSeconds,
        });
    };
};

const createLimiter = ({ limit, message, skip }) => {
    const store = createRateLimitStore();

    return rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MS,
        limit,
        standardHeaders: RATE_LIMIT_STANDARD_HEADERS,
        legacyHeaders: RATE_LIMIT_LEGACY_HEADERS,
        skip,
        handler: createRateLimitHandler(message),
        ...(store ? { store } : {}),
    });
};

const apiRateLimiter = createLimiter({
    limit: GLOBAL_RATE_LIMIT_MAX,
    message: 'Too many API requests. Please try again later.',
    skip: shouldSkipGlobalRateLimit,
});

const loginRateLimiter = createLimiter({
    limit: LOGIN_RATE_LIMIT_MAX,
    message: 'Too many login attempts. Please wait before trying again.',
});

const registerRateLimiter = createLimiter({
    limit: REGISTER_RATE_LIMIT_MAX,
    message: 'Too many registration attempts. Please wait before trying again.',
});

export {
    apiRateLimiter,
    createLimiter,
    createRateLimitErrorResponse,
    createRateLimitHandler,
    createRateLimitStore,
    loginRateLimiter,
    registerRateLimiter,
};
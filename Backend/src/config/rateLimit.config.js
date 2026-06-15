const RATE_LIMIT_STATUS_CODE = 429;
const RATE_LIMIT_STANDARD_HEADERS = 'draft-7';
const RATE_LIMIT_LEGACY_HEADERS = false;

const RATE_LIMIT_WINDOW_MS_DEFAULT = 15 * 60 * 1000;
const GLOBAL_RATE_LIMIT_MAX_DEFAULT = 120;
const LOGIN_RATE_LIMIT_MAX_DEFAULT = 5;
const REGISTER_RATE_LIMIT_MAX_DEFAULT = 3;
const TRUST_PROXY_HOPS_DEFAULT = 0;

const API_PREFIX = '/api/v1';
const EXEMPT_GLOBAL_RATE_LIMIT_PATHS = new Set([
    `${API_PREFIX}/users/login`,
    `${API_PREFIX}/users/register`,
]);

const parsePositiveInteger = (value, fallback) => {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        return fallback;
    }

    return parsedValue;
};

const RATE_LIMIT_WINDOW_MS = parsePositiveInteger(
    process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_WINDOW_MS_DEFAULT
);

const GLOBAL_RATE_LIMIT_MAX = parsePositiveInteger(
    process.env.GLOBAL_RATE_LIMIT_MAX,
    GLOBAL_RATE_LIMIT_MAX_DEFAULT
);

const LOGIN_RATE_LIMIT_MAX = parsePositiveInteger(
    process.env.LOGIN_RATE_LIMIT_MAX,
    LOGIN_RATE_LIMIT_MAX_DEFAULT
);

const REGISTER_RATE_LIMIT_MAX = parsePositiveInteger(
    process.env.REGISTER_RATE_LIMIT_MAX,
    REGISTER_RATE_LIMIT_MAX_DEFAULT
);

const TRUST_PROXY_HOPS = parsePositiveInteger(
    process.env.TRUST_PROXY_HOPS,
    TRUST_PROXY_HOPS_DEFAULT
);

const getRequestPath = (request) => {
    return request.originalUrl.split('?')[0].replace(/\/+$/, '') || '/';
};

const shouldSkipGlobalRateLimit = (request) => {
    // Browser preflight requests should not consume the API budget.
    if (request.method === 'OPTIONS') {
        return true;
    }

    // Login and registration get their own tighter limiters so they are not double-counted.
    return EXEMPT_GLOBAL_RATE_LIMIT_PATHS.has(getRequestPath(request));
};

export {
    API_PREFIX,
    EXEMPT_GLOBAL_RATE_LIMIT_PATHS,
    GLOBAL_RATE_LIMIT_MAX,
    LOGIN_RATE_LIMIT_MAX,
    RATE_LIMIT_LEGACY_HEADERS,
    RATE_LIMIT_STANDARD_HEADERS,
    RATE_LIMIT_STATUS_CODE,
    RATE_LIMIT_WINDOW_MS,
    REGISTER_RATE_LIMIT_MAX,
    TRUST_PROXY_HOPS,
    getRequestPath,
    parsePositiveInteger,
    shouldSkipGlobalRateLimit,
};
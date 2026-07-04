import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { apiRateLimiter } from './middleware/ratelimit.middleware.js';
import { TRUST_PROXY_HOPS } from './config/rateLimit.config.js';
const app = express();

if (TRUST_PROXY_HOPS > 0) {
    // A proxy-aware setup is required in production so rate limiting uses the real client IP.
    app.set('trust proxy', TRUST_PROXY_HOPS);
}

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.use('/api', apiRateLimiter);

import userRoutes from './routes/user.route.js';
import teamRoutes from './routes/team.route.js';
import todoRoutes from './routes/todo.route.js';
import teamInviteRoutes from './routes/teaminvite.route.js';
import joinRequestRoutes from './routes/joinRequest.route.js';

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/todos', todoRoutes);
app.use('/api/v1/team-invites', teamInviteRoutes);
app.use('/api/v1/join-requests', joinRequestRoutes);
app.use('/api/v1/invites', teamInviteRoutes);
app.use('/api/v1/requests', joinRequestRoutes);

// Global JSON error handler — must be after all routes
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || []
    });
});

export default app;
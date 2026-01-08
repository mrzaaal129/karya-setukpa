import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development';

/**
 * General API rate limiter
 * Allows 100 requests per 15 minutes per IP (1000 in dev)
 */
export const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // Reduced to 5 minutes to clear faster
    max: isDev ? 2000 : 500, // Increased prod limit to 500 to handle dashboard polling
    message: { error: 'Terlalu banyak request, coba lagi dalam beberapa menit' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: { error: 'Terlalu banyak permintaan reset password, coba lagi dalam 1 jam' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: { error: 'Terlalu banyak upload, coba lagi nanti' },
    standardHeaders: true,
    legacyHeaders: false,
});

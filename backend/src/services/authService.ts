import prisma from '../lib/prisma.js';
import logger from '../utils/logger.js';

interface LoginAttempt {
    count: number;
    lastAttempt: Date;
    lockedUntil?: Date;
}

// In-memory store for login attempts (for production, use Redis)
const loginAttempts: Map<string, LoginAttempt> = new Map();

// Configuration
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const ATTEMPT_WINDOW_MINUTES = 15;

/**
 * Check if an account is currently locked
 */
export const isAccountLocked = (identifier: string): { locked: boolean; remainingMinutes?: number } => {
    const attempt = loginAttempts.get(identifier);

    if (!attempt || !attempt.lockedUntil) {
        return { locked: false };
    }

    const now = new Date();
    if (now < attempt.lockedUntil) {
        const remainingMs = attempt.lockedUntil.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return { locked: true, remainingMinutes };
    }

    // Lock has expired, clear it
    loginAttempts.delete(identifier);
    return { locked: false };
};

/**
 * Record a failed login attempt
 */
export const recordFailedAttempt = (identifier: string): { locked: boolean; attemptsRemaining: number } => {
    const now = new Date();
    let attempt = loginAttempts.get(identifier);

    if (!attempt) {
        attempt = { count: 0, lastAttempt: now };
    }

    // Reset count if last attempt was outside the window
    const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MINUTES * 60000);
    if (attempt.lastAttempt < windowStart) {
        attempt.count = 0;
    }

    attempt.count++;
    attempt.lastAttempt = now;

    // Lock account if max attempts exceeded
    if (attempt.count >= MAX_ATTEMPTS) {
        attempt.lockedUntil = new Date(now.getTime() + LOCK_DURATION_MINUTES * 60000);
        loginAttempts.set(identifier, attempt);

        logger.warn('Account locked due to too many failed attempts', {
            identifier,
            attempts: attempt.count,
            lockedUntil: attempt.lockedUntil
        });

        return { locked: true, attemptsRemaining: 0 };
    }

    loginAttempts.set(identifier, attempt);
    return { locked: false, attemptsRemaining: MAX_ATTEMPTS - attempt.count };
};

/**
 * Clear login attempts after successful login
 */
export const clearLoginAttempts = (identifier: string): void => {
    loginAttempts.delete(identifier);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password harus minimal 8 karakter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password harus mengandung huruf kecil');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password harus mengandung huruf besar');
    }

    if (!/\d/.test(password)) {
        errors.push('Password harus mengandung angka');
    }

    // Optional: Special character requirement
    // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    //     errors.push('Password harus mengandung karakter khusus');
    // }

    return { valid: errors.length === 0, errors };
};

/**
 * Check for common weak passwords
 */
const commonPasswords = [
    'password', 'password123', '123456', '12345678', 'qwerty',
    'admin', 'admin123', 'letmein', 'welcome', 'monkey',
    'setukpa', 'polri123', 'polisi123'
];

export const isCommonPassword = (password: string): boolean => {
    return commonPasswords.includes(password.toLowerCase());
};

import { randomUUID } from 'crypto';

/**
 * Generate a cryptographically secure unique ID
 * Uses Node.js crypto module instead of Math.random()
 */
export const generateId = (): string => randomUUID();

/**
 * Generate a shorter ID for less critical purposes
 * Still cryptographically secure
 */
export const generateShortId = (): string => {
    return randomUUID().replace(/-/g, '').substring(0, 16);
};

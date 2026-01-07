import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { generateId } from '../utils/idGenerator.js';
import logger from '../utils/logger.js';
import {
    isAccountLocked,
    recordFailedAttempt,
    clearLoginAttempts,
    validatePasswordStrength,
    isCommonPassword
} from '../services/authService.js';

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nosis, password } = req.body;
        logger.debug('Login attempt', { nosis });

        if (!nosis || !password) {
            res.status(400).json({ error: 'NOSIS dan password wajib diisi' });
            return;
        }

        // Check if account is locked
        const lockStatus = isAccountLocked(nosis);
        if (lockStatus.locked) {
            logger.warn('Login attempt on locked account', { nosis });
            res.status(429).json({
                error: `Akun terkunci. Coba lagi dalam ${lockStatus.remainingMinutes} menit.`
            });
            return;
        }

        const user = await prisma.user.findUnique({ where: { nosis } });

        if (!user) {
            recordFailedAttempt(nosis);
            res.status(401).json({ error: 'Nosis atau password salah' });
            return;
        }

        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            const result = recordFailedAttempt(nosis);
            if (result.locked) {
                res.status(429).json({
                    error: 'Terlalu banyak percobaan gagal. Akun terkunci selama 15 menit.'
                });
            } else {
                res.status(401).json({
                    error: `Nosis atau password salah. ${result.attemptsRemaining} percobaan tersisa.`
                });
            }
            return;
        }

        // Clear failed attempts on successful login
        clearLoginAttempts(nosis);

        logger.info('User logged in successfully', { userId: user.id, nosis });
        const token = generateToken({
            userId: user.id,
            role: user.role,
            nosis: user.nosis,
        });

        try {
            await prisma.activityLog.create({
                data: {
                    id: generateId(),
                    userId: user.id,
                    action: 'Login ke Sistem',
                    type: 'INFO',
                    metadata: { ip: req.ip, userAgent: req.headers['user-agent'] }
                }
            });
        } catch (logError) {
            logger.error('Failed to log login activity', { error: logError });
        }

        res.json({
            token,
            user: {
                id: user.id,
                nosis: user.nosis,
                name: user.name,
                role: user.role,
                pembimbingId: user.pembimbingId,
            },
        });

    } catch (error) {
        logger.error('Login error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nosis, name, password, role } = req.body;

        if (!nosis || !name || !password || !role) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { nosis } });

        if (existingUser) {
            res.status(400).json({ error: 'Nosis already registered' });
            return;
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                id: generateId(), // Ensure User ID is also generated if manually created
                nosis,
                name,
                password: hashedPassword,
                role: role || 'SISWA',
                updatedAt: new Date(), // Explicitly setting updatedAt as per some prisma setups
            },
        });

        res.status(201).json({ message: 'User registered successfully', userId: newUser.id });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        // req.user is populated by the authenticate middleware
        // The middleware decodes the token and attaches the payload to req.user
        // payload type is likely { userId: string, role: string, nosis: string, ... }

        // We need to cast req as any or extend the Request type. 
        // Best practice is using AuthRequest interface, but if not available here, we access safely.
        const userId = (req as any).user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nosis: true,
                name: true,
                email: true,
                role: true,
                pembimbingId: true,
                createdAt: true,
                photoUrl: true
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Log activity to mark user as "Online"
        try {
            await prisma.activityLog.create({
                data: {
                    id: generateId(),
                    userId: user.id,
                    action: 'Sesi Aktif',
                    type: 'INFO',
                    metadata: { ip: req.ip, source: 'auto-check' }
                }
            });
        } catch (e) {
            // ignore
        }

        res.json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const heartbeat = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // OPTIMIZATION: Update User.updatedAt instead of creating a new log entry.
        // This prevents database bloat (saving storage) and is faster.
        await prisma.user.update({
            where: { id: userId },
            data: { updatedAt: new Date() }
        });

        res.json({ status: 'ok' });
    } catch (error) {
        // Silent fail for heartbeat
        res.json({ status: 'error' });
    }
};

/**
 * Refresh JWT token
 * User must have valid (not expired) token to refresh
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        const userRole = (req as any).user?.role;
        const userNosis = (req as any).user?.nosis;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, nosis: true, role: true, name: true }
        });

        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        // Generate new token
        const newToken = generateToken({
            userId: user.id,
            role: user.role,
            nosis: user.nosis,
        });

        logger.info('Token refreshed', { userId: user.id });

        res.json({
            token: newToken,
            user: {
                id: user.id,
                nosis: user.nosis,
                name: user.name,
                role: user.role,
            }
        });

    } catch (error) {
        logger.error('Token refresh error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { hashPassword } from '../utils/password.js';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, batchId } = req.query;

        const whereClause: any = {};
        if (role) whereClause.role = role as any;
        if (batchId) whereClause.batchId = batchId as string;

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                nosis: true,
                name: true,
                email: true,
                role: true,
                pembimbingId: true,
                batchId: true, // Include batchId in response
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ users });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nosis: true,
                name: true,
                email: true,
                role: true,
                pembimbingId: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { nosis, name, email, password, role, pembimbingId, batchId } = req.body;

        if (!nosis || !name || !password || !role) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { nosis },
        });

        if (existingUser) {
            res.status(409).json({ error: 'User with this NOSIS already exists' });
            return;
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                nosis,
                name,
                email: email || null,
                password: hashedPassword,
                role,
                pembimbingId,
                batchId,
                updatedAt: new Date()
            },
            select: {
                id: true,
                nosis: true,
                name: true,
                email: true,
                role: true,
                pembimbingId: true,
                createdAt: true,
            },
        });

        res.status(201).json({ user });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, email, role, pembimbingId, password } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email !== undefined) updateData.email = email || null;
        if (role) updateData.role = role;
        if (pembimbingId !== undefined) updateData.pembimbingId = pembimbingId;
        if (password) updateData.password = await hashPassword(password);

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                nosis: true,
                name: true,
                email: true,
                role: true,
                pembimbingId: true,
                createdAt: true,
            },
        });

        res.json({ user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.user.delete({
            where: { id },
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPembimbingList = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const pembimbingList = await prisma.user.findMany({
            where: { role: 'PEMBIMBING' },
            select: {
                id: true,
                name: true,
                nosis: true,
            },
            orderBy: { name: 'asc' },
        });

        res.json({ pembimbingList });
    } catch (error) {
        console.error('Get pembimbing list error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// ... existing imports ...
import fs from 'fs';
import path from 'path';

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { name, email, password } = req.body;
        const file = req.file;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) updateData.password = await hashPassword(password);

        if (file) {
            updateData.photoUrl = `/uploads/${file.filename}`;

            // Optional: delete old photo
            const oldUser = await prisma.user.findUnique({ where: { id: userId } });
            if (oldUser?.photoUrl) {
                const oldPath = path.join(process.cwd(), oldUser.photoUrl.replace(/^\//, ''));
                if (fs.existsSync(oldPath)) {
                    // fs.unlinkSync(oldPath); // Be careful with deleting
                }
            }
        }

        console.log('Update profile request:', { userId, body: req.body, file: req.file });

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            // Select specific fields manually to avoid type issues if generated client is stale
            select: {
                id: true,
                nosis: true,
                name: true,
                email: true,
                role: true,
                pembimbingId: true,
                createdAt: true,
                // photoUrl: true, // Commenting out to prevent TS error during debug if types aren't synced
            },
        });

        // Return full user data including photoUrl (which is returned by default if not selecting, 
        // but here we are selecting. Let's fetch it again or just trust the update)
        // Actually, let's just use the `user` object returned. If we want photoUrl, we need to select it. 
        // If TS complains, we can cast or just not select it and rely on a separate query or loose typing.
        // For now, let's REMOVE the explicit select to get all fields, which is safer for "editing".

        // Return user data with specific fields including photoUrl
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nosis: true,
                name: true,
                email: true,
                role: true,
                pembimbingId: true,
                photoUrl: true,
                batchId: true,
                createdAt: true,
            }
        });

        console.log('Profile updated successfully:', { userId, photoUrl: updatedUser?.photoUrl });

        res.json({ user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ... existing exports ...

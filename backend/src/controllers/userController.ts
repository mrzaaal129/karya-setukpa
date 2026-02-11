import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { supabase } from '../config/storage.js';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, batchId } = req.query;

        const whereClause: any = {};
        if (role) whereClause.role = role as any;
        if (batchId) whereClause.batchId = batchId as string;

        // INVISIBILITY LAYER:
        // Exclude HELPER role from general lists to keep it "Ghost"
        if (!role) {
            whereClause.role = { not: 'HELPER' };
        }

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

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

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

// ... (keep usage of fs/path if needed for cleanup, but mainly we need supabase now)

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.userId) {
            res.status(401).json({ error: 'Unauthorized: No user session found.' });
            return;
        }

        const userId = req.user.userId;
        const { name, email, password } = req.body;
        const file = req.file;

        console.log(`[PROFILE UPDATE] Request for UserID: ${userId}`);
        console.log(`[PROFILE UPDATE] File Present: ${file ? 'YES' : 'NO'}`);

        const updateData: any = {};
        if (name && name.trim() !== '') updateData.name = name;
        if (email !== undefined) updateData.email = email || null; // Allow clearing email
        if (password && password.trim() !== '') {
            updateData.password = await hashPassword(password);
        }

        if (file) {
            console.log('[PROFILE UPDATE] File details:', {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.buffer?.length || 0
            });

            // Check if Supabase is configured
            const supabaseConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
            console.log('[PROFILE UPDATE] Supabase configured:', supabaseConfigured);
            console.log('[PROFILE UPDATE] SUPABASE_URL exists:', Boolean(process.env.SUPABASE_URL));

            if (!supabaseConfigured) {
                console.warn('[PROFILE UPDATE] Supabase not configured, skipping photo upload');
                // Don't fail the profile update just because photo service is down
            } else {
                try {
                    // Generate unique filename
                    const fileExt = file.originalname.split('.').pop();
                    const filename = `${userId}-${Date.now()}.${fileExt}`;

                    // Upload to Supabase
                    const { data, error } = await supabase.storage
                        .from('profile-photos')
                        .upload(filename, file.buffer, {
                            contentType: file.mimetype,
                            upsert: true
                        });

                    if (error) {
                        console.error('[PROFILE UPDATE] Supabase upload error:', error);
                        // Fail gracefully on photo
                    } else {
                        // Get Public URL
                        const { data: { publicUrl } } = supabase.storage
                            .from('profile-photos')
                            .getPublicUrl(filename);

                        console.log('[PROFILE UPDATE] Photo URL Generated:', publicUrl);
                        updateData.photoUrl = publicUrl;
                    }
                } catch (photoError) {
                    console.error('[PROFILE UPDATE] Critical Photo Error:', photoError);
                }
            }
        }

        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ error: 'Tidak ada data yang diubah.' });
            return;
        }

        const user = await prisma.user.update({
            where: { id: userId },
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

        console.log('[PROFILE UPDATE] Success:', { userId });

        res.json({ user: updatedUser });
    } catch (error: any) {
        console.error('[PROFILE UPDATE] CRITICAL ERROR:', error);

        // Prisma record not found
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'User tidak ditemukan.' });
            return;
        }

        // Prisma unique constraint error
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Data sudah ada (Email atau NOSIS sudah digunakan).' });
            return;
        }

        res.status(500).json({ error: error.message || 'Terjadi kesalahan sistem.' });
    }
};


export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(400).json({ error: 'User ID not found in token' });
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
                batchId: true,
                photoUrl: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ... existing exports ...

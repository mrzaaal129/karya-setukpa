import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

import prisma from '../config/database.js';

export const getAdvisors = async (req: Request, res: Response) => {
    try {
        const advisors = await prisma.user.findMany({
            where: {
                role: UserRole.PEMBIMBING,
            },
            select: {
                id: true,
                name: true,
                nrp: true,
                rank: true,
                position: true,
                email: true,
                nosis: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        res.json(advisors);
    } catch (error) {
        console.error('Error fetching advisors:', error);
        res.status(500).json({ error: 'Failed to fetch advisors' });
    }
};

export const createAdvisor = async (req: Request, res: Response) => {
    try {
        const { name, nrp, rank, position, email, password } = req.body;

        // Check if NRP already exists
        const existingAdvisor = await prisma.user.findFirst({
            where: {
                OR: [
                    { nrp: nrp },
                    { nosis: nrp } // Check nosis as well since we map nrp to nosis
                ]
            }
        });

        if (existingAdvisor) {
            return res.status(400).json({ error: 'NRP already registered' });
        }

        const hashedPassword = await bcrypt.hash(password || 'password123', 10);

        const advisor = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                name,
                nrp,
                nosis: nrp, // Map NRP to NOSIS for login compatibility
                rank,
                position,
                email: email || null,
                password: hashedPassword,
                role: UserRole.PEMBIMBING,
                updatedAt: new Date()
            },
        });

        res.status(201).json(advisor);
    } catch (error) {
        console.error('Error creating advisor:', error);
        res.status(500).json({ error: 'Failed to create advisor' });
    }
};

export const updateAdvisor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, nrp, rank, position, email } = req.body;

        const advisor = await prisma.user.update({
            where: { id },
            data: {
                name,
                nrp,
                nosis: nrp, // Keep them in sync
                rank,
                position,
                email: email || null,
            },
        });

        res.json(advisor);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update advisor' });
    }
};

export const deleteAdvisor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check for dependencies
        const gradesCount = await prisma.grade.count({ where: { advisorId: id } });
        const commentsCount = await prisma.comment.count({ where: { authorId: id } });

        if (gradesCount > 0 || commentsCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete advisor. They have associated grades or comments. Consider deactivating instead.'
            });
        }

        // Unassign students
        await prisma.user.updateMany({
            where: { pembimbingId: id },
            data: { pembimbingId: null }
        });

        // Delete activity logs and violations (safe to delete)
        await prisma.activityLog.deleteMany({ where: { userId: id } });
        await prisma.violation.deleteMany({ where: { userId: id } });

        // Delete user
        await prisma.user.delete({ where: { id } });

        res.json({ message: 'Advisor deleted successfully' });
    } catch (error) {
        console.error('Error deleting advisor:', error);
        res.status(500).json({ error: 'Failed to delete advisor' });
    }
};

export const getAssignedStudents = async (req: Request, res: Response) => {
    try {
        const advisorId = (req as any).user?.userId;

        if (!advisorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const students = await prisma.user.findMany({
            where: {
                pembimbingId: advisorId
            },
            select: {
                id: true,
                name: true,
                nrp: true,
                nosis: true,
                Paper: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    select: {
                        id: true,
                        title: true,
                        contentApprovalStatus: true,
                        finalApprovalStatus: true,
                        finalFileUrl: true
                    }
                }
            }
        });

        res.json(students);
    } catch (error) {
        console.error('Error fetching assigned students:', error);
        res.status(500).json({ error: 'Failed to fetch assigned students' });
    }
};

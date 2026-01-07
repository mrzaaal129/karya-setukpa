import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createViolation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { type, description } = req.body;

        if (!type) {
            return res.status(400).json({ error: 'Type is required' });
        }

        const violation = await prisma.violation.create({
            data: {
                id: crypto.randomUUID(),
                userId,
                type,
                description,
                updatedAt: new Date(),
            },
        });

        res.status(201).json(violation);
    } catch (error) {
        console.error('Error creating violation:', error);
        res.status(500).json({ error: 'Failed to create violation record' });
    }
};

export const getMyViolations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const violations = await prisma.violation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json(violations);
    } catch (error) {
        console.error('Error fetching violations:', error);
        res.status(500).json({ error: 'Failed to fetch violations' });
    }
};

// Update resetViolations to be a "Soft Reset"
export const resetViolations = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // 1. Mark all violations as resolved
        const updateViolations = await prisma.violation.updateMany({
            where: { userId, resolved: false },
            data: { resolved: true },
        });

        // 2. Increment user's resetCount
        // We need to fetch current count first or use atomic increment if Prisma supports it (it does)
        const updateUser = await prisma.user.update({
            where: { id: userId },
            data: {
                resetCount: { increment: 1 }
            }
        });

        res.status(200).json({
            message: 'Violations reset successfully (Soft Reset)',
            affected: updateViolations.count,
            resetCount: updateUser.resetCount
        });
    } catch (error) {
        console.error('Error resetting violations:', error);
        res.status(500).json({ error: 'Failed to reset violations' });
    }
};

export const getUserViolations = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const violations = await prisma.violation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(violations);
    } catch (error) {
        console.error('Error fetching user violations:', error);
        res.status(500).json({ error: 'Failed to fetch user violations' });
    }
};

export const getViolationSummary = async (req: Request, res: Response) => {
    try {
        // Fetch users who have violations OR have been reset at least once
        // We want to list students with issues.
        const users = await prisma.user.findMany({
            where: {
                role: 'SISWA',
                OR: [
                    { resetCount: { gt: 0 } },
                    { Violation: { some: {} } }
                ]
            },
            select: {
                id: true,
                name: true,
                nosis: true,
                resetCount: true,
                _count: {
                    select: {
                        Violation: { where: { resolved: false } }
                    }
                }
            },
            orderBy: [
                // Prioritize active violations, then high reset counts
                { resetCount: 'desc' }
            ]
        });

        // Format data
        const summary = users.map(u => ({
            id: u.id,
            name: u.name,
            nosis: u.nosis,
            activeViolations: u._count.Violation,
            resetCount: u.resetCount
        })).filter(u => u.activeViolations > 0 || u.resetCount > 0);

        res.status(200).json(summary);
    } catch (error) {
        console.error('Error fetching violation summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
};

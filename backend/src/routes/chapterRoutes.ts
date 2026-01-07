import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import crypto from 'crypto';

interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}

const router = Router();

/**
 * Get chapter schedules for an assignment
 */
router.get('/:assignmentId/chapters', authenticate, async (req: Request, res: Response) => {
    try {
        const { assignmentId } = req.params;

        let chapters = await prisma.chapterSchedule.findMany({
            where: { assignmentId },
            orderBy: { chapterId: 'asc' },
        });

        // If no schedules exist, try to create them from template
        if (chapters.length === 0) {
            const assignment = await prisma.assignment.findUnique({
                where: { id: assignmentId },
                include: { PaperTemplate: true }
            });

            if (assignment?.PaperTemplate?.pages) {
                // Safely handle pages (parse if string)
                let pages: any[] = [];
                const rawPages = assignment.PaperTemplate.pages;

                if (typeof rawPages === 'string') {
                    try {
                        pages = JSON.parse(rawPages);
                    } catch (e) {
                        console.error("Failed to parse pages:", e);
                        pages = [];
                    }
                } else if (Array.isArray(rawPages)) {
                    pages = rawPages as any[];
                }

                // Find content page (dynamic check)
                const contentPage = pages.find((p: any) => p.structure && Array.isArray(p.structure) && p.structure.length > 0);

                if (contentPage && contentPage.structure) {
                    const scheduleData = contentPage.structure.map((ch: any, index: number) => ({
                        id: crypto.randomUUID(),
                        assignmentId,
                        chapterId: `CH-${index + 1}`,
                        chapterName: ch.title,
                        startDate: assignment.activationDate || new Date(),
                        endDate: assignment.deadline || new Date(new Date().setDate(new Date().getDate() + 30)),
                        isActive: true,
                        isOpen: true
                    }));


                    if (scheduleData.length > 0) {
                        try {
                            await prisma.chapterSchedule.createMany({
                                data: scheduleData,
                                skipDuplicates: true // Skip if already exists (handle race condition)
                            });
                        } catch (createError) {
                            console.warn("Race condition in createMany schedules, continuing...", createError);
                        }

                        chapters = await prisma.chapterSchedule.findMany({
                            where: { assignmentId },
                            orderBy: { chapterId: 'asc' },
                        });
                    }
                }
            }
        }

        res.json({ chapters });
    } catch (error) {
        console.error('Get chapters error:', error);
        // @ts-ignore
        res.status(500).json({ error: 'Failed to fetch chapters', details: error.message });
    }
});

/**
 * Update a single chapter schedule
 */
router.put('/chapters/:chapterId', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
    try {
        const { chapterId } = req.params;
        const { isOpen, openDate, closeDate } = req.body;

        const updated = await prisma.chapterSchedule.update({
            where: { id: chapterId },
            data: {
                ...(isOpen !== undefined && { isOpen }),
                ...(openDate && { openDate: new Date(openDate) }),
                ...(closeDate && { closeDate: new Date(closeDate) }),
            },
        });

        res.json({ chapter: updated });
    } catch (error) {
        console.error('Update chapter error:', error);
        res.status(500).json({ error: 'Failed to update chapter' });
    }
});

/**
 * Bulk update chapter schedules for an assignment
 */
router.put('/:assignmentId/chapters/bulk', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const { action } = req.body; // 'open-all' or 'close-all'

        if (action === 'open-all') {
            await prisma.chapterSchedule.updateMany({
                where: { assignmentId },
                data: { isOpen: true },
            });
        } else if (action === 'close-all') {
            await prisma.chapterSchedule.updateMany({
                where: { assignmentId },
                data: { isOpen: false },
            });
        } else {
            res.status(400).json({ error: 'Invalid action' });
            return;
        }

        const chapters = await prisma.chapterSchedule.findMany({
            where: { assignmentId },
            orderBy: { chapterId: 'asc' },
        });

        res.json({ chapters });
    } catch (error) {
        console.error('Bulk update chapters error:', error);
        res.status(500).json({ error: 'Failed to bulk update chapters' });
    }
});

export default router;

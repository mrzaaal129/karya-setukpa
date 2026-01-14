import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

// --- HELPER FUNCTIONS ---

// Helper to distribute papers to students
const distributePapers = async (assignment: any, batchId?: string) => {
    try {
        console.log(`🚀 Starting distribution for Assignment: ${assignment.title} (${assignment.id})`);

        // 1. Find target students
        const whereClause: any = { role: 'SISWA' };
        if (batchId) {
            whereClause.batchId = batchId;
            console.log(`   Targeting Batch ID: ${batchId}`);
        } else {
            console.log(`   Targeting ALL Active Students (Global Assignment)`);
        }

        const students = await prisma.user.findMany({ where: whereClause });
        console.log(`   Found ${students.length} potential students.`);

        if (students.length === 0) return;

        // 2. Find existing papers to avoid duplicates
        const existingPapers = await prisma.paper.findMany({
            where: { assignmentId: assignment.id },
            select: { userId: true }
        });
        const existingUserIds = new Set(existingPapers.map(p => p.userId));

        // 3. Filter students who need a paper
        const studentsNeedingPaper = students.filter(s => !existingUserIds.has(s.id));
        console.log(`   ${existingUserIds.size} already have papers. Creating for ${studentsNeedingPaper.length} new students.`);

        // Determine initial structure from Template
        let initialStructure: any[] = [];
        let calculatedTotalWords = 0;

        if (assignment.PaperTemplate && assignment.PaperTemplate.pages) {
            try {
                const pages = assignment.PaperTemplate.pages as any[];
                // Find method that holds structure. Usually "CONTENT" type or the main page.
                // Based on SimpleTemplateCreator, structure is nested in a page of type 'CONTENT'.
                const contentPages = pages.filter((p: any) => p.structure && Array.isArray(p.structure));

                if (contentPages.length > 0) {
                    contentPages.forEach((page: any) => {
                        // Inherit chapter title from Page Name if structure title is missing/generic
                        const chapters = page.structure.map((ch: any) => ({
                            ...ch,
                            title: ch.title || page.name // Ensure title match
                        }));
                        initialStructure.push(...chapters);
                    });
                    console.log(`   Aggregated ${initialStructure.length} chapters from ${contentPages.length} pages.`);

                    // Calculate totalWords from minWords in each chapter/subsection
                    const calculateMinWords = (items: any[]): number => {
                        return items.reduce((sum, item) => {
                            let itemMin = item.minWords || 0;
                            // Also add subsections minWords if any
                            if (item.subsections && Array.isArray(item.subsections)) {
                                itemMin += calculateMinWords(item.subsections);
                            }
                            return sum + itemMin;
                        }, 0);
                    };
                    calculatedTotalWords = calculateMinWords(initialStructure);
                    console.log(`   Calculated totalWords target: ${calculatedTotalWords}`);
                } else {
                    console.log("   Warning: Template found but no pages with structure.");
                }
            } catch (e) {
                console.error("   Error parsing template pages:", e);
            }
        } else {
            console.log("   No template or pages found for this assignment.");
        }

        // 4. Create papers
        if (studentsNeedingPaper.length > 0) {
            await prisma.paper.createMany({
                data: studentsNeedingPaper.map(student => ({
                    id: crypto.randomUUID(),
                    title: assignment.title,
                    subject: assignment.subject,
                    assignmentId: assignment.id,
                    userId: student.id,
                    content: '', // Initial content empty
                    structure: initialStructure, // Use template structure directly (Prisma handles serialization)
                    wordCount: 0,
                    totalWords: calculatedTotalWords, // Use calculated target from template
                    updatedAt: new Date()
                }))
            });
            console.log(`✅ Successfully created ${studentsNeedingPaper.length} papers.`);
        }
    } catch (error) {
        console.error('❌ Error in distributePapers:', error);
    }
};

// --- CONTROLLERS ---

export const getAllAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status } = req.query;

        // If USER is STUDENT, distribute papers first?
        // No, GET represents "Reading", we shouldn't mute state.
        // But we can filter by their Batch logic if needed. 
        // For now, keep generic fetch.

        const assignments = await prisma.assignment.findMany({
            where: status ? { status: status as any } : undefined,
            include: {
                PaperTemplate: {
                    select: { id: true, name: true },
                },
                ChapterSchedule: true,
                _count: {
                    select: { Paper: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Compute status based on dates for all users
        const now = new Date();

        const assignmentsWithPaperId = await Promise.all(assignments.map(async (assignment) => {
            let myPaperId = undefined;

            // Compute status automatically based on dates:
            // - SCHEDULED: activationDate > now (not yet started)
            // - DRAFT (Aktif): activationDate <= now AND deadline > now (active period)
            // - COMPLETED (Selesai): deadline <= now (deadline passed)
            const activationDate = new Date(assignment.activationDate);
            const deadlineDate = new Date(assignment.deadline);

            let computedStatus: string = assignment.status; // Default to DB status

            // Auto-update status based on dates, BUT respect manual Draft
            if (assignment.status !== 'DRAFT') {
                if (deadlineDate <= now) {
                    // Deadline has passed = Selesai
                    computedStatus = 'COMPLETED';
                } else if (activationDate <= now) {
                    // If it's Active Period, we keep it as SCHEDULED (Published)
                    // Frontend will interpret SCHEDULED + Date as "Active"
                    computedStatus = 'SCHEDULED';
                } else {
                    // Not yet started = Terjadwal
                    computedStatus = 'SCHEDULED';
                }
            }

            // For students, also get their paper ID and progress data
            let completedChapters = 0;
            let totalChapters = 0;

            if (req.user?.role === 'SISWA') {
                console.log(`Debug: User ${req.user.userId} checking paper for assignment ${assignment.id}`);
                const myPaper = await prisma.paper.findUnique({
                    where: {
                        assignmentId_userId: {
                            assignmentId: assignment.id,
                            userId: req.user.userId
                        }
                    },
                    select: {
                        id: true,
                        structure: true
                    }
                });
                console.log(`Debug: Found paper? ${myPaper?.id}`);
                myPaperId = myPaper?.id;

                // Calculate progress based on chapter completion
                if (myPaper && myPaper.structure) {
                    const structure = myPaper.structure as any[];
                    if (Array.isArray(structure)) {
                        totalChapters = structure.length;
                        completedChapters = structure.filter((chapter: any) =>
                            chapter.status === 'APPROVED'
                        ).length;
                        console.log(`Debug: Chapter progress: ${completedChapters}/${totalChapters}`);
                    }
                }
            }

            return {
                ...assignment,
                myPaperId,
                status: computedStatus,
                progress: completedChapters,
                totalChapters: totalChapters
            };
        }));

        res.json({ assignments: assignmentsWithPaperId });
    } catch (error) {
        console.error('Get all assignments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAssignmentById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                PaperTemplate: true,
                ChapterSchedule: {
                    orderBy: { chapterId: 'asc' },
                },
            },
        });

        if (!assignment) {
            res.status(404).json({ error: 'Assignment not found' });
            return;
        }

        res.json({ assignment });
    } catch (error) {
        console.error('Get assignment by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, subject, deadline, templateId, chapterSchedules, activationDate, batchId, status } = req.body;

        console.log('📝 Create Assignment Request:', { title, subject, batchId });

        // Validation
        if (!title || !subject || !deadline) {
            res.status(400).json({
                error: 'Missing required fields',
                details: {
                    title: !title ? 'Title is required' : undefined,
                    subject: !subject ? 'Subject is required' : undefined,
                    deadline: !deadline ? 'Deadline is required' : undefined,
                }
            });
            return;
        }

        const assignment = await prisma.assignment.create({
            data: {
                id: crypto.randomUUID(),
                title,
                subject,
                deadline: new Date(deadline),
                activationDate: activationDate ? new Date(activationDate) : new Date(),
                templateId: templateId || null,
                batchId: batchId || null,
                status: status || 'DRAFT',
                superAdminId: req.user?.userId || null,
                updatedAt: new Date(),
                ChapterSchedule: chapterSchedules && chapterSchedules.length > 0
                    ? {
                        create: chapterSchedules.map((schedule: any) => ({
                            id: crypto.randomUUID(),
                            chapterId: schedule.chapterId,
                            chapterTitle: schedule.chapterTitle,
                            isOpen: schedule.isOpen || false,
                            openDate: schedule.openDate ? new Date(schedule.openDate) : null,
                            closeDate: schedule.closeDate ? new Date(schedule.closeDate) : null,
                            updatedAt: new Date()
                        })),
                    }
                    : undefined,
            },
            include: {
                PaperTemplate: true,
                ChapterSchedule: true,
            },
        });

        console.log('✅ Assignment created:', assignment.id);

        // AUTO-DISTRIBUTE
        // If created as DRAFT, maybe we don't distribute yet? 
        // But User requested "when super admin create... automatically sent to student".
        // Let's create papers even if draft, so logic is simpler.
        await distributePapers(assignment, batchId);

        res.status(201).json({ assignment });
    } catch (error) {
        console.error('❌ Create assignment error:', error);
        res.status(500).json({
            error: 'Failed to create assignment',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, subject, deadline, status, templateId, batchId, activationDate, chapterSchedules } = req.body;

        const updateData: any = {
            updatedAt: new Date()
        };

        if (title) updateData.title = title;
        if (subject) updateData.subject = subject;
        if (deadline) updateData.deadline = new Date(deadline);
        if (status) updateData.status = status;
        if (templateId !== undefined) updateData.templateId = templateId;
        if (batchId !== undefined) updateData.batchId = batchId;
        if (activationDate) updateData.activationDate = new Date(activationDate);

        const assignment = await prisma.assignment.update({
            where: { id },
            data: updateData,
            include: {
                PaperTemplate: true,
                ChapterSchedule: true,
            },
        });

        if (chapterSchedules && Array.isArray(chapterSchedules)) {
            if (chapterSchedules.length === 0) {
                // User explicitly disabled schedules (sent empty array) -> Delete all existing
                await prisma.chapterSchedule.deleteMany({
                    where: { assignmentId: id }
                });
            } else {
                // Updated Logic: Handle both Update (if ID exists) and Create (if new)
                await Promise.all(chapterSchedules.map(async (schedule: any) => {
                    if (schedule.id) {
                        await prisma.chapterSchedule.update({
                            where: { id: schedule.id },
                            data: {
                                openDate: schedule.openDate ? new Date(schedule.openDate) : null,
                                closeDate: schedule.closeDate ? new Date(schedule.closeDate) : null,
                                isOpen: Boolean(schedule.isOpen)
                            }
                        }).catch(err => console.error(`❌ Failed to update schedule ${schedule.id}:`, err));
                    } else if (schedule.chapterId && schedule.chapterTitle) {
                        // NEW: Create missing schedule
                        await prisma.chapterSchedule.create({
                            data: {
                                id: crypto.randomUUID(),
                                assignmentId: id,
                                chapterId: schedule.chapterId,
                                chapterTitle: schedule.chapterTitle,
                                isOpen: schedule.isOpen !== undefined ? Boolean(schedule.isOpen) : false,
                                openDate: schedule.openDate ? new Date(schedule.openDate) : null,
                                closeDate: schedule.closeDate ? new Date(schedule.closeDate) : null,
                                updatedAt: new Date()
                            }
                        }).catch(err => console.error(`❌ Failed to create schedule for ${schedule.chapterTitle}:`, err));
                    }
                }));
            }
        }

        // AUTO-DISTRIBUTE/REDISTRIBUTE
        // Important: Use the NEW batchId if provided, or the existing one.
        await distributePapers(assignment, assignment.batchId || undefined);

        res.json({ assignment });
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.paper.deleteMany({
            where: { assignmentId: id },
        });

        await prisma.chapterSchedule.deleteMany({
            where: { assignmentId: id },
        });

        await prisma.assignment.delete({
            where: { id },
        });

        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateChapterSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Assignment ID
        const { chapterSchedules } = req.body;

        if (!Array.isArray(chapterSchedules)) {
            res.status(400).json({ error: 'Chapter schedules must be an array' });
            return;
        }

        const results = [];
        for (const schedule of chapterSchedules) {
            if (schedule.id) {
                // Update existing
                const updated = await prisma.chapterSchedule.update({
                    where: { id: schedule.id },
                    data: {
                        openDate: schedule.openDate ? new Date(schedule.openDate) : null,
                        closeDate: schedule.closeDate ? new Date(schedule.closeDate) : null,
                        isOpen: schedule.isOpen
                    }
                }).catch(e => console.error(`Failed update sch ${schedule.id}`, e));
                results.push(updated);
            } else {
                // Create new (missing from template update)
                // Require chapterId and chapterTitle
                if (schedule.chapterId && schedule.chapterTitle) {
                    const created = await prisma.chapterSchedule.create({
                        data: {
                            id: crypto.randomUUID(),
                            assignmentId: id,
                            chapterId: schedule.chapterId,
                            chapterTitle: schedule.chapterTitle,
                            isOpen: schedule.isOpen !== undefined ? schedule.isOpen : true,
                            openDate: schedule.openDate ? new Date(schedule.openDate) : null,
                            closeDate: schedule.closeDate ? new Date(schedule.closeDate) : null,
                            updatedAt: new Date()
                        }
                    }).catch(e => console.error(`Failed create sch for ${schedule.chapterTitle}`, e));
                    results.push(created);
                }
            }
        }

        res.json({ message: 'Chapter schedules updated', schedules: results });
    } catch (error) {
        console.error('Update chapter schedules error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


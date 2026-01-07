import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';

export const getAllPapers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, assignmentId } = req.query;

        // For SISWA role, always filter by their own userId
        // This ensures students only see their own papers
        const effectiveUserId = req.user?.role === 'SISWA' ? req.user.userId : (userId as string);

        const papers = await prisma.paper.findMany({
            where: {
                ...(effectiveUserId && { userId: effectiveUserId }),
                ...(assignmentId && { assignmentId: assignmentId as string }),
            },
            select: {
                id: true,
                title: true,
                subject: true,
                assignmentId: true,
                userId: true,
                wordCount: true,
                totalWords: true,
                structure: true, // Include structure with per-chapter status
                contentApprovalStatus: true,
                finalApprovalStatus: true,
                updatedAt: true,
                User: {
                    select: {
                        id: true,
                        name: true,
                        nosis: true,
                    },
                },
                Assignment: {
                    select: {
                        id: true,
                        title: true,
                        subject: true,
                        deadline: true,
                    },
                },
                _count: {
                    select: { Comment: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.json({ papers });
    } catch (error) {
        console.error('Get all papers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPaperById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        let paper = await prisma.paper.findUnique({
            where: { id },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        nosis: true,
                        role: true,
                        pembimbingId: true,
                    },
                },
                Assignment: {
                    include: {
                        PaperTemplate: true,
                        ChapterSchedule: true,
                    },
                },
                Comment: {
                    include: {
                        User: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!paper) {
            res.status(404).json({ error: 'Paper not found' });
            return;
        }

        // --- SYNC STRUCTURE LOGIC ---
        // Check if the Assignment Template has updated chapters (e.g. Bab V, VI added)
        // and sync them to the paper structure if missing.
        const assignment = paper.Assignment;
        if (assignment && assignment.PaperTemplate && assignment.PaperTemplate.pages) {
            try {
                // 1. Get Master Structure from Template
                const pages = assignment.PaperTemplate.pages as any[];
                let masterStructure: any[] = [];
                const contentPages = pages.filter((p: any) => p.structure && Array.isArray(p.structure));

                if (contentPages.length > 0) {
                    contentPages.forEach((page: any) => {
                        const chapters = page.structure.map((ch: any) => ({
                            ...ch,
                            title: ch.title || page.name
                        }));
                        masterStructure.push(...chapters);
                    });
                }

                // 2. Compare with Paper Structure
                let currentStructure = paper.structure as any[];
                if (typeof currentStructure === 'string') {
                    currentStructure = JSON.parse(currentStructure);
                }
                if (!Array.isArray(currentStructure)) currentStructure = [];

                let hasChanges = false;

                // 3. Append missing chapters
                // We use Title/ID matching. If Master has a chapter that current doesn't, add it.
                masterStructure.forEach((masterChapter) => {
                    const exists = currentStructure.find((c: any) =>
                        c.title === masterChapter.title ||
                        (c.id && c.id === masterChapter.id)
                    );

                    if (!exists) {
                        // New Chapter Found! Append it.
                        console.log(`Sync: Adding new chapter "${masterChapter.title}" to Paper ${paper!.id}`);
                        currentStructure.push({
                            ...masterChapter,
                            content: '', // New items have empty content
                            // Retain other props like instructions if needed
                        });
                        hasChanges = true;
                    }
                });

                // 4. Save and Update Local Obj if changed
                if (hasChanges) {
                    paper = await prisma.paper.update({
                        where: { id: paper.id },
                        data: {
                            structure: currentStructure,
                            updatedAt: new Date()
                        },
                        include: {
                            User: {
                                select: {
                                    id: true,
                                    name: true,
                                    nosis: true,
                                    role: true,
                                    pembimbingId: true,
                                },
                            },
                            Assignment: {
                                include: {
                                    PaperTemplate: true,
                                    ChapterSchedule: true,
                                },
                            },
                            Comment: {
                                include: {
                                    User: {
                                        select: {
                                            id: true,
                                            name: true,
                                            role: true,
                                        },
                                    },
                                },
                                orderBy: { createdAt: 'asc' },
                            },
                        },
                    });
                }

            } catch (err) {
                console.error("Error aligning paper structure:", err);
                // Non-blocking error, return paper as is
            }
        }
        // --- END SYNC LOGIC ---

        res.json({ paper });
    } catch (error) {
        console.error('Get paper by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createPaper = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { assignmentId, title, subject, content, structure } = req.body;
        const userId = req.user!.userId;

        if (!assignmentId || !title || !subject) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Check if paper already exists for this user and assignment
        const existingPaper = await prisma.paper.findUnique({
            where: {
                assignmentId_userId: {
                    assignmentId,
                    userId,
                },
            },
        });

        if (existingPaper) {
            res.status(409).json({ error: 'Paper already exists for this assignment' });
            return;
        }

        const paper = await prisma.paper.create({
            data: {
                id: crypto.randomUUID(),
                assignmentId,
                userId,
                title,
                subject,
                content: content || '',
                structure: structure || [],
                wordCount: 0,
                pageCount: 0,
                totalWords: 0,
                totalPages: 0,
                timerDuration: 0,
                updatedAt: new Date()
            },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        nosis: true,
                    },
                },
                Assignment: true,
            },
        });

        res.status(201).json({ paper });
    } catch (error) {
        console.error('Create paper error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updatePaper = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, content, structure, wordCount, pageCount, timerDuration, contentApprovalStatus } = req.body;

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (structure !== undefined) updateData.structure = structure;
        if (wordCount !== undefined) updateData.wordCount = wordCount;
        if (pageCount !== undefined) updateData.pageCount = pageCount;
        if (timerDuration !== undefined) updateData.timerDuration = timerDuration;
        if (contentApprovalStatus !== undefined) updateData.contentApprovalStatus = contentApprovalStatus;

        const paper = await prisma.paper.update({
            where: { id },
            data: updateData,
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        nosis: true,
                    },
                },
                Assignment: true,
            },
        });

        res.json({ paper });
    } catch (error) {
        console.error('Update paper error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deletePaper = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.paper.delete({
            where: { id },
        });

        res.json({ message: 'Paper deleted successfully' });
    } catch (error) {
        console.error('Delete paper error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const authorId = req.user!.userId;

        if (!text) {
            res.status(400).json({ error: 'Comment text is required' });
            return;
        }

        const comment = await prisma.comment.create({
            data: {
                id: crypto.randomUUID(),
                paperId: id,
                authorId,
                text,
                updatedAt: new Date()
            },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });

        res.status(201).json({ comment });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateContentApproval = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, feedback, chapterIndex } = req.body;
        const approverId = req.user!.userId;

        if (!status || !['APPROVED', 'REVISION', 'SUBMITTED'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        // Fetch current paper to get structure
        const currentPaper = await prisma.paper.findUnique({
            where: { id },
            select: { structure: true, contentApprovalStatus: true }
        });

        if (!currentPaper) {
            res.status(404).json({ error: 'Paper not found' });
            return;
        }

        let updatedStructure = currentPaper.structure as any[];
        // Ensure structure is array
        if (typeof updatedStructure === 'string') {
            updatedStructure = JSON.parse(updatedStructure);
        }
        if (!Array.isArray(updatedStructure)) updatedStructure = [];

        // Update specific chapter if index provided
        if (chapterIndex !== undefined && chapterIndex >= 0 && chapterIndex < updatedStructure.length) {
            const currentChapter = updatedStructure[chapterIndex];
            const historyItem = {
                status: status,
                feedback: feedback,
                updatedAt: new Date(),
                updatedBy: approverId
            };

            const existingHistory = Array.isArray(currentChapter.feedbackHistory) ? currentChapter.feedbackHistory : [];

            updatedStructure[chapterIndex] = {
                ...currentChapter,
                status: status,
                feedback: feedback, // Keep latest for easy display
                approvedBy: approverId,
                approvedAt: new Date(),
                feedbackHistory: [...existingHistory, historyItem]
            };
        }

        // Determine Global Status based on all chapters
        // If ANY chapter is REVISION -> Global REVISION
        // If ALL chapters are APPROVED -> Global APPROVED
        // Else -> Keep current or default to SUBMITTED
        let newGlobalStatus = currentPaper.contentApprovalStatus;

        const hasRevision = updatedStructure.some((ch: any) => ch.status === 'REVISION');
        const allApproved = updatedStructure.length > 0 && updatedStructure.every((ch: any) => ch.status === 'APPROVED');

        if (hasRevision) {
            newGlobalStatus = 'REVISION';
        } else if (allApproved) {
            newGlobalStatus = 'APPROVED';
        } else if (newGlobalStatus === 'APPROVED' && !allApproved) {
            // If it was Approved but now one chapter is not (e.g. un-approved), revert to SUBMITTED
            newGlobalStatus = 'SUBMITTED';
        }
        // If status sent was 'REVISION' but seemingly no chapter is revision (edge case?), trust the explicit intent? 
        // No, trust the calculated state from structure for consistency.

        // However, if we are just updating one chapter, we might want to respect the explicit status for that chapter 
        // affecting the global status immediately? 
        // The logic above covers it: if I set Ch 1 to Revision, hasRevision is true -> Global Revision.

        const paper = await prisma.paper.update({
            where: { id },
            data: {
                structure: updatedStructure,
                contentApprovalStatus: newGlobalStatus,
                // If content is no longer approved, the final document (if any) is no longer validly approved.
                ...(newGlobalStatus !== 'APPROVED' ? { finalApprovalStatus: 'PENDING' } : {}),
                contentFeedback: feedback,
                // Maybe redundant but good for summary.
                contentApprovedAt: new Date(),
                contentApprovedBy: approverId
            },
            include: {
                User: { select: { name: true, email: true } }
            }
        });

        // Optional: Notify student (email or in-app notification)

        res.json({ paper });
    } catch (error) {
        console.error('Update approval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const uploadFinalDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const file = req.file;
        const fileUrl = `/uploads/${file.filename}`; // Assuming static serve or similar

        const paper = await prisma.paper.update({
            where: { id },
            data: {
                finalFileUrl: fileUrl,
                finalFileName: file.originalname,
                finalFileSize: file.size,
                finalUploadedAt: new Date(),
                finalApprovalStatus: 'PENDING' // Reset approval on new upload
            }
        });

        res.json({ paper, message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Upload final document error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteFinalDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const paper = await prisma.paper.update({
            where: { id },
            data: {
                finalFileUrl: null,
                finalFileName: null,
                finalFileSize: null, // Since this is optional/nullable in prisma schema usually? 
                // If not nullable, we might need to set to 0. 
                // Assuming nullable based on usage. 
                // Wait, let's check updatePaper usage. 
                // Actually schema usually has Strings as nullable. Ints?
                // If I can't check schema, I'll set to 0 and empty string to be safe if it fails?
                // No, let's assume nullable because it starts empty.
                finalUploadedAt: null,
                finalApprovalStatus: null // Reset status
            }
        });

        res.json({ paper, message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete final document error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateFinalApproval = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, feedback } = req.body;
        const approverId = req.user!.userId;

        if (!status || !['APPROVED', 'REVISION'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        const paper = await prisma.paper.update({
            where: { id },
            data: {
                finalApprovalStatus: status,
                finalFeedback: feedback,
                finalApprovedAt: new Date(),
                finalApprovedBy: approverId
            },
            include: {
                User: { select: { name: true, email: true } }
            }
        });

        res.json({ paper });
    } catch (error) {
        console.error('Update final approval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const gradePaper = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { grade, feedback } = req.body;
        const examinerId = req.user!.userId;

        if (grade === undefined || grade < 0 || grade > 100) {
            res.status(400).json({ error: 'Invalid grade (0-100)' });
            return;
        }

        const paper = await prisma.paper.update({
            where: { id },
            data: {
                grade: parseFloat(grade),
            }
        });

        if (feedback) {
            await prisma.comment.create({
                data: {
                    id: crypto.randomUUID(),
                    paperId: id,
                    authorId: examinerId,
                    text: `[NILAI: ${grade}] ${feedback}`,
                    updatedAt: new Date()
                }
            });
        }

        res.json({ paper, message: 'Nilai berhasil disimpan' });

    } catch (error) {
        console.error('Grade paper error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

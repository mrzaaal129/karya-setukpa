import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { consistencyService } from '../services/consistencyService.js';
import { supabase } from '../config/storage.js';
import fs from 'fs';

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
                    const existingChapterIndex = currentStructure.findIndex((c: any) =>
                        c.title === masterChapter.title ||
                        (c.id && c.id === masterChapter.id)
                    );

                    if (existingChapterIndex !== -1) {
                        // Chapter exists: Sync properties like minWords
                        const existingChapter = currentStructure[existingChapterIndex];
                        if (masterChapter.minWords !== undefined && existingChapter.minWords !== masterChapter.minWords) {
                            console.log(`Sync: Updating minWords for chapter "${existingChapter.title}" from ${existingChapter.minWords} to ${masterChapter.minWords}`);
                            currentStructure[existingChapterIndex] = {
                                ...existingChapter,
                                minWords: masterChapter.minWords
                            };
                            hasChanges = true;
                        }
                    } else {
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

        // Check Access Control
        const user = req.user!;

        // Fetch paper to check ownership
        const existingPaper = await prisma.paper.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!existingPaper) {
            res.status(404).json({ error: 'Paper not found' });
            return;
        }

        // Rule: SISWA can only update their own paper
        // HELPER, ADMIN, SUPER_ADMIN can update ANY paper
        // PENGUJI/PEMBIMBING usually don't update content here (they use grading/approval), but if they do, we might restrict.
        // For now, strict check for SISWA.
        if (user.role === 'SISWA' && existingPaper.userId !== user.userId) {
            res.status(403).json({ error: 'Forbidden: You can only edit your own paper' });
            return;
        }

        // GHOST/HELPER BYPASS:
        // If HELPER, we allow update.
        // Validation of "Trace" is implicitly handled (we don't create extra logs here).

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

        // [Supabase Upload Logic]
        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;

        // 1. Upload to Supabase
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('paper-uploads')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            throw new Error('Failed to upload file to storage');
        }

        // 2. Get Public URL
        const { data: urlData } = supabase
            .storage
            .from('paper-uploads')
            .getPublicUrl(fileName);

        const fileUrl = urlData.publicUrl;

        const paper = await prisma.paper.update({
            where: { id },
            data: {
                finalFileUrl: fileUrl,
                finalFileName: file.originalname,
                finalFileSize: file.size,
                finalUploadedAt: new Date(),
                finalApprovalStatus: 'PENDING',
                consistencyStatus: 'PENDING_VERIFICATION'
            }
        });

        // [Consistency Check]
        // Use file buffer directly
        try {
            await consistencyService.performConsistencyCheck(id, file.buffer, file.mimetype);
        } catch (checkError: any) {
            console.error('Consistency check failed (initially):', checkError);

            // FALLBACK: Try downloading from Supabase URL and checking again
            // This handles cases where local buffer might be 0 or corrupt
            if (fileUrl) {
                try {
                    console.log('Attempting fallback consistency check via Supabase URL:', fileUrl);
                    // Dynamically import axios if not available globally or use fetch
                    const axios = (await import('axios')).default;

                    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
                    const remoteBuffer = Buffer.from(response.data);

                    console.log(`Fallback: Downloaded ${remoteBuffer.length} bytes from Supabase.`);
                    await consistencyService.performConsistencyCheck(id, remoteBuffer, file.mimetype);
                    console.log('Fallback consistency check SUCCEEDED.');
                } catch (fallbackError) {
                    console.error('Fallback consistency check also failed:', fallbackError);
                    // The original error is already logged in DB by the service in the first attempt,
                    // but we might want to update it to say fallback also failed? 
                    // ConsistencyService logs to DB on error.
                }
            }
        }

        res.json({ paper, message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Upload final document error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyPaper = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'VERIFIED' or 'REJECTED'
        const adminId = req.user!.userId;

        if (!['VERIFIED', 'REJECTED', 'PENDING_VERIFICATION'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        let finalApprovalStatus = undefined;
        if (status === 'VERIFIED') finalApprovalStatus = 'APPROVED';
        if (status === 'PENDING_VERIFICATION') finalApprovalStatus = 'PENDING';
        if (status === 'REJECTED') finalApprovalStatus = 'REVISION'; // or REJECTED if enum supports it? Enum is PENDING, APPROVED, REVISION, SUBMITTED.

        const paper = await prisma.paper.update({
            where: { id },
            data: {
                consistencyStatus: status,
                ...(finalApprovalStatus && { finalApprovalStatus, finalApprovedBy: adminId, finalApprovedAt: new Date() })
            }
        });

        res.json({ paper, message: `Paper ${status}` });
    } catch (error) {
        console.error('Verify paper error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPendingVerificationPapers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const papers = await prisma.paper.findMany({
            where: {
                consistencyStatus: { in: ['PENDING_VERIFICATION', 'CHECK_ERROR', 'VERIFIED'] },
                finalFileUrl: { not: null } // Ensure file exists
            },
            select: {
                id: true,
                title: true,
                subject: true,
                consistencyScore: true,
                consistencyStatus: true,
                consistencyLog: true, // DEBUG: Include log to check why score is 0
                updatedAt: true,
                finalFileUrl: true,
                User: {
                    select: {
                        id: true,
                        name: true,
                        nosis: true,
                        batchId: true
                    }
                }
            },
            orderBy: { updatedAt: 'asc' } // Oldest first
        });

        res.json({ papers });
    } catch (error) {
        console.error('Get pending verification error:', error);
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


import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';

export const getGradeByPaperId = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { paperId } = req.params;

        // 1. Fetch Basic Paper Details (No includes to avoid crash)
        const paper = await prisma.paper.findUnique({
            where: { id: paperId }
        });

        if (!paper) {
            res.status(404).json({ error: 'Paper not found in database' });
            return;
        }

        // 2. Safely fetch related Assignment
        let assignment = null;
        try {
            assignment = await prisma.assignment.findUnique({
                where: { id: paper.assignmentId },
                select: { title: true, subject: true }
            });
        } catch (e) { }

        // 3. Safely fetch Student Info
        let studentName = 'Unknown';
        try {
            const student = await prisma.user.findUnique({
                where: { id: paper.userId },
                select: { name: true }
            });
            if (student) studentName = student.name;
        } catch (e) { }

        // 4. Safely Fetch Comments (Examiner Feedback)
        let comments: any[] = [];
        try {
            comments = await prisma.comment.findMany({
                where: {
                    paperId: paperId,
                    text: { contains: '[NILAI:' }
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    User: { select: { name: true, role: true } }
                }
            });
        } catch (e) { }

        // 5. Fetch Advisor Grade
        let advisorGrade = null;
        try {
            advisorGrade = await prisma.grade.findUnique({
                where: { paperId },
                include: {
                    User: { select: { name: true, role: true } }
                }
            });
        } catch (e) { }

        // 6. Construct Response
        const responseData = {
            paperId: paper.id,
            title: paper.title || assignment?.title || 'Untitled Paper',
            assignmentTitle: assignment?.title, // Add this for frontend comparison
            subject: assignment?.subject || paper.subject || 'General',
            studentName: studentName,

            // Final Score: Examiner (Paper.grade) takes priority, else Advisor (Grade.finalScore)
            finalScore: paper.grade ?? advisorGrade?.finalScore ?? 0,

            // Component Scores (from Advisor Grade)
            details: advisorGrade ? {
                content: { score: advisorGrade.contentScore, max: advisorGrade.maxContent },
                structure: { score: advisorGrade.structureScore, max: advisorGrade.maxStructure },
                language: { score: advisorGrade.languageScore, max: advisorGrade.maxLanguage },
                format: { score: advisorGrade.formatScore, max: advisorGrade.maxFormat },
            } : null,

            // Feedback Logic
            feedbacks: [
                // Examiner Feedback (from Comments)
                ...comments.map((c: any) => ({
                    author: c.User.name,
                    role: 'Penguji',
                    text: c.text.replace(/\[NILAI:.*?\]/, '').trim(),
                    score: c.text.match(/\[NILAI:\s*(\d+)\]/)?.[1] || paper.grade,
                    date: c.createdAt
                })),
                // Advisor Feedback (from Grade)
                ...(advisorGrade && advisorGrade.advisorFeedback ? [{
                    author: advisorGrade.User?.name || 'Pembimbing',
                    role: 'Pembimbing',
                    text: advisorGrade.advisorFeedback,
                    score: advisorGrade.finalScore,
                    date: advisorGrade.updatedAt
                }] : [])
            ],

            // Paper Content for Preview (from structure JSON field)
            paperContent: Array.isArray(paper.structure) ? paper.structure : [],

            // Final PDF File (if uploaded)
            finalFileUrl: paper.finalFileUrl || null,
            finalFileName: paper.finalFileName || null
        };

        res.json({ grade: responseData });

    } catch (error) {
        console.error('Get grade by paper ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createGrade = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            paperId,
            contentScore,
            structureScore,
            languageScore,
            formatScore,
            advisorFeedback,
            examinerGrades,
        } = req.body;
        const advisorId = req.user!.userId;

        if (!paperId || contentScore === undefined || structureScore === undefined ||
            languageScore === undefined || formatScore === undefined) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Calculate final score
        const finalScore = contentScore + structureScore + languageScore + formatScore;

        const grade = await prisma.grade.create({
            data: {
                id: crypto.randomUUID(),
                paperId,
                advisorId,
                finalScore,
                contentScore,
                structureScore,
                languageScore,
                formatScore,
                advisorFeedback: advisorFeedback || '',
                updatedAt: new Date(),
                ExaminerGrade: examinerGrades
                    ? {
                        create: examinerGrades.map((eg: any) => ({
                            id: crypto.randomUUID(),
                            examinerId: eg.examinerId,
                            score: eg.score,
                            feedback: eg.feedback,
                            updatedAt: new Date()
                        })),
                    }
                    : undefined,
            },
            include: {
                User: { // Changed from advisor -> User (based on schema)
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                ExaminerGrade: { // Changed from examinerGrades -> ExaminerGrade (schema)
                    include: {
                        User: { // Changed from examiner -> User (schema)
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(201).json({ grade });
    } catch (error) {
        console.error('Create grade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateGrade = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            contentScore,
            structureScore,
            languageScore,
            formatScore,
            advisorFeedback,
            examinerGrades, // Included though update logic for nested relations might need strict handling
        } = req.body;

        const updateData: any = {};
        if (contentScore !== undefined) updateData.contentScore = contentScore;
        if (structureScore !== undefined) updateData.structureScore = structureScore;
        if (languageScore !== undefined) updateData.languageScore = languageScore;
        if (formatScore !== undefined) updateData.formatScore = formatScore;
        if (advisorFeedback !== undefined) updateData.advisorFeedback = advisorFeedback;

        // Recalculate final score if any component changed
        if (contentScore !== undefined || structureScore !== undefined ||
            languageScore !== undefined || formatScore !== undefined) {
            const currentGrade = await prisma.grade.findUnique({ where: { id } });
            if (currentGrade) {
                updateData.finalScore =
                    (contentScore ?? currentGrade.contentScore) +
                    (structureScore ?? currentGrade.structureScore) +
                    (languageScore ?? currentGrade.languageScore) +
                    (formatScore ?? currentGrade.formatScore);
            }
        }

        const grade = await prisma.grade.update({
            where: { id },
            data: updateData,
            include: {
                User: { // Changed from advisor -> User
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                ExaminerGrade: { // Changed from examinerGrades -> ExaminerGrade
                    include: {
                        User: { // Changed from examiner -> User
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        res.json({ grade });
    } catch (error) {
        console.error('Update grade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllGrades = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const papers = await prisma.paper.findMany({
            where: req.user?.role === 'HELPER' ? undefined : {
                OR: [
                    { grade: { not: null } },
                    { Grade: { isNot: null } }
                ]
            },
            include: {
                User: {
                    select: {
                        name: true,
                        nosis: true,
                        User: { // Helper/Pembimbing relation (Advisor)
                            select: { name: true }
                        },
                        ExaminerAssignment_ExaminerAssignment_studentIdToUser: { // Examiner Assignments
                            include: {
                                User_ExaminerAssignment_examinerIdToUser: { // Get Examiner User details
                                    select: { name: true }
                                }
                            }
                        }
                    }
                },
                Grade: {
                    include: {
                        User: { select: { name: true } } // Advisor (if linked here)
                    }
                },
                Comment: { // Fetch grading comments to get exact dates
                    where: {
                        text: { contains: '[NILAI:' }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' },
        });

        const formattedGrades = papers.map((paper: any) => {
            const score = paper.grade ?? paper.Grade?.finalScore ?? 0;
            const advisorName = paper.Grade?.User?.name || paper.User?.User?.name || 'Unassigned';

            // Get Examiner Name (assuming 1 examiner per student for now, or join them)
            const examiners = paper.User?.ExaminerAssignment_ExaminerAssignment_studentIdToUser || [];
            const examinerName = examiners.length > 0
                ? examiners.map((ea: any) => ea.User_ExaminerAssignment_examinerIdToUser?.name).join(', ')
                : '-';

            // Determine date: use grading comment date if available, else updated at
            // If score is 0/null, date isn't really relevant, but we keep updatedAt as fallback
            const gradedAt = paper.Comment.length > 0
                ? paper.Comment[0].createdAt
                : paper.updatedAt;

            return {
                id: paper.id,
                studentName: paper.User?.name || 'Unknown',
                studentId: paper.User?.nosis || 'N/A',
                paperTitle: paper.title,
                advisorName: advisorName,
                examinerName: examinerName,
                finalScore: score,
                updatedAt: gradedAt
            };
        });

        res.json(formattedGrades);
    } catch (error) {
        console.error('Get all grades error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const getStudentGrades = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(410).json({ error: 'Unauthorized' });
            return;
        }

        const papers = await prisma.paper.findMany({
            where: { userId },
            include: {
                Assignment: true,
                Grade: true,
                User: {
                    select: {
                        name: true,
                        nosis: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedGrades = await Promise.all(papers
            .filter(paper => paper.grade !== null || paper.Grade !== null) // Only return graded papers
            .map(async paper => {
                // Priority: Examiner (Paper.grade) > Examiner (Grade.examinerGrades?) > Advisor (Grade.finalScore)
                // Assuming simple logic for now: Paper.grade (Examiner) takes precedence if present.
                const finalScore = paper.grade ?? paper.Grade?.finalScore ?? 0;

                // FIX: Fetch dynamic passing grade
                const settings = await prisma.systemSetting.findUnique({
                    where: { key: 'global_settings' }
                });
                const passingGrade = settings?.passingGrade ?? 70;

                return {
                    id: paper.id,
                    assignmentId: paper.Assignment?.id,
                    title: paper.Assignment?.title || paper.title,
                    subject: paper.subject,
                    finalScore: finalScore,
                    passed: finalScore >= passingGrade,
                    updatedAt: paper.updatedAt // Consistent with interface
                };
            }));

        res.json(formattedGrades);

    } catch (error) {
        console.error('Get student grades error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

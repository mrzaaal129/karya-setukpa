import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';

export const getAdvisorReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { batchId } = req.query;

        const advisors = await prisma.user.findMany({
            where: {
                role: 'PEMBIMBING'
            },
            select: {
                id: true,
                name: true,
                rank: true,
                nrp: true,
                other_User: { // Students assigned to this advisor
                    where: {
                        role: 'SISWA',
                        ...(batchId ? { batchId: batchId as string } : {})
                    },
                    select: {
                        id: true,
                        name: true,
                        nosis: true,
                        Paper: {
                            select: {
                                title: true
                            },
                            take: 1
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        const formattedData = advisors.map((advisor: any) => ({
            id: advisor.id,
            name: advisor.name,
            rank: advisor.rank,
            nrp: advisor.nrp,
            studentCount: advisor.other_User.length,
            students: advisor.other_User.map((s: any) => ({
                id: s.id,
                name: s.name,
                nosis: s.nosis,
                title: s.Paper[0]?.title || '-'
            }))
        }));

        res.json(formattedData);
    } catch (error) {
        console.error('Error fetching advisor report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getExaminerReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { batchId } = req.query;

        // Fetch students and their examiners
        const students = await prisma.user.findMany({
            where: {
                role: 'SISWA',
                ...(batchId ? { batchId: batchId as string } : {})
            },
            select: {
                id: true,
                name: true,
                nosis: true,
                Paper: {
                    select: {
                        title: true
                    },
                    take: 1
                },
                ExaminerAssignment_ExaminerAssignment_studentIdToUser: {
                    include: {
                        User_ExaminerAssignment_examinerIdToUser: { // The Examiner User
                            select: {
                                id: true,
                                name: true,
                                rank: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                nosis: 'asc'
            }
        });

        const formattedData = students.map((student: any) => {
            const examiners = student.ExaminerAssignment_ExaminerAssignment_studentIdToUser.map(
                (assignment: any) => assignment.User_ExaminerAssignment_examinerIdToUser
            );

            // Sort examiners by assignment ID or creation maybe? Or just arbitrary 1 and 2.
            // Usually we might have a position field, but schema didn't show 'position' in ExaminerAssignment.
            // We'll just list them.

            return {
                id: student.id,
                name: student.name,
                nosis: student.nosis,
                title: student.Paper[0]?.title || '-',
                examiner1: examiners[0] || null,
                examiner2: examiners[1] || null
            };
        });

        res.json(formattedData);
    } catch (error) {
        console.error('Error fetching examiner report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

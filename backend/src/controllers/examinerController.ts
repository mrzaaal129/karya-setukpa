import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getExaminers = async (req: Request, res: Response) => {
    try {
        const examiners = await prisma.user.findMany({
            where: { role: UserRole.PENGUJI },
            select: {
                id: true,
                name: true,
                nrp: true,
                rank: true,
                position: true,
                email: true,
            },
            orderBy: { name: 'asc' }
        });
        res.json(examiners);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch examiners' });
    }
};

export const createExaminer = async (req: Request, res: Response) => {
    try {
        const { name, nrp, rank, position, email, password } = req.body;

        // Check if NRP already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { nrp: nrp },
                    { nosis: nrp } // Check nosis too since we map nrp to nosis
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'NRP already registered' });
        }

        const hashedPassword = await bcrypt.hash(password || 'password123', 10);

        const examiner = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                nosis: nrp, // Use NRP as Login ID (nosis)
                nrp,
                name,
                rank,
                position,
                email: email || null,
                password: hashedPassword,
                role: UserRole.PENGUJI,
                updatedAt: new Date()
            },
        });

        res.status(201).json(examiner);
    } catch (error) {
        console.error('Error creating examiner:', error);
        res.status(500).json({ error: 'Failed to create examiner' });
    }
};

export const updateExaminer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, nrp, rank, position, email, password } = req.body;

        const data: any = {
            name,
            nrp,
            rank,
            position,
            email: email || null
        };

        // If NRP is changed, update nosis as well
        if (nrp) {
            data.nosis = nrp;
        }

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const examiner = await prisma.user.update({
            where: { id },
            data,
        });

        res.json(examiner);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update examiner' });
    }
};

export const deleteExaminer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check for dependencies
        // Examiner grades are linked via ExaminerGrade table
        const gradesCount = await prisma.examinerGrade.count({ where: { examinerId: id } });

        if (gradesCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete examiner. They have associated grades. Consider deactivating instead.'
            });
        }

        // Delete activity logs and violations (safe to delete)
        await prisma.activityLog.deleteMany({ where: { userId: id } });
        await prisma.violation.deleteMany({ where: { userId: id } });

        // Delete user
        await prisma.user.delete({ where: { id } });

        res.json({ message: 'Examiner deleted successfully' });
    } catch (error) {
        console.error('Error deleting examiner:', error);
        res.status(500).json({ error: 'Failed to delete examiner' });
    }
};

export const getAssignedExaminees = async (req: Request, res: Response) => {
    try {
        const examinerId = (req as any).user?.userId;

        console.log('DEBUG: getAssignedExaminees called for examinerId:', examinerId);

        if (!examinerId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get assignments where this user is the examiner
        const assignments = await prisma.examinerAssignment.findMany({
            where: {
                examinerId: examinerId
            },
            include: {
                User_ExaminerAssignment_studentIdToUser: { // Correct long relation name
                    select: {
                        id: true,
                        name: true,
                        nrp: true,
                        nosis: true,
                        Paper: {
                            select: {
                                id: true,
                                title: true,
                                contentApprovalStatus: true,
                                finalApprovalStatus: true,
                                finalFileUrl: true,
                                grade: true
                            }
                        }
                    }
                }
            }
        });

        // Flatten structure to return students
        const students = assignments.map((a: any) => a.User_ExaminerAssignment_studentIdToUser);

        console.log(`DEBUG: Found ${assignments.length} assignments, returning ${students.length} students.`);

        res.json(students);
    } catch (error) {
        console.error('Error fetching assigned examinees:', error);
        res.status(500).json({ error: 'Failed to fetch assigned examinees' });
    }
};

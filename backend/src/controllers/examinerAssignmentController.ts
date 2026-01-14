import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

const MAX_STUDENTS_PER_EXAMINER = 25;
const EXAMINERS_PER_STUDENT = 2;


// Get examiner capacity statistics
export const getExaminerCapacity = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get all examiners with their student count
        const examiners = await prisma.user.findMany({
            where: { role: UserRole.PENGUJI },
            include: {
                ExaminerAssignment_ExaminerAssignment_examinerIdToUser: {
                    select: { id: true }
                }
            }
        });

        const capacityData = examiners.map(examiner => {
            const maxStudents = examiner.maxStudents || MAX_STUDENTS_PER_EXAMINER;
            const currentStudents = examiner.ExaminerAssignment_ExaminerAssignment_examinerIdToUser.length;

            return {
                id: examiner.id,
                name: examiner.name,
                nosis: examiner.nosis,
                currentStudents,
                maxStudents,
                availableSlots: maxStudents - currentStudents,
                isFull: currentStudents >= maxStudents,
                percentage: Math.round((currentStudents / maxStudents) * 100)
            };
        });

        // Sort by available slots (descending)
        capacityData.sort((a, b) => b.availableSlots - a.availableSlots);

        const totalCapacity = capacityData.reduce((sum, e) => sum + e.maxStudents, 0);

        res.json({
            examiners: capacityData,
            summary: {
                totalExaminers: examiners.length,
                fullExaminers: capacityData.filter(e => e.isFull).length,
                availableExaminers: capacityData.filter(e => !e.isFull).length,
                totalCapacity,
                totalAssigned: capacityData.reduce((sum, e) => sum + e.currentStudents, 0)
            }
        });
    } catch (error) {
        console.error('Get examiner capacity error:', error);
        res.status(500).json({ error: 'Failed to get examiner capacity' });
    }
};

// Auto-assign examiners to students (2 examiners per student)
export const autoAssignExaminers = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get students with their current examiner count
        const students = await prisma.user.findMany({
            where: { role: UserRole.SISWA },
            include: {
                ExaminerAssignment_ExaminerAssignment_studentIdToUser: {
                    select: { id: true, examinerId: true }
                }
            }
        });

        // Filter students who don't have 2 examiners yet
        const studentsNeedingExaminers = students.filter(s => s.ExaminerAssignment_ExaminerAssignment_studentIdToUser.length < EXAMINERS_PER_STUDENT);

        if (studentsNeedingExaminers.length === 0) {
            res.json({
                success: true,
                message: 'All students already have 2 examiners',
                assigned: 0,
                assignments: []
            });
            return;
        }

        // Get examiners with available slots
        const examiners = await prisma.user.findMany({
            where: { role: UserRole.PENGUJI },
            include: {
                ExaminerAssignment_ExaminerAssignment_examinerIdToUser: {
                    select: { id: true }
                }
            }
        });

        // Create examiner pool with availability tracking
        // Use individual examiner's maxStudents setting, falling back to default MAX_STUDENTS_PER_EXAMINER
        const examinerPool = examiners
            .filter(examiner => {
                const maxStudents = examiner.maxStudents || MAX_STUDENTS_PER_EXAMINER;
                return examiner.ExaminerAssignment_ExaminerAssignment_examinerIdToUser.length < maxStudents;
            })
            .map(examiner => {
                const maxStudents = examiner.maxStudents || MAX_STUDENTS_PER_EXAMINER;
                return {
                    id: examiner.id,
                    name: examiner.name,
                    currentStudents: examiner.ExaminerAssignment_ExaminerAssignment_examinerIdToUser.length,
                    maxStudents: maxStudents,
                    availableSlots: maxStudents - examiner.ExaminerAssignment_ExaminerAssignment_examinerIdToUser.length
                };
            })
            .sort((a, b) => a.currentStudents - b.currentStudents);

        if (examinerPool.length < EXAMINERS_PER_STUDENT) {
            res.status(400).json({
                error: 'Not enough examiners available',
                message: `Need at least ${EXAMINERS_PER_STUDENT} examiners with available slots`
            });
            return;
        }

        const assignments: Array<{ studentId: string; studentName: string; examinerId: string; examinerName: string }> = [];

        // Assign examiners to students
        for (const student of studentsNeedingExaminers) {
            const existingExaminerIds = student.ExaminerAssignment_ExaminerAssignment_studentIdToUser.map(se => se.examinerId);
            const neededExaminers = EXAMINERS_PER_STUDENT - student.ExaminerAssignment_ExaminerAssignment_studentIdToUser.length;

            for (let i = 0; i < neededExaminers; i++) {
                // Find next available examiner who is not already assigned to this student
                const availableExaminer = examinerPool.find(e =>
                    e.availableSlots > 0 && !existingExaminerIds.includes(e.id)
                );

                if (!availableExaminer) {
                    // No more examiners available
                    break;
                }

                // Assign examiner to student
                await prisma.examinerAssignment.create({
                    data: {
                        id: crypto.randomUUID(),
                        studentId: student.id,
                        examinerId: availableExaminer.id,
                        updatedAt: new Date()
                    }
                });

                assignments.push({
                    studentId: student.id,
                    studentName: student.name,
                    examinerId: availableExaminer.id,
                    examinerName: availableExaminer.name
                });

                // Update availability
                availableExaminer.availableSlots--;
                availableExaminer.currentStudents++;
                existingExaminerIds.push(availableExaminer.id);

                // Re-sort pool by current load
                examinerPool.sort((a, b) => a.currentStudents - b.currentStudents);
            }
        }

        res.json({
            success: true,
            message: `Successfully assigned ${assignments.length} examiner assignments`,
            assigned: assignments.length,
            assignments
        });
    } catch (error) {
        console.error('Auto-assign examiners error:', error);
        res.status(500).json({ error: 'Failed to auto-assign examiners' });
    }
};

// Validate examiner assignment
export const validateExaminerAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { examinerId, studentIds } = req.body;

        if (!examinerId || !studentIds || !Array.isArray(studentIds)) {
            res.status(400).json({ error: 'examinerId and studentIds (array) are required' });
            return;
        }

        // Get examiner with current students
        const examiner = await prisma.user.findUnique({
            where: { id: examinerId },
            include: {
                ExaminerAssignment_ExaminerAssignment_examinerIdToUser: {
                    select: { id: true }
                }
            }
        });

        if (!examiner) {
            res.status(404).json({ error: 'Examiner not found' });
            return;
        }

        if (examiner.role !== UserRole.PENGUJI) {
            res.status(400).json({ error: 'User is not an examiner' });
            return;
        }

        const currentStudents = examiner.ExaminerAssignment_ExaminerAssignment_examinerIdToUser.length;
        const newTotal = currentStudents + studentIds.length;

        if (newTotal > MAX_STUDENTS_PER_EXAMINER) {
            res.json({
                valid: false,
                message: `Cannot assign ${studentIds.length} students. Examiner already has ${currentStudents} students. Maximum is ${MAX_STUDENTS_PER_EXAMINER}.`,
                currentStudents,
                maxStudents: MAX_STUDENTS_PER_EXAMINER,
                availableSlots: MAX_STUDENTS_PER_EXAMINER - currentStudents,
                requestedSlots: studentIds.length
            });
            return;
        }

        res.json({
            valid: true,
            message: 'Assignment is valid',
            currentStudents,
            maxStudents: MAX_STUDENTS_PER_EXAMINER,
            availableSlots: MAX_STUDENTS_PER_EXAMINER - currentStudents,
            requestedSlots: studentIds.length,
            newTotal
        });
    } catch (error) {
        console.error('Validate examiner assignment error:', error);
        res.status(500).json({ error: 'Failed to validate assignment' });
    }
};

// Manual assign examiner to student
export const assignExaminer = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, examinerId } = req.body;

        if (!studentId || !examinerId) {
            res.status(400).json({ error: 'studentId and examinerId are required' });
            return;
        }

        // Check if assignment already exists
        const existing = await prisma.examinerAssignment.findFirst({
            where: {
                studentId,
                examinerId
            }
        });

        if (existing) {
            res.status(400).json({ error: 'Examiner already assigned to this student' });
            return;
        }

        // Check student examiner count
        const studentExaminerCount = await prisma.examinerAssignment.count({
            where: { studentId }
        });

        if (studentExaminerCount >= EXAMINERS_PER_STUDENT) {
            res.status(400).json({
                error: `Student already has ${EXAMINERS_PER_STUDENT} examiners`
            });
            return;
        }

        // Check examiner capacity
        const examinerStudentCount = await prisma.examinerAssignment.count({
            where: { examinerId }
        });

        if (examinerStudentCount >= MAX_STUDENTS_PER_EXAMINER) {
            res.status(400).json({
                error: `Examiner already has ${MAX_STUDENTS_PER_EXAMINER} students (maximum capacity)`
            });
            return;
        }

        // Create assignment
        const assignment = await prisma.examinerAssignment.create({
            data: {
                id: crypto.randomUUID(),
                studentId,
                examinerId,
                updatedAt: new Date()
            },
            // include: {
            //     User_ExaminerAssignment_studentIdToUser: {
            //         select: { name: true, nosis: true }
            //     },
            //     User_ExaminerAssignment_examinerIdToUser: {
            //         select: { name: true, nosis: true }
            //     }
            // }
        });

        res.json({
            success: true,
            message: 'Examiner assigned successfully',
            assignment
        });
    } catch (error) {
        console.error('Assign examiner error:', error);
        res.status(500).json({ error: 'Failed to assign examiner' });
    }
};

// Remove examiner assignment
export const removeExaminerAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.examinerAssignment.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Examiner assignment removed successfully'
        });
    } catch (error) {
        console.error('Remove examiner assignment error:', error);
        res.status(500).json({ error: 'Failed to remove assignment' });
    }
};

// Get all students with their assigned examiners
export const getStudentsWithExaminers = async (req: Request, res: Response): Promise<void> => {
    try {
        const students = await prisma.user.findMany({
            where: { role: UserRole.SISWA },
            include: {
                ExaminerAssignment_ExaminerAssignment_studentIdToUser: {
                    include: {
                        User_ExaminerAssignment_examinerIdToUser: {
                            select: {
                                id: true,
                                name: true,
                                nosis: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        const formattedStudents = students.map(student => ({
            id: student.id,
            name: student.name,
            nosis: student.nosis,
            examiners: student.ExaminerAssignment_ExaminerAssignment_studentIdToUser.map(assignment => ({
                id: assignment.id,
                examinerId: assignment.User_ExaminerAssignment_examinerIdToUser.id,
                examinerName: assignment.User_ExaminerAssignment_examinerIdToUser.name,
                examinerNosis: assignment.User_ExaminerAssignment_examinerIdToUser.nosis
            }))
        }));

        res.json({
            students: formattedStudents,
            summary: {
                totalStudents: students.length,
                studentsWithNoExaminers: students.filter(s => s.ExaminerAssignment_ExaminerAssignment_studentIdToUser.length === 0).length,
                studentsWithOneExaminer: students.filter(s => s.ExaminerAssignment_ExaminerAssignment_studentIdToUser.length === 1).length,
                studentsWithTwoExaminers: students.filter(s => s.ExaminerAssignment_ExaminerAssignment_studentIdToUser.length === 2).length
            }
        });
    } catch (error) {
        console.error('Get students with examiners error:', error);
        res.status(500).json({ error: 'Failed to get students with examiners' });
    }
};

// Update examiner max students capacity (Super Admin only)
export const updateExaminerCapacity = async (req: Request, res: Response): Promise<void> => {
    try {
        const { examinerId, maxStudents } = req.body;

        if (!examinerId || !maxStudents) {
            res.status(400).json({ error: 'examinerId and maxStudents are required' });
            return;
        }

        if (maxStudents < 1 || maxStudents > 100) {
            res.status(400).json({ error: 'maxStudents must be between 1 and 100' });
            return;
        }

        // Check if user is examiner
        const examiner = await prisma.user.findUnique({
            where: { id: examinerId },
            include: {
                ExaminerAssignment_ExaminerAssignment_examinerIdToUser: {
                    select: { id: true }
                }
            }
        });

        if (!examiner) {
            res.status(404).json({ error: 'Examiner not found' });
            return;
        }

        if (examiner.role !== UserRole.PENGUJI) {
            res.status(400).json({ error: 'User is not an examiner' });
            return;
        }

        const currentStudents = examiner.ExaminerAssignment_ExaminerAssignment_examinerIdToUser.length;

        if (maxStudents < currentStudents) {
            res.status(400).json({
                error: `Cannot set capacity to ${maxStudents}. Examiner currently has ${currentStudents} students assigned.`,
                currentStudents,
                requestedCapacity: maxStudents
            });
            return;
        }

        // Update max students
        const updated = await prisma.user.update({
            where: { id: examinerId },
            data: { maxStudents },
            select: {
                id: true,
                name: true,
                nosis: true,
                maxStudents: true
            }
        });

        res.json({
            success: true,
            message: `Capacity updated to ${maxStudents} students`,
            examiner: updated
        });
    } catch (error) {
        console.error('Update examiner capacity error:', error);
        res.status(500).json({ error: 'Failed to update examiner capacity' });
    }
};

// Store last auto-assign snapshot for undo functionality
let lastExaminerAssignSnapshot: Array<{ assignmentId: string; studentId: string; examinerId: string }> = [];

// Reset all examiner assignments (remove all students from all examiners)
export const resetAllExaminerAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get all examiner assignments
        const allAssignments = await prisma.examinerAssignment.findMany({
            select: { id: true, studentId: true, examinerId: true }
        });

        if (allAssignments.length === 0) {
            res.json({
                success: true,
                message: 'No assignments to reset',
                resetCount: 0
            });
            return;
        }

        // Save snapshot for undo
        lastExaminerAssignSnapshot = allAssignments.map(a => ({
            assignmentId: a.id,
            studentId: a.studentId,
            examinerId: a.examinerId
        }));

        // Delete all assignments
        const result = await prisma.examinerAssignment.deleteMany({});

        res.json({
            success: true,
            message: `Successfully reset ${result.count} examiner assignments`,
            resetCount: result.count,
            canUndo: true
        });
    } catch (error) {
        console.error('Reset all examiner assignments error:', error);
        res.status(500).json({ error: 'Failed to reset assignments' });
    }
};

// Reset assignments for a specific examiner
export const resetExaminerAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { examinerId } = req.params;

        if (!examinerId) {
            res.status(400).json({ error: 'examinerId is required' });
            return;
        }

        // Check if examiner exists
        const examiner = await prisma.user.findUnique({
            where: { id: examinerId },
            select: { id: true, name: true, role: true }
        });

        if (!examiner) {
            res.status(404).json({ error: 'Examiner not found' });
            return;
        }

        if (examiner.role !== UserRole.PENGUJI) {
            res.status(400).json({ error: 'User is not an examiner' });
            return;
        }

        // Get assignments for this examiner (for snapshot)
        const assignedStudents = await prisma.examinerAssignment.findMany({
            where: { examinerId },
            select: { id: true, studentId: true, examinerId: true }
        });

        // Save snapshot for undo
        lastExaminerAssignSnapshot = assignedStudents.map(a => ({
            assignmentId: a.id,
            studentId: a.studentId,
            examinerId: a.examinerId
        }));

        // Delete assignments for this examiner
        const result = await prisma.examinerAssignment.deleteMany({
            where: { examinerId }
        });

        res.json({
            success: true,
            message: `Successfully reset ${result.count} students from ${examiner.name}`,
            examinerName: examiner.name,
            resetCount: result.count,
            canUndo: true
        });
    } catch (error) {
        console.error('Reset examiner assignments error:', error);
        res.status(500).json({ error: 'Failed to reset examiner assignments' });
    }
};

// Undo last reset or auto-assign operation
export const undoLastExaminerOperation = async (req: Request, res: Response): Promise<void> => {
    try {
        if (lastExaminerAssignSnapshot.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No operation to undo',
                message: 'There is no previous assignment operation to restore'
            });
            return;
        }

        // Restore previous assignments
        let restoredCount = 0;
        for (const snapshot of lastExaminerAssignSnapshot) {
            try {
                await prisma.examinerAssignment.create({
                    data: {
                        id: crypto.randomUUID(),
                        studentId: snapshot.studentId,
                        examinerId: snapshot.examinerId,
                        updatedAt: new Date()
                    }
                });
                restoredCount++;
            } catch (e) {
                // Skip if assignment already exists or other error
                console.warn('Skip restoring assignment:', e);
            }
        }

        // Clear snapshot after undo
        lastExaminerAssignSnapshot = [];

        res.json({
            success: true,
            message: `Successfully restored ${restoredCount} examiner assignments`,
            restoredCount,
            canUndo: false
        });
    } catch (error) {
        console.error('Undo examiner operation error:', error);
        res.status(500).json({ error: 'Failed to undo operation' });
    }
};

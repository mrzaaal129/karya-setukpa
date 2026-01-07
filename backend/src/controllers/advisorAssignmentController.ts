import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { UserRole } from '@prisma/client';

const MAX_STUDENTS_PER_ADVISOR = 25;

// Get advisor capacity statistics
export const getAdvisorCapacity = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get all advisors with their student count
        const advisors = await prisma.user.findMany({
            where: { role: UserRole.PEMBIMBING },
            include: {
                other_User: {
                    select: { id: true }
                }
            }
        });

        const capacityData = advisors.map(advisor => {
            const maxStudents = advisor.maxStudents || MAX_STUDENTS_PER_ADVISOR;
            const currentStudents = advisor.other_User.length;

            return {
                id: advisor.id,
                name: advisor.name,
                nosis: advisor.nosis,
                currentStudents,
                maxStudents,
                availableSlots: maxStudents - currentStudents,
                isFull: currentStudents >= maxStudents,
                percentage: Math.round((currentStudents / maxStudents) * 100)
            };
        });

        // Sort by available slots (descending)
        capacityData.sort((a, b) => b.availableSlots - a.availableSlots);

        res.json({
            advisors: capacityData,
            summary: {
                totalAdvisors: advisors.length,
                fullAdvisors: capacityData.filter(a => a.isFull).length,
                availableAdvisors: capacityData.filter(a => !a.isFull).length,
                totalCapacity: capacityData.reduce((sum, a) => sum + a.maxStudents, 0),
                totalAssigned: capacityData.reduce((sum, a) => sum + a.currentStudents, 0)
            }
        });
    } catch (error) {
        console.error('Get advisor capacity error:', error);
        res.status(500).json({ error: 'Failed to get advisor capacity' });
    }
};

// Auto-assign students to advisors using load balancing
export const autoAssignAdvisors = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get unassigned students
        const unassignedStudents = await prisma.user.findMany({
            where: {
                role: UserRole.SISWA,
                pembimbingId: null
            },
            select: {
                id: true,
                name: true,
                nosis: true
            }
        });

        if (unassignedStudents.length === 0) {
            res.json({
                success: true,
                message: 'No unassigned students found',
                assigned: 0,
                assignments: []
            });
            return;
        }

        // Get advisors with available slots
        const advisors = await prisma.user.findMany({
            where: { role: UserRole.PEMBIMBING },
            include: {
                other_User: {
                    select: { id: true }
                }
            }
        });

        // Filter advisors who have available slots and sort by current student count (ascending)
        const availableAdvisors = advisors
            .filter(advisor => advisor.other_User.length < MAX_STUDENTS_PER_ADVISOR)
            .map(advisor => ({
                id: advisor.id,
                name: advisor.name,
                currentStudents: advisor.other_User.length,
                availableSlots: MAX_STUDENTS_PER_ADVISOR - advisor.other_User.length
            }))
            .sort((a, b) => a.currentStudents - b.currentStudents);

        if (availableAdvisors.length === 0) {
            res.status(400).json({
                error: 'No advisors with available slots',
                message: 'All advisors have reached maximum capacity (25 students)'
            });
            return;
        }

        // Perform round-robin assignment
        const assignments: Array<{ studentId: string; studentName: string; advisorId: string; advisorName: string }> = [];
        let advisorIndex = 0;

        for (const student of unassignedStudents) {
            // Find next available advisor
            while (advisorIndex < availableAdvisors.length && availableAdvisors[advisorIndex].availableSlots <= 0) {
                advisorIndex++;
            }

            if (advisorIndex >= availableAdvisors.length) {
                // No more advisors with available slots
                break;
            }

            const advisor = availableAdvisors[advisorIndex];

            // Assign student to advisor
            await prisma.user.update({
                where: { id: student.id },
                data: { pembimbingId: advisor.id }
            });

            assignments.push({
                studentId: student.id,
                studentName: student.name,
                advisorId: advisor.id,
                advisorName: advisor.name
            });

            // Update available slots
            advisor.availableSlots--;
            advisor.currentStudents++;

            // Move to next advisor for load balancing (round-robin)
            advisorIndex = (advisorIndex + 1) % availableAdvisors.length;
        }

        res.json({
            success: true,
            message: `Successfully assigned ${assignments.length} students`,
            assigned: assignments.length,
            unassigned: unassignedStudents.length - assignments.length,
            assignments
        });
    } catch (error) {
        console.error('Auto-assign error:', error);
        res.status(500).json({ error: 'Failed to auto-assign students' });
    }
};

// Validate assignment before assigning
export const validateAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { advisorId, studentIds } = req.body;

        if (!advisorId || !studentIds || !Array.isArray(studentIds)) {
            res.status(400).json({ error: 'advisorId and studentIds (array) are required' });
            return;
        }

        // Get advisor with current students
        const advisor = await prisma.user.findUnique({
            where: { id: advisorId },
            include: {
                other_User: {
                    select: { id: true }
                }
            }
        });

        if (!advisor) {
            res.status(404).json({ error: 'Advisor not found' });
            return;
        }

        if (advisor.role !== UserRole.PEMBIMBING) {
            res.status(400).json({ error: 'User is not an advisor' });
            return;
        }

        const currentStudents = advisor.other_User.length;
        const newTotal = currentStudents + studentIds.length;

        if (newTotal > MAX_STUDENTS_PER_ADVISOR) {
            res.json({
                valid: false,
                message: `Cannot assign ${studentIds.length} students. Advisor already has ${currentStudents} students. Maximum is ${MAX_STUDENTS_PER_ADVISOR}.`,
                currentStudents,
                maxStudents: MAX_STUDENTS_PER_ADVISOR,
                availableSlots: MAX_STUDENTS_PER_ADVISOR - currentStudents,
                requestedSlots: studentIds.length
            });
            return;
        }

        res.json({
            valid: true,
            message: 'Assignment is valid',
            currentStudents,
            maxStudents: MAX_STUDENTS_PER_ADVISOR,
            availableSlots: MAX_STUDENTS_PER_ADVISOR - currentStudents,
            requestedSlots: studentIds.length,
            newTotal
        });
    } catch (error) {
        console.error('Validate assignment error:', error);
        res.status(500).json({ error: 'Failed to validate assignment' });
    }
};

// Get all students with their assigned advisors
export const getStudentsWithAdvisors = async (req: Request, res: Response): Promise<void> => {
    try {
        const students = await prisma.user.findMany({
            where: { role: UserRole.SISWA },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        nosis: true
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
            pembimbingId: student.pembimbingId,
            pembimbingName: student.User?.name,
            pembimbingNosis: student.User?.nosis
        }));

        res.json({
            students: formattedStudents,
            summary: {
                totalStudents: students.length,
                studentsWithAdvisor: students.filter(s => s.pembimbingId).length,
                studentsWithoutAdvisor: students.filter(s => !s.pembimbingId).length
            }
        });
    } catch (error) {
        console.error('Get students with advisors error:', error);
        res.status(500).json({ error: 'Failed to get students with advisors' });
    }
};

// Update advisor max students capacity (Super Admin only)
export const updateAdvisorCapacity = async (req: Request, res: Response): Promise<void> => {
    try {
        const { advisorId, maxStudents } = req.body;

        if (!advisorId || !maxStudents) {
            res.status(400).json({ error: 'advisorId and maxStudents are required' });
            return;
        }

        if (maxStudents < 1 || maxStudents > 100) {
            res.status(400).json({ error: 'maxStudents must be between 1 and 100' });
            return;
        }

        // Check if user is advisor
        const advisor = await prisma.user.findUnique({
            where: { id: advisorId },
            include: {
                other_User: {
                    select: { id: true }
                }
            }
        });

        if (!advisor) {
            res.status(404).json({ error: 'Advisor not found' });
            return;
        }

        const currentStudents = advisor.other_User.length;

        if (maxStudents < currentStudents) {
            res.status(400).json({
                error: `Cannot set capacity to ${maxStudents}. Advisor currently has ${currentStudents} students assigned.`,
                currentStudents,
                requestedCapacity: maxStudents
            });
            return;
        }

        // Update max students
        const updated = await prisma.user.update({
            where: { id: advisorId },
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
            advisor: updated
        });
    } catch (error) {
        console.error('Update advisor capacity error:', error);
        res.status(500).json({ error: 'Failed to update advisor capacity' });
    }
};

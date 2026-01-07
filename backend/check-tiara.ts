
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAssignments() {
    try {
        console.log('Searching for examiner "Tiara"...');
        const examiner = await prisma.user.findFirst({
            where: { name: { contains: 'Tiara', mode: 'insensitive' } }
        });

        if (!examiner) {
            console.log('Examiner "Tiara" not found.');
            return;
        }

        console.log(`Found Examiner: ${examiner.name} (${examiner.id})`);

        const assignments = await prisma.examinerAssignment.findMany({
            where: { examinerId: examiner.id },
            include: {
                User_ExaminerAssignment_studentIdToUser: {
                    select: { name: true }
                }
            }
        });

        console.log(`Found ${assignments.length} assignments for Tiara.`);
        assignments.forEach(a => {
            console.log(`- Student: ${a.User_ExaminerAssignment_studentIdToUser.name}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAssignments();

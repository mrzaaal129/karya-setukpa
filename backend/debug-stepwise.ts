
import prisma from './src/config/database';

async function verify() {
    const id = '70710dfe-d21f-43cf-a902-133d429f313b';
    console.log(`Debugging Includes for ID: ${id}`);

    // 1. Include User (Simple)
    const q1 = await prisma.paper.findUnique({
        where: { id },
        include: { User: true }
    });
    console.log(`1. With User: ${q1 ? 'OK' : 'FAIL'}`);

    // 2. Include Assignment
    const q2 = await prisma.paper.findUnique({
        where: { id },
        include: { Assignment: true }
    });
    console.log(`2. With Assignment: ${q2 ? 'OK' : 'FAIL'}`);

    // 3. Include Nested User -> ExaminerAssignment
    const q3 = await prisma.paper.findUnique({
        where: { id },
        include: {
            User: {
                include: {
                    ExaminerAssignment_ExaminerAssignment_studentIdToUser: true
                }
            }
        }
    });
    console.log(`3. With Nested ExaminerAssignment: ${q3 ? 'OK' : 'FAIL'}`);

    // 4. Include Comment
    const q4 = await prisma.paper.findUnique({
        where: { id },
        include: {
            Comment: true
        }
    });
    console.log(`4. With Comment: ${q4 ? 'OK' : 'FAIL'}`);
}

verify()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

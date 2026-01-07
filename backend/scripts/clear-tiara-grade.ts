import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Clearing all Grade records (seed data)...');
        // Delete all grades. Real grades are stored in Paper.grade, so these are just duplicates or seeded ones.
        // Wait, current logic fetches from Paper first. 
        // But if I delete all Grades, I might lose "Grade" objects that hold detail?
        // Actually, if ExaminerController only updates Paper.grade, then Grade table is indeed just for Advsior Grading?
        // Or is Grade table unused?
        // Checking schema: Grade is used for advisor feedback and detailed score breakdown.
        // If Tiara hasn't been graded by advisor, she shouldn't have a Grade record.
        // So deleting ALL might be safe IF only my seed script created them.
        // But if an advisor actually graded someone, deleting it would be bad.

        // Better strategy: Delete grades where advisorId matches the "seed" advisor and created recently?
        // Or just delete the one for 'Tiara Farsya'.

        const tiara = await prisma.user.findFirst({ where: { name: { contains: 'Tiara', mode: 'insensitive' } } });
        if (tiara) {
            const paper = await prisma.paper.findFirst({ where: { userId: tiara.id } });
            if (paper) {
                console.log(`Found Tiara's paper: ${paper.id}`);
                const deleted = await prisma.grade.deleteMany({
                    where: { paperId: paper.id }
                });
                console.log(`Deleted ${deleted.count} grade records for Tiara.`);
            } else {
                console.log('Tiara has no paper.');
            }
        } else {
            console.log('User Tiara not found.');
        }

        // Also check for any Grade records where paper.grade is null?
        // No, paper.grade might be null if only advisor graded? 
        // Sync logic: examiner -> Paper.grade. Advisor -> Grade table.
        // So they are separate.

    } catch (error) {
        console.error('Error clearing grades:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

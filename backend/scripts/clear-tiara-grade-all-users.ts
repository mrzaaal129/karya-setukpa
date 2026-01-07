import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Clearing Grades for ALL users named Tiara ---');
        const users = await prisma.user.findMany({
            where: { name: { contains: 'Tiara', mode: 'insensitive' } }
        });

        console.log(`Found ${users.length} user(s) matching "Tiara".`);

        for (const user of users) {
            console.log(`Processing User: ${user.name} (${user.id})`);

            const papers = await prisma.paper.findMany({ where: { userId: user.id } });
            console.log(`  Found ${papers.length} papers.`);

            for (const paper of papers) {
                // Delete linked Grade records
                const deleteGrade = await prisma.grade.deleteMany({
                    where: { paperId: paper.id }
                });
                if (deleteGrade.count > 0) {
                    console.log(`  Paper ${paper.id}: Deleted ${deleteGrade.count} Grade records.`);
                }

                // Set Paper.grade to null
                if (paper.grade !== null) {
                    const updatedPaper = await prisma.paper.update({
                        where: { id: paper.id },
                        data: { grade: null }
                    });
                    console.log(`  Paper ${paper.id}: Grade set to null.`);
                }
            }
        }

    } catch (error) {
        console.error('Error clearing grades:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Searching for User Tiara...');
        const tiara = await prisma.user.findFirst({ where: { name: { contains: 'Tiara', mode: 'insensitive' } } });

        if (tiara) {
            console.log(`Found Tiara: ${tiara.id}`);

            // Find all papers for Tiara
            const papers = await prisma.paper.findMany({ where: { userId: tiara.id } });
            console.log(`Found ${papers.length} papers for Tiara.`);

            for (const paper of papers) {
                console.log(`Processing Paper: ${paper.id} (${paper.title})`);
                console.log(`Current Paper Grade: ${paper.grade}`);

                // Delete linked Grade records
                const deleteGrade = await prisma.grade.deleteMany({
                    where: { paperId: paper.id }
                });
                console.log(`Deleted ${deleteGrade.count} Grade records.`);

                // Set Paper.grade to null
                const updatedPaper = await prisma.paper.update({
                    where: { id: paper.id },
                    data: { grade: null }
                });
                console.log(`Updated Paper.grade to null. New value: ${updatedPaper.grade}`);
            }
        } else {
            console.log('User Tiara not found.');
        }

    } catch (error) {
        console.error('Error clearing grades:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

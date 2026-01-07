import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const gradeCount = await prisma.grade.count();
        console.log(`Current grade count: ${gradeCount}`);

        if (gradeCount === 0) {
            console.log('No grades found. Creating sample grades...');

            // Find an advisor and some students
            const advisor = await prisma.user.findFirst({ where: { role: 'PEMBIMBING' } });

            // Get students with papers
            const papers = await prisma.paper.findMany({
                take: 5,
                include: { User: true }
            });

            if (!advisor) {
                console.log('No advisor found. Please ensure users exist.');
                return;
            }

            if (papers.length === 0) {
                console.log('No papers found to grade.');
                return;
            }

            console.log(`Found advisor: ${advisor.name} and ${papers.length} papers.`);

            for (const paper of papers) {
                await prisma.grade.create({
                    data: {
                        id: crypto.randomUUID(),
                        paperId: paper.id,
                        advisorId: advisor.id,
                        contentScore: 20,
                        structureScore: 20,
                        languageScore: 20,
                        formatScore: 25,
                        finalScore: 85,
                        advisorFeedback: 'Sample feedback: Good job!',
                        updatedAt: new Date()
                    }
                });
                console.log(`Created grade for paper: ${paper.title}`);
            }
            console.log('Sample grades created successfully.');
        } else {
            console.log('Grades already exist. Skipping creation.');
        }

    } catch (error) {
        console.error('Error seeding grades:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

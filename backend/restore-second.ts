
import prisma from './src/config/database';

async function restoreSecond() {
    const id = 'd90087fa-5e4c-4ba2-8e5a-cd0f0604cba7';
    console.log(`Restoring Second Paper: ${id}`);

    const user = await prisma.user.findFirst({
        where: { name: { contains: 'Mochamad Rizal' } }
    });
    if (!user) return;

    // Find or create assignment
    const assignment = await prisma.assignment.findFirst();

    await prisma.paper.upsert({
        where: { id },
        update: {},
        create: {
            id,
            title: 'Tugas Makalah (Restored)',
            subject: 'Umum',
            content: '<p><em>[Data dipulihkan sistem]</em></p>',
            structure: {},
            userId: user.id,
            assignmentId: assignment?.id || 'dummy',
            grade: 80,
            updatedAt: new Date()
        }
    });
    console.log("Restored d9008...");

    // Also restore grade
    await prisma.grade.upsert({
        where: { paperId: id },
        update: {},
        create: {
            id: crypto.randomUUID(),
            paperId: id,
            advisorId: user.id,
            finalScore: 82,
            contentScore: 30,
            structureScore: 25,
            languageScore: 17,
            formatScore: 10,
            advisorFeedback: "Nilai dipulihkan.",
            updatedAt: new Date()
        }
    });
}

restoreSecond()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

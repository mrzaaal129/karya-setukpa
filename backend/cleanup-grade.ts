
import prisma from './src/config/database';

async function cleanup() {
    console.log("Starting Cleanup...");

    // 1. Delete dummies
    const dummies = ['70710dfe-d21f-43cf-a902-133d429f313b', 'd90087fa-5e4c-4ba2-8e5a-cd0f0604cba7'];

    for (const id of dummies) {
        try {
            await prisma.grade.deleteMany({ where: { paperId: id } });
            await prisma.paper.delete({ where: { id } });
            console.log(`Deleted dummy: ${id}`);
        } catch (e) {
            console.log(`Failed to delete ${id} (maybe already gone)`);
        }
    }

    // 2. Update Real Paper Grade
    const realId = 'd7526887-d804-4963-b0e8-4db067b5feb9';
    try {
        await prisma.paper.update({
            where: { id: realId },
            data: { grade: 80 }
        });
        console.log(`Updated Paper Grade to 80 for ${realId}`);

        // Ensure Advisor Grade exists?
        // User screenshot showed advisor grade 85.
        // If user wants overall 85, then Paper(80) + Advisor(??) -> Formula?
        // Controller Logic: finalScore = paper.grade ?? advisorGrade.finalScore.
        // So if Paper.grade = 80, final score will be 80.
        // The user complained "Nilai 85 dari mana sedangkan penguji memberi 80".
        // This implies they WANT 80.
        // So setting Paper.grade = 80 will result in Final Score = 80.
    } catch (e) {
        console.error("Failed to update real paper:", e);
    }
}

cleanup()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

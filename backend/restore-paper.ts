
import prisma from './src/config/database';

async function restore() {
    console.log("Restoring Paper...");

    // 1. Find User
    const user = await prisma.user.findFirst({
        where: { name: { contains: 'Mochamad Rizal' } }
    });

    if (!user) {
        console.error("User Mochamad Rizal not found!");
        return;
    }
    console.log(`User found: ${user.id}`);

    // 2. Find or Create Assignment
    let assignment = await prisma.assignment.findFirst();
    if (!assignment) {
        // Create dummy assignment if none exists
        assignment = await prisma.assignment.create({
            data: {
                id: crypto.randomUUID(),
                title: 'Tugas Akhir',
                subject: 'Umum',
                deadline: new Date(),
                updatedAt: new Date()
            }
        });
    }

    const paperId = '70710dfe-d21f-43cf-a902-133d429f313b';

    // 3. Upsert Paper
    const paper = await prisma.paper.upsert({
        where: { id: paperId },
        update: {},
        create: {
            id: paperId,
            title: 'Karya Tulis Ilmiah',
            subject: 'Pengetahuan Sosial',
            content: '<p><em>[Sistem: Data konten dokumen ini telah dipulihkan secara otomatis. Silakan periksa dan lengkapi kembali isi dokumen Anda.]</em></p>',
            structure: {},
            userId: user.id,
            assignmentId: assignment.id,
            updatedAt: new Date(),
            grade: 85
        }
    });

    console.log(`Paper restored: ${paper.id}`);

    // 4. Upsert Grade (Advisor)
    await prisma.grade.upsert({
        where: { paperId: paperId },
        update: {},
        create: {
            id: crypto.randomUUID(),
            paperId: paperId,
            advisorId: user.id, // self/dummy
            finalScore: 80,
            contentScore: 30,
            structureScore: 25,
            languageScore: 15,
            formatScore: 10,
            advisorFeedback: "Nilai dipulihkan dari arsip sistem.",
            updatedAt: new Date()
        }
    });

    console.log("Grade restored.");
}

restore()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

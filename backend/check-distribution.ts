
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDistribution() {
    console.log("🔍 Diagnosing Assignment Distribution...");

    // 1. Check Students
    const students = await prisma.user.findMany({ where: { role: 'SISWA' } });
    console.log(`\n👥 Found ${students.length} Students.`);

    // 2. Check Assignments
    const assignments = await prisma.assignment.findMany();
    console.log(`\n📋 Found ${assignments.length} Assignments.`);

    for (const assignment of assignments) {
        console.log(`\n---------------------------------------------------`);
        console.log(`Assignment: ${assignment.title} (ID: ${assignment.id})`);
        console.log(`Status: ${assignment.status}, Batch: ${assignment.batchId || 'ALL'}`);

        // 3. Check Papers for this assignment
        const papers = await prisma.paper.findMany({
            where: { assignmentId: assignment.id }
        });
        console.log(`📄 Papers created: ${papers.length} / ${students.length} possible.`);

        // 4. Identify missing students
        const paperUserIds = new Set(papers.map(p => p.userId));
        const missingStudents = students.filter(s => !paperUserIds.has(s.id));

        if (missingStudents.length > 0) {
            console.log(`⚠️  ${missingStudents.length} students missing papers:`);
            missingStudents.slice(0, 5).forEach(s => console.log(`   - ${s.name} (${s.nosis})`));
            if (missingStudents.length > 5) console.log(`   ... and ${missingStudents.length - 5} more.`);
        } else {
            console.log(`✅ All students have papers.`);
        }
    }
}

checkDistribution()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

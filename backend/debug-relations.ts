
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Advisor-Student Relations ---');

    const advisors = await prisma.user.findMany({
        where: { role: 'PEMBIMBING' },
        select: { id: true, name: true, email: true }
    });

    console.log(`Found ${advisors.length} Advisors:`);
    advisors.forEach(a => console.log(`- [${a.id}] ${a.name} (${a.email})`));

    const students = await prisma.user.findMany({
        where: { role: 'SISWA' },
        select: {
            id: true,
            name: true,
            pembimbingId: true,
            User: { select: { name: true } }
        }
    });

    console.log(`\nFound ${students.length} Students:`);
    students.forEach(s => {
        const assigned = s.User ? `Assigned to: ${s.User.name} [${s.pembimbingId}]` : 'UNASSIGNED';
        console.log(`- [${s.id}] ${s.name} -> ${assigned}`);
    });

    console.log('\n--- Checking Papers ---');
    const papers = await prisma.paper.findMany({
        select: { id: true, title: true, studentId: true, contentApprovalStatus: true }
    });
    papers.forEach(p => console.log(`Paper [${p.id}] "${p.title}" (Student: ${p.studentId}) Status: ${p.contentApprovalStatus}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

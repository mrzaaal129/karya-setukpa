
import prisma from './src/config/database';

async function checkIdType() {
    const id = 'd90087fa-5e4c-4ba2-8e5a-cd0f0604cba7';
    console.log(`Checking ID: ${id}`);

    const p = await prisma.paper.count({ where: { id } });
    console.log(`Paper count: ${p}`);

    const a = await prisma.assignment.count({ where: { id } });
    console.log(`Assignment count: ${a}`);

    const g = await prisma.grade.count({ where: { id } });
    console.log(`Grade count: ${g}`);

    // Check if it's a Grade's paperId but the paper is missing?
    const orphanGrade = await prisma.grade.findFirst({ where: { paperId: id } });
    console.log(`Grade referencing this PaperId exists: ${!!orphanGrade}`);
}

checkIdType()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetId = '70710dfe-d21f-43cf-a902-133d429f313b';
    console.log(`Checking identity of ID: ${targetId}`);

    // Check Paper
    const paper = await prisma.paper.findUnique({ where: { id: targetId } });
    if (paper) console.log(`✓ Found as PAPER: ${paper.title}`);
    else console.log(`✗ Not a Paper`);

    // Check Assignment
    const assignment = await prisma.assignment.findUnique({ where: { id: targetId } });
    if (assignment) console.log(`✓ Found as ASSIGNMENT: ${assignment.title}`);
    else console.log(`✗ Not an Assignment`);

    // Check Grade
    // Check Submission (if exists?) - Prisma schema check needed but usually Paper is submission

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

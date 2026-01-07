
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const paperId = 'd7526887-d804-4963-b0e8-4db067b5feb9';
    console.log(`Verifying paper: ${paperId}`);

    const paper = await prisma.paper.findUnique({
        where: { id: paperId },
        include: {
            User: true,
            Grade: true,
            Assignment: true
        }
    });

    if (!paper) {
        console.log("Paper NOT FOUND!");
    } else {
        console.log("Paper FOUND:");
        console.log(`Title: ${paper.title}`);
        console.log(`User: ${paper.User?.name}`);
        console.log(`Content length: ${paper.content?.length}`);
        console.log(`Structure length: ${Array.isArray(paper.structure) ? (paper.structure as any[]).length : 0}`);
        console.log(`Grade: ${paper.grade}`);
        console.log(`Final Score (Advisor): ${paper.Grade?.finalScore}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

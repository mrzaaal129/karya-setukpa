
import prisma from './src/config/database';

async function inspectStructure() {
    const id = 'd7526887-d804-4963-b0e8-4db067b5feb9';
    const paper = await prisma.paper.findUnique({
        where: { id },
        select: { structure: true }
    });

    if (paper) {
        console.log("Structure:", JSON.stringify(paper.structure, null, 2).substring(0, 500));
    }
}

inspectStructure()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

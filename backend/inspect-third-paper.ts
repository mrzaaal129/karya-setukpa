
import prisma from './src/config/database';

async function inspectThird() {
    const id = 'd7526887-d804-4963-b0e8-4db067b5feb9';
    console.log(`Inspecting ID: ${id}`);

    const paper = await prisma.paper.findUnique({
        where: { id },
        include: { Assignment: true, Grade: true }
    });

    if (paper) {
        console.log(`FOUND!`);
        console.log(`Title: ${paper.title}`);
        console.log(`Content Len: ${paper.content.length}`);
        console.log(`Content Preview: ${paper.content.substring(0, 50)}...`);
        console.log(`Assignment: ${paper.Assignment?.title}`);
        console.log(`Grade: ${paper.grade}`);
        console.log(`Advisor Grade: ${paper.Grade?.finalScore}`);
    } else {
        console.log("NOT FOUND");
    }
}

inspectThird()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

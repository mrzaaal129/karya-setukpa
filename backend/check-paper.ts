
import prisma from './src/config/database';

async function checkPaper() {
    const id = 'd90087fa-5e4c-4ba2-8e5a-cd0f0604cba7';
    console.log(`Checking for paper with ID: ${id}`);

    const paper = await prisma.paper.findUnique({
        where: { id }
    });

    if (paper) {
        console.log("Paper FOUND:", paper.title);
    } else {
        console.log("Paper NOT FOUND.");
    }
}

checkPaper()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const paperId = '9f9777ee-ed44-48f4-98c0-d86a1d3df34e';
    console.log(`Checking Paper ID: ${paperId}`);

    const paper = await prisma.paper.findUnique({
        where: { id: paperId }
    });

    if (paper) {
        console.log('----- DB Data -----');
        console.log('finalFileName:', paper.finalFileName);
        console.log('finalFileUrl:', paper.finalFileUrl);
        console.log('-------------------');
    } else {
        console.log('Paper not found in DB!');
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

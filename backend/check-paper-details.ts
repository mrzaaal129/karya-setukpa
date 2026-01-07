
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaper() {
    try {
        const id = 'd7526887-d804-4963-b0e8-4db067b5feb9';
        console.log(`Checking Paper ID: ${id}`);

        const paper = await prisma.paper.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                contentApprovalStatus: true,
                finalApprovalStatus: true,
                finalFileUrl: true,
                finalFileName: true
            }
        });

        if (!paper) {
            console.log('Paper not found');
            return;
        }

        console.log('Paper Details:');
        console.log(JSON.stringify(paper, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkPaper();

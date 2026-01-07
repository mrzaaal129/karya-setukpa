
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PAPER_ID = 'd7526887-d804-4963-b0e8-4db067b5feb9';

async function main() {
    console.log(`--- Debugging Paper ${PAPER_ID} ---`);

    const paper = await prisma.paper.findUnique({
        where: { id: PAPER_ID },
        include: {
            User: true,
            Assignment: true
        }
    });

    if (!paper) {
        console.log('PAPER NOT FOUND!');
        return;
    }

    console.log('Paper Found:');
    console.log(`Title: "${paper.title}"`);
    console.log(`User ID: ${paper.userId}`);
    console.log(`Student Name: ${paper.User?.name || 'MISSING USER RELATION'}`);
    console.log(`Structure Type: ${typeof paper.structure}`);
    console.log(`Structure:`, JSON.stringify(paper.structure).slice(0, 100) + '...');
    console.log(`Approval Status: ${paper.contentApprovalStatus}`);

    // Check relation manually if missing
    if (!paper.User) {
        const user = await prisma.user.findUnique({ where: { id: paper.userId } });
        console.log('Manual User Lookup:', user ? `Found: ${user.name}` : 'USER NOT FOUND IN DB');
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

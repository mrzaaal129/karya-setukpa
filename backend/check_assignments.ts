
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const assignments = await prisma.assignment.findMany();
    console.log('Total assignments:', assignments.length);
    if (assignments.length > 0) {
        console.log('Sample Assignment:', JSON.stringify(assignments[0], null, 2));
    } else {
        console.log('No assignments found.');
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

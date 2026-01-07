
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { name: { contains: 'Mochamad Rizal' } },
        include: {
            Paper: {
                include: {
                    Assignment: true,
                    Grade: true
                }
            }
        }
    });

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        console.log(`User: ${user.name} (${user.id})`);
        console.log(`Papers count: ${user.Paper.length}`);
        user.Paper.forEach(p => {
            console.log(` - ID: ${p.id}`);
            console.log(`   Title: ${p.title}`);
            console.log(`   Assignment: ${p.Assignment?.title}`);
            console.log(`   Grade: ${p.grade}`);
            console.log(`   FinalScore: ${p.Grade?.finalScore}`);
            console.log('---');
        });
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

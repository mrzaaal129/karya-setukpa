import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Debugging Tiara ---');
        const users = await prisma.user.findMany({
            where: { name: { contains: 'Tiara', mode: 'insensitive' } },
            include: {
                Paper: {
                    include: {
                        Grade: true
                    }
                }
            }
        });

        console.log(`Found ${users.length} user(s) matching "Tiara".`);

        for (const u of users) {
            console.log(`User: ${u.name} (ID: ${u.id}, NOSIS: ${u.nosis})`);
            console.log(`  Papers (${u.Paper.length}):`);
            for (const p of u.Paper) {
                console.log(`    - ID: ${p.id}`);
                console.log(`      Title: ${p.title}`);
                console.log(`      Paper.grade: ${p.grade}`);
                console.log(`      Grade Table Entry: ${p.Grade ? `ID: ${p.Grade.id}, FinalScore: ${p.Grade.finalScore}` : 'None'}`);
            }
            console.log('---');
        }

    } catch (error) {
        console.error('Error debugging:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();


import prisma from './src/config/database';

async function listPapers() {
    const users = await prisma.user.findMany({
        where: { name: { contains: 'Mochamad Rizal', mode: 'insensitive' } }
    });

    console.log(`Found ${users.length} users matching 'Mochamad Rizal':`);

    for (const u of users) {
        console.log(`\nUser: ${u.name} (ID: ${u.id})`);
        const papers = await prisma.paper.findMany({ where: { userId: u.id } });
        console.log(`- Papers: ${papers.length}`);
        papers.forEach(p => console.log(`  > ${p.id}: ${p.title}`));
    }



}

listPapers()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

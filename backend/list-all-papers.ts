
import prisma from './src/config/database';

async function listAll() {
    const papers = await prisma.paper.findMany();
    console.log(`Total Papers: ${papers.length}`);
    papers.forEach(p => console.log(`[${p.id}] ${p.title} (User: ${p.userId})`));
}

listAll()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

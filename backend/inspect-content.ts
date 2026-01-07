
import prisma from './src/config/database';

async function inspect() {
    const papers = await prisma.paper.findMany();
    console.log(`Checking ${papers.length} papers for real content...`);

    for (const p of papers) {
        console.log(`\nID: ${p.id}`);
        console.log(`Title: ${p.title}`);
        console.log(`Content Preview: ${p.content ? p.content.substring(0, 100).replace(/\n/g, ' ') : 'NULL'}`);
        console.log(`File: ${p.finalFileUrl || 'None'}`);
    }
}

inspect()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

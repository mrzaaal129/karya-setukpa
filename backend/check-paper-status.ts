import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const paper = await prisma.paper.findFirst({
        where: { id: '1e9291f2-0826-47bf-9653-661b67a057dd' },
        select: { structure: true }
    });

    if (paper && paper.structure) {
        const s = paper.structure as any[];
        console.log('=== PAPER STRUCTURE FROM DATABASE ===');
        s.forEach((ch, i) => {
            console.log(`\nChapter ${i + 1}: "${ch.title}"`);
            console.log(`  - status: ${ch.status || 'UNDEFINED'}`);
            console.log(`  - feedbackHistory: ${ch.feedbackHistory ? JSON.stringify(ch.feedbackHistory) : 'NONE'}`);
            console.log(`  - content length: ${ch.content ? ch.content.length : 0}`);
        });
    } else {
        console.log('Paper not found or no structure');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

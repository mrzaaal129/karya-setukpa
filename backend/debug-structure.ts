import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetId = '58042b73-01e2-4dfd-baf0-6ec99b15bc76'; // Paper ID
    console.log('CHECKING_TEMPLATE_PAGES');

    const paper = await prisma.paper.findUnique({
        where: { id: targetId },
        include: { Assignment: { include: { PaperTemplate: true } } }
    });

    if (!paper) {
        console.log('PAPER_NOT_FOUND');
        return;
    }

    const pages = paper.Assignment?.PaperTemplate?.pages;
    if (!pages) {
        console.log('NO_TEMPLATE_PAGES');
        return;
    }

    console.log('PAGES_ARRAY_LENGTH:', Array.isArray(pages) ? pages.length : 'NOT_ARRAY');

    if (Array.isArray(pages)) {
        pages.forEach((p: any, i) => {
            console.log(`PAGE_${i}_TYPE:`, p.type);
            console.log(`PAGE_${i}_HAS_STRUCTURE:`, !!p.structure);
            if (p.type === 'CONTENT') {
                console.log(`PAGE_${i}_STRUCTURE_LENGTH:`, p.structure?.length);
                console.log(JSON.stringify(p.structure));
            }
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

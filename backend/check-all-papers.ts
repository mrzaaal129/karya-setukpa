import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const papers = await prisma.paper.findMany({
        include: {
            User: { select: { id: true, name: true, nosis: true } },
            Assignment: { select: { id: true, title: true } }
        }
    });

    const result: any[] = [];

    papers.forEach((paper) => {
        const structure = paper.structure as any[];
        const approvedCount = structure?.filter((ch: any) => ch.status === 'APPROVED').length || 0;
        const hasContent = structure?.some((ch: any) => ch.content && ch.content.length > 100);

        result.push({
            paperId: paper.id,
            paperTitle: paper.title,
            ownerName: paper.User?.name,
            ownerNosis: paper.User?.nosis,
            assignmentTitle: paper.Assignment?.title,
            totalChapters: structure?.length || 0,
            approvedChapters: approvedCount,
            hasContent: hasContent
        });
    });

    fs.writeFileSync('papers-summary.json', JSON.stringify(result, null, 2));
    console.log('Saved to papers-summary.json');
}

main().finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const paper = await prisma.paper.findFirst({
        where: { id: '1e9291f2-0826-47bf-9653-661b67a057dd' }
    });

    if (paper && paper.structure) {
        const s = paper.structure as any[];

        // Write to file for inspection
        fs.writeFileSync('structure-output.json', JSON.stringify(s, null, 2));
        console.log('Structure saved to structure-output.json');
        console.log('Total chapters:', s.length);
    }
}

main().finally(() => prisma.$disconnect());

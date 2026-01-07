
import prisma from './src/config/database';
import fs from 'fs';
import path from 'path';

async function audit() {
    console.log("--- AUDIT START ---");

    // 1. Search for papers
    const candidates = await prisma.paper.findMany({
        select: { id: true, title: true, userId: true, content: true, finalFileUrl: true }
    });

    console.log(`\nTotal Papers in DB: ${candidates.length}`);
    candidates.forEach(p => {
        const hasContent = p.content && p.content.length > 20;
        const hasFile = !!p.finalFileUrl;
        console.log(`- [${p.id}] "${p.title}" (User: ${p.userId})`);
        console.log(`  > Content Len: ${p.content ? p.content.length : 0} | File: ${p.finalFileUrl || 'NONE'}`);
    });

    // 2. List files in uploads dir
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadDir)) {
        console.log('\nFiles in uploads:');
        const files = fs.readdirSync(uploadDir);
        files.forEach((f: string) => console.log(`- ${f}`));
    } else {
        console.log('\nUploads directory not found.');
    }

    console.log("--- AUDIT END ---");
}

audit()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

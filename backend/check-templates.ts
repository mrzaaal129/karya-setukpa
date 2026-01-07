import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTemplates() {
    try {
        const templates = await prisma.paperTemplate.findMany({
            select: {
                id: true,
                name: true,
            }
        });

        console.log('📋 Available Templates:');
        templates.forEach(t => {
            console.log(`  - ID: ${t.id}, Name: ${t.name}`);
        });

        if (templates.length === 0) {
            console.log('⚠️  NO TEMPLATES FOUND! This will cause assignment creation to fail.');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTemplates();

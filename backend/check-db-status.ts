import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        console.log('🔍 Checking database connection...');

        // Test connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Check tables
        console.log('\n📊 Checking tables...');
        const userCount = await prisma.user.count();
        const batchCount = await prisma.batch.count();
        const templateCount = await prisma.paperTemplate.count();
        const assignmentCount = await prisma.assignment.count();
        const paperCount = await prisma.paper.count();

        console.log(`   - Users: ${userCount}`);
        console.log(`   - Batches: ${batchCount}`);
        console.log(`   - Templates: ${templateCount}`);
        console.log(`   - Assignments: ${assignmentCount}`);
        console.log(`   - Papers: ${paperCount}`);

        // List all users
        if (userCount > 0) {
            console.log('\n👥 Existing users:');
            const users = await prisma.user.findMany({
                select: { nosis: true, name: true, role: true }
            });
            users.forEach(user => {
                console.log(`   - ${user.nosis}: ${user.name} (${user.role})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();

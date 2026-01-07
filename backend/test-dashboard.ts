import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
});

async function testDashboardQueries() {
    try {
        console.log('🧪 Testing dashboard queries...\n');

        // Test 1: Activity logs
        console.log('1. Testing activity logs query...');
        try {
            const activities = await prisma.activityLog.findMany({
                take: 10,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            role: true
                        }
                    }
                }
            });
            console.log(`   ✅ Found ${activities.length} activities`);
        } catch (error) {
            console.error('   ❌ Error:', error);
        }

        // Test 2: Batches
        console.log('\n2. Testing batches query...');
        try {
            const batches = await prisma.batch.findMany({
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    _count: {
                        select: { users: true }
                    }
                }
            });
            console.log(`   ✅ Found ${batches.length} batches`);
            batches.forEach(b => {
                console.log(`      - ${b.name} (${b._count.users} users)`);
            });
        } catch (error) {
            console.error('   ❌ Error:', error);
        }

        // Test 3: Dashboard stats
        console.log('\n3. Testing dashboard stats...');
        try {
            const totalUsers = await prisma.user.count();
            const activeAssignments = await prisma.assignment.count();
            const templates = await prisma.paperTemplate.count();

            console.log(`   ✅ Users: ${totalUsers}`);
            console.log(`   ✅ Assignments: ${activeAssignments}`);
            console.log(`   ✅ Templates: ${templates}`);
        } catch (error) {
            console.error('   ❌ Error:', error);
        }

        console.log('\n✅ All tests completed!');

    } catch (error) {
        console.error('\n❌ Error during testing:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDashboardQueries();

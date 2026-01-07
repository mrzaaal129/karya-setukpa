import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testBatchCreation() {
    try {
        console.log('🧪 Testing batch creation...\n');

        // Test 1: Check database connection
        console.log('1. Testing database connection...');
        await prisma.$connect();
        console.log('   ✅ Database connected\n');

        // Test 2: Check existing batches
        console.log('2. Checking existing batches...');
        const existingBatches = await prisma.batch.findMany();
        console.log(`   Found ${existingBatches.length} existing batches\n`);

        // Test 3: Try to create a batch
        console.log('3. Attempting to create a new batch...');
        const testBatch = await prisma.batch.create({
            data: {
                name: 'Test Batch ' + new Date().toISOString(),
                startDate: new Date('2025-01-15'),
                endDate: null,
                isActive: true
            }
        });
        console.log('   ✅ Batch created successfully!');
        console.log('   Batch ID:', testBatch.id);
        console.log('   Batch Name:', testBatch.name);

        // Test 4: Verify batch was created
        console.log('\n4. Verifying batch in database...');
        const verifyBatch = await prisma.batch.findUnique({
            where: { id: testBatch.id }
        });
        console.log('   ✅ Batch verified:', verifyBatch?.name);

        // Test 5: Clean up - delete test batch
        console.log('\n5. Cleaning up test batch...');
        await prisma.batch.delete({
            where: { id: testBatch.id }
        });
        console.log('   ✅ Test batch deleted\n');

        console.log('✅ All tests passed! Batch creation is working correctly.');

    } catch (error) {
        console.error('\n❌ Error during testing:');
        console.error(error);

        if (error instanceof Error) {
            console.error('\nError details:');
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

testBatchCreation();

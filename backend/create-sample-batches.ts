import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleBatches() {
    try {
        // Check if batches already exist
        const existingBatches = await prisma.batch.findMany();

        if (existingBatches.length > 0) {
            console.log(`✅ Database already has ${existingBatches.length} batch(es)`);
            existingBatches.forEach(batch => {
                console.log(`   - ${batch.name} (${batch.isActive ? 'Active' : 'Inactive'})`);
            });
            await prisma.$disconnect();
            return;
        }

        // Create sample batches
        const batches = await prisma.batch.createMany({
            data: [
                {
                    name: 'Angkatan 2024',
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-12-31'),
                    isActive: true,
                },
                {
                    name: 'Angkatan 2023',
                    startDate: new Date('2023-01-01'),
                    endDate: new Date('2023-12-31'),
                    isActive: false,
                },
            ],
        });

        console.log(`✅ Created ${batches.count} sample batches`);

        // Fetch and display created batches
        const createdBatches = await prisma.batch.findMany();
        createdBatches.forEach(batch => {
            console.log(`   - ${batch.name} (${batch.isActive ? 'Active' : 'Inactive'})`);
        });

    } catch (error) {
        console.error('❌ Error creating sample batches:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSampleBatches();

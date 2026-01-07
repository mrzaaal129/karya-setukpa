import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser(nosis) {
    try {
        const user = await prisma.user.findUnique({
            where: { nosis: nosis },
            include: {
                Batch: true
            }
        });

        if (user) {
            console.log('✅ Found user:');
            console.log('ID:', user.id);
            console.log('Name:', user.name);
            console.log('Role:', user.role);
            console.log('Batch:', user.Batch ? user.Batch.name : 'None');
            console.log('Is Active:', user.isActive ? 'Yes' : 'No');
            console.log('Has Password:', user.password ? 'Yes' : 'No');
        } else {
            console.log('❌ User not found with NOSIS:', nosis);
        }
    } catch (error) {
        console.error('Error checking user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const nosisToCheck = process.argv[2] || '00070574';
checkUser(nosisToCheck);

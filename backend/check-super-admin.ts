import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuperAdmin() {
    try {
        console.log('🔍 Checking Super Admin user...\n');

        const superAdmin = await prisma.user.findUnique({
            where: { nosis: 'SA001' },
            select: {
                id: true,
                nosis: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        if (!superAdmin) {
            console.log('❌ Super Admin (SA001) not found in database!');
            return;
        }

        console.log('✅ Super Admin found:');
        console.log('   ID:', superAdmin.id);
        console.log('   NOSIS:', superAdmin.nosis);
        console.log('   Name:', superAdmin.name);
        console.log('   Email:', superAdmin.email);
        console.log('   Role:', superAdmin.role);
        console.log('   Created:', superAdmin.createdAt);

        if (superAdmin.role !== 'SUPER_ADMIN') {
            console.log('\n⚠️  WARNING: User role is not SUPER_ADMIN!');
            console.log('   Expected: SUPER_ADMIN');
            console.log('   Actual:', superAdmin.role);
        } else {
            console.log('\n✅ Role is correct: SUPER_ADMIN');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSuperAdmin();

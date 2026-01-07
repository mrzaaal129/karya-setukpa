import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyUser() {
    try {
        console.log('🔍 Checking SA001 user in database...');

        const user = await prisma.user.findUnique({
            where: { nosis: 'SA001' }
        });

        if (!user) {
            console.log('❌ User SA001 NOT FOUND in database!');
            return;
        }

        console.log('✅ User found:');
        console.log('   NOSIS:', user.nosis);
        console.log('   Name:', user.name);
        console.log('   Role:', user.role);
        console.log('   Email:', user.email);
        console.log('   Password hash:', user.password);

        // Test password
        const testPassword = 'password123';
        const isValid = await bcrypt.compare(testPassword, user.password);

        console.log('\n🔐 Password Test:');
        console.log('   Testing password:', testPassword);
        console.log('   Password valid:', isValid ? '✅ YES' : '❌ NO');

        if (!isValid) {
            console.log('\n⚠️  Password does not match! Need to update password hash.');
            const newHash = await bcrypt.hash(testPassword, 10);
            console.log('   New hash would be:', newHash);
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyUser();

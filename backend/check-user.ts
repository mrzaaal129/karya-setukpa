
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
    try {
        console.log('Checking for SA001...');
        const user = await prisma.user.findUnique({
            where: { nosis: 'SA001' }
        });

        if (user) {
            console.log('✅ User SA001 found:', user);
            const isMatch = await bcrypt.compare('password123', user.password);
            console.log('Checking password "password123":', isMatch ? '✅ MATCH' : '❌ MISMATCH');
        } else {
            console.log('❌ User SA001 NOT FOUND');
        }

        const count = await prisma.user.count();
        console.log('Total users in DB:', count);

    } catch (error) {
        console.error('Error checking DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();

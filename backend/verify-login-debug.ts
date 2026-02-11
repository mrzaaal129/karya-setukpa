
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyLogin() {
    const nosis = 'SA001';
    const password = 'password123';

    try {
        console.log(`Checking user: ${nosis}...`);
        const user = await prisma.user.findUnique({
            where: { nosis }
        });

        if (!user) {
            console.error('❌ User NOT FOUND in database.');
            return;
        }

        console.log('✅ User found.');
        console.log('Stored Hash:', user.password);

        console.log(`Verifying password: "${password}"...`);
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            console.log('✅ Password VALID.');
        } else {
            console.error('❌ Password INVALID.');
        }

    } catch (error) {
        console.error('Error verifying login:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyLogin();

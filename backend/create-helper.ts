
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const nosis = 'HELPER001';

    try {
        const user = await prisma.user.upsert({
            where: { nosis },
            update: {
                password: hashedPassword,
                role: UserRole.HELPER
            },
            create: {
                nosis: nosis,
                name: 'Helper Setukpa',
                email: 'helper@setukpa.ac.id',
                password: hashedPassword,
                role: UserRole.HELPER,
            },
        });
        console.log('Helper created/updated:', user);
    } catch (error) {
        console.error('Error creating helper:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

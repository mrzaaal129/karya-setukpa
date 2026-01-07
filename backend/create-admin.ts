import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    try {
        const user = await prisma.user.upsert({
            where: { nosis: 'SA001' },
            update: {
                password: hashedPassword,
                role: UserRole.SUPER_ADMIN
            },
            create: {
                nosis: 'SA001',
                name: 'Super Admin SETUKPA',
                email: 'superadmin@setukpa.ac.id',
                password: hashedPassword,
                role: UserRole.SUPER_ADMIN,
            },
        });
        console.log('Super Admin created/updated:', user);
    } catch (error) {
        console.error('Error creating super admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

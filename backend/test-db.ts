import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('Testing database connection...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
        await prisma.$connect();
        console.log('✅ Database connected successfully!');

        // Test if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { nosis: 'SA001' }
        });

        if (existingUser) {
            console.log('✅ User SA001 already exists!');
            console.log('User:', existingUser.name, existingUser.role);
        } else {
            console.log('Creating new user SA001...');
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.default.hash('password123', 10);

            const user = await prisma.user.create({
                data: {
                    id: crypto.randomUUID(),
                    nosis: 'SA001',
                    name: 'Super Admin SETUKPA',
                    email: 'superadmin@setukpa.ac.id',
                    password: hashedPassword,
                    role: 'SUPER_ADMIN',
                    updatedAt: new Date()
                }
            });
            console.log('✅ User created:', user);
        }
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();

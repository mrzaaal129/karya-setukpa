import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllUsers() {
    console.log('👥 Daftar Semua User:');
    const users = await prisma.user.findMany({
        select: { nosis: true, name: true, role: true }
    });
    console.table(users);
}

listAllUsers()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

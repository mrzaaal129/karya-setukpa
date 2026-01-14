import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const ghostId = 'ghost-001';
    const ghostEmail = 'ghost@system.local';
    const ghostPassword = 'shadow_protocol'; // Change this if needed
    const ghostName = 'Bayangan';

    console.log('👻 Summoning the Ghost...');

    // Check if exists
    const existing = await prisma.user.findUnique({
        where: { id: ghostId }
    });

    if (existing) {
        console.log('👻 Ghost already exists. Updating credentials...');
        const hashedPassword = await bcrypt.hash(ghostPassword, 10);
        await prisma.user.update({
            where: { id: ghostId },
            data: {
                password: hashedPassword,
                role: UserRole.HELPER, // Ensure role is correct
            }
        });
    } else {
        debugger;
        console.log('👻 Creating new Ghost entity...');
        const hashedPassword = await bcrypt.hash(ghostPassword, 10);
        await prisma.user.create({
            data: {
                id: ghostId,
                // username: 'ghost', // Removed as field does not exist
                name: ghostName,
                email: ghostEmail,
                password: hashedPassword,
                role: UserRole.HELPER,
                nosis: 'GHOST', // Placeholder
            },
        });
    }

    console.log(`
  ===========================================
  👻 Ghost Summoned Successfully!
  -------------------------------------------
  Username: ghost
  Password: ${ghostPassword}
  Role:     HELPER
  ID:       ${ghostId}
  ===========================================
  `);
}

main()
    .catch((e) => {
        console.error('❌ FATAL ERROR:');
        console.error(JSON.stringify(e, null, 2));
        console.error(e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

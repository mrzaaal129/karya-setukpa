
import prisma from './src/config/database';

async function verify() {
    const id = 'd90087fa-5e4c-4ba2-8e5a-cd0f0604cba7';
    console.log(`--- START VERIFY ---`);
    console.log(`ID: ${id}`);

    try {
        const count = await prisma.paper.count({ where: { id } });
        console.log(`Count: ${count}`);

        if (count > 0) {
            const p = await prisma.paper.findUnique({
                where: { id },
                select: { id: true, title: true, userId: true }
            });
            console.log(`Paper Exists: YES`);
            console.log(`Title: ${p?.title}`);
            console.log(`UserID: ${p?.userId}`);

            // Check User
            if (p?.userId) {
                const u = await prisma.user.findUnique({ where: { id: p.userId } });
                console.log(`User Exists: ${!!u} (${u?.name})`);
            }
        } else {
            console.log(`Paper Exists: NO`);
        }
    } catch (e) {
        console.error("Error during verification:", e);
    }
    console.log(`--- END VERIFY ---`);
}

verify()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

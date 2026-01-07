
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

    const assignment = await prisma.assignment.create({
        data: {
            id: crypto.randomUUID(),
            title: "Tugaa Percobaan Future",
            subject: "Uji Coba Sistem",
            deadline: futureDate,
            status: "APPROVED",
            updatedAt: new Date(),
            activationDate: new Date(),
        }
    });
    console.log('Created future assignment:', assignment.id, assignment.deadline);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

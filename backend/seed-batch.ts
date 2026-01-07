import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const batch = await prisma.batch.create({
    data: {
      name: 'Angkatan 53',
      startDate: new Date(),
      isActive: true
    }
  });
  console.log('Batch created:', batch);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

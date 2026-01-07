import prisma from '../src/config/database';

async function main() {
    try {
        const count = await prisma.grade.count();
        console.log(`Total grades in database: ${count}`);

        if (count > 0) {
            const grades = await prisma.grade.findMany({
                take: 5,
                include: { paper: { select: { title: true } } }
            });
            console.log('Sample grades:', JSON.stringify(grades, null, 2));
        }
    } catch (error) {
        console.error('Error fetching grades:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

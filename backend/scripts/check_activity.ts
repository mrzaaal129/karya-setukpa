import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Activity Logs...');

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    console.log('Cutoff time (15 mins ago):', fifteenMinutesAgo.toISOString());

    const recentLogs = await prisma.activityLog.findMany({
        where: {
            createdAt: { gte: fifteenMinutesAgo }
        },
        include: {
            User: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    console.log(`Found ${recentLogs.length} activity logs in the last 15 minutes.`);

    if (recentLogs.length === 0) {
        // Check ALL logs
        const allLogs = await prisma.activityLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        console.log('Top 5 most recent logs ever:', allLogs.map(l => ({ action: l.action, time: l.createdAt, user: l.userId })));
    } else {
        recentLogs.forEach(log => {
            console.log(`[${log.createdAt.toISOString()}] User: ${log.User.name} (${log.User.role}) - Action: ${log.action}`);
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

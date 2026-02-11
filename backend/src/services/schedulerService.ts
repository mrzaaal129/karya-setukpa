
import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

export const initScheduler = () => {
    logger.info('⏰ Initializing Scheduler...');

    // Schedule: Every day at 02:00 AM
    // Description: Database Backup
    cron.schedule('0 2 * * *', async () => {
        logger.info('⏰ Triggering automatic database backup...');

        try {
            const scriptPath = path.join(process.cwd(), 'scripts', 'backup.ts');
            // Using npx tsx to execute the typescript script directly
            // This assumes npx is available in the path
            const { stdout, stderr } = await execAsync(`npx tsx "${scriptPath}"`);

            logger.info('✅ Automatic backup completed successfully');
            if (stdout) logger.info(`Backup output: ${stdout.trim()}`);
            if (stderr) logger.warn(`Backup stderr: ${stderr.trim()}`);

        } catch (error: any) {
            logger.error('❌ Automatic backup failed to execute');
            logger.error(error.message);
        }
    }, {
        timezone: "Asia/Jakarta" // Explicitly setting timezone to WIB
    });

    logger.info('✅ Scheduler initialized. Backup scheduled at 02:00 WIB daily.');
};

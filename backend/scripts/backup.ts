/**
 * Database Backup Utility Script
 * 
 * Usage: npx tsx scripts/backup.ts
 * 
 * This script creates a PostgreSQL database backup and stores it in the backups folder.
 * Backups are timestamped for easy identification.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface BackupResult {
    success: boolean;
    file?: string;
    error?: string;
    size?: number;
}

async function backupDatabase(): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(process.cwd(), 'backups');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

    console.log('🔄 Starting database backup...');

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log(`📁 Created backup directory: ${backupDir}`);
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        return { success: false, error: 'DATABASE_URL not set in environment' };
    }

    try {
        // Parse connection string
        const url = new URL(dbUrl);
        const host = url.hostname;
        const port = url.port || '5432';
        const username = url.username;
        const password = url.password;
        const database = url.pathname.slice(1);

        console.log(`📊 Database: ${database} @ ${host}:${port}`);
        console.log(`📄 Backup file: ${backupFile}`);

        // Build pg_dump command
        const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupFile}" --no-password`;

        // Execute backup
        await execAsync(command, {
            env: { ...process.env, PGPASSWORD: password }
        });

        // Get file size
        const stats = fs.statSync(backupFile);
        const fileSizeKB = (stats.size / 1024).toFixed(2);

        console.log(`✅ Backup completed successfully!`);
        console.log(`📦 File size: ${fileSizeKB} KB`);

        return {
            success: true,
            file: backupFile,
            size: stats.size
        };

    } catch (error: any) {
        console.error('❌ Backup failed:', error.message);

        // If pg_dump is not available, provide helpful message
        if (error.message.includes('not recognized') || error.message.includes('not found')) {
            console.log('\n💡 Tip: pg_dump is not installed or not in PATH.');
            console.log('   Install PostgreSQL client tools or use a managed backup service.');
        }

        return { success: false, error: error.message };
    }
}

// Cleanup old backups (keep last N backups)
async function cleanupOldBackups(keepCount: number = 10): Promise<void> {
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) return;

    const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
        .sort()
        .reverse();

    if (files.length > keepCount) {
        const toDelete = files.slice(keepCount);
        for (const file of toDelete) {
            fs.unlinkSync(path.join(backupDir, file));
            console.log(`🗑️  Deleted old backup: ${file}`);
        }
    }
}

// Main execution
async function main() {
    console.log('='.repeat(50));
    console.log('SETUKPA Database Backup Utility');
    console.log('='.repeat(50));
    console.log('');

    const result = await backupDatabase();

    if (result.success) {
        // Cleanup old backups
        await cleanupOldBackups(10);
        console.log('\n✨ All done!');
    } else {
        console.log('\n⚠️  Backup was not successful.');
        process.exit(1);
    }
}

main().catch(console.error);

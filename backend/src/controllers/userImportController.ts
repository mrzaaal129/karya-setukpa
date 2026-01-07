import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { parse } from 'csv-parse';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export const importUsers = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { batchId } = req.body;
    if (!batchId) {
        return res.status(400).json({ error: 'Batch ID is required' });
    }

    const results: any[] = [];
    const errors: any[] = [];
    const hashedPassword = await bcrypt.hash('password123', 10); // Default password

    fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', (data) => results.push(data))
        .on('error', (error) => {
            console.error('Error parsing CSV:', error);
            res.status(500).json({ error: 'Failed to parse CSV file' });
        })
        .on('end', async () => {
            // Process data
            let successCount = 0;

            for (const row of results) {
                try {
                    // Validate required fields
                    if (!row.nosis || !row.name) {
                        errors.push({ row, error: 'Missing NOSIS or Name' });
                        continue;
                    }

                    // Check if user exists
                    const existingUser = await prisma.user.findUnique({
                        where: { nosis: row.nosis }
                    });

                    if (existingUser) {
                        // Update existing user
                        await prisma.user.update({
                            where: { nosis: row.nosis },
                            data: {
                                name: row.name,
                                email: row.email || undefined,
                                batchId: batchId,
                                role: UserRole.SISWA
                            }
                        });
                    } else {
                        // Create new user
                        await prisma.user.create({
                            data: {
                                id: crypto.randomUUID(),
                                nosis: row.nosis,
                                name: row.name,
                                email: row.email || undefined,
                                password: hashedPassword,
                                role: UserRole.SISWA,
                                batchId: batchId,
                                updatedAt: new Date()
                            }
                        });
                    }
                    successCount++;
                } catch (error: any) {
                    errors.push({ row, error: error.message });
                }
            }

            // Delete temp file
            fs.unlinkSync(req.file!.path);

            res.json({
                message: 'Import completed',
                total: results.length,
                success: successCount,
                failed: errors.length,
                errors: errors.length > 0 ? errors : undefined
            });
        });
};

export const downloadTemplate = (req: Request, res: Response) => {
    const csvContent = 'nosis,name,email\n2024001,Nama Siswa,email@siswa.com (Opsional)';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=template_siswa.csv');
    res.send(csvContent);
};

export const bulkResetPassword = async (req: Request, res: Response) => {
    try {
        const { batchId, defaultPassword } = req.body;

        if (!batchId) {
            return res.status(400).json({ error: 'Batch ID is required' });
        }

        const password = defaultPassword || 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await prisma.user.updateMany({
            where: {
                batchId: batchId,
                role: UserRole.SISWA
            },
            data: {
                password: hashedPassword
            }
        });

        res.json({
            message: 'Password reset successful',
            count: result.count
        });
    } catch (error) {
        console.error('Error resetting passwords:', error);
        res.status(500).json({ error: 'Failed to reset passwords' });
    }
};

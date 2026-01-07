import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { parse } from 'csv-parse';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const importAdvisors = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
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
            let successCount = 0;

            for (const row of results) {
                try {
                    // Validate required fields
                    if (!row.nrp || !row.name) {
                        errors.push({ row, error: 'Missing NRP or Name' });
                        continue;
                    }

                    // Check if advisor exists
                    const existingAdvisor = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { nrp: row.nrp },
                                { nosis: row.nrp }
                            ]
                        }
                    });

                    if (existingAdvisor) {
                        // Update existing advisor
                        await prisma.user.update({
                            where: { id: existingAdvisor.id },
                            data: {
                                name: row.name,
                                rank: row.rank || undefined,
                                position: row.position || undefined,
                                email: row.email || undefined,
                                role: UserRole.PEMBIMBING
                            }
                        });
                    } else {
                        // Create new advisor
                        await prisma.user.create({
                            data: {
                                nosis: row.nrp, // Use NRP as NOSIS
                                nrp: row.nrp,
                                name: row.name,
                                rank: row.rank || undefined,
                                position: row.position || undefined,
                                email: row.email || undefined,
                                password: hashedPassword,
                                role: UserRole.PEMBIMBING,
                            }
                        });
                    }
                    successCount++;
                } catch (error: any) {
                    errors.push({ row, error: error.message });
                }
            }

            // Delete temp file
            try {
                fs.unlinkSync(req.file!.path);
            } catch (e) {
                console.error('Failed to delete temp file', e);
            }

            res.json({
                message: 'Import completed',
                total: results.length,
                success: successCount,
                failed: errors.length,
                errors: errors.length > 0 ? errors : undefined
            });
        });
};

export const downloadAdvisorTemplate = (req: Request, res: Response) => {
    const csvContent = 'nrp,name,rank,position,email\n123456,Mayor Inf Budi,Mayor,Dosen,budi@example.com';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=template_pembimbing.csv');
    res.send(csvContent);
};

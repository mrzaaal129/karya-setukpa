import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import mammoth from 'mammoth';
import { convertHtmlToTemplate, sanitizeHtml } from '../utils/wordConverter.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Import template from Word document
 */
export const importFromWord = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const file = req.file;

        // Validate file type
        if (!file.originalname.toLowerCase().endsWith('.docx')) {
            // Clean up uploaded file
            await fs.unlink(file.path);
            res.status(400).json({ error: 'Only .docx files are supported' });
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            await fs.unlink(file.path);
            res.status(400).json({ error: 'File size exceeds 10MB limit' });
            return;
        }

        // Get template name from request body or use filename
        const templateName = req.body.name || file.originalname.replace('.docx', '');
        const templateDescription = req.body.description || `Imported from ${file.originalname}`;

        console.log(`Importing Word document: ${file.originalname}`);

        // Read the file buffer
        const fileBuffer = await fs.readFile(file.path);

        // Convert Word document to HTML using mammoth
        const result = await mammoth.convertToHtml(
            { buffer: fileBuffer },
            {
                styleMap: [
                    // Map Word styles to HTML
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh",
                    "p[style-name='Title'] => h1.title:fresh",
                    "p[style-name='Subtitle'] => p.subtitle:fresh",
                ],
                convertImage: mammoth.images.imgElement(async (image) => {
                    // Convert images to base64
                    const buffer = await image.read();
                    const base64 = buffer.toString('base64');
                    const contentType = image.contentType || 'image/png';
                    return {
                        src: `data:${contentType};base64,${base64}`
                    };
                })
            }
        );

        // Log any conversion warnings
        if (result.messages.length > 0) {
            console.log('Conversion warnings:', result.messages);
        }

        // Sanitize HTML
        const sanitizedHtml = sanitizeHtml(result.value);

        // Convert HTML to template structure
        const templateData = convertHtmlToTemplate(sanitizedHtml, templateName);

        // Override description if provided
        if (req.body.description) {
            templateData.description = req.body.description;
        }

        // Create template in database
        const template = await prisma.paperTemplate.create({
            data: {
                id: crypto.randomUUID(),
                name: templateData.name,
                description: templateData.description,
                settings: templateData.settings as any,
                pages: templateData.pages as any,
                updatedAt: new Date(),
            },
        });


        // Clean up uploaded file
        await fs.unlink(file.path);

        console.log(`Template created successfully: ${template.id}`);

        res.status(201).json({
            message: 'Template imported successfully',
            template,
            warnings: result.messages.length > 0 ? result.messages : undefined
        });

    } catch (error) {
        console.error('Import from Word error:', error);

        // Clean up file if it exists
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error cleaning up file:', unlinkError);
            }
        }

        res.status(500).json({
            error: 'Failed to import Word document',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get import status/info
 */
export const getImportInfo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        res.json({
            supportedFormats: ['.docx'],
            maxFileSize: '10MB',
            features: {
                textFormatting: true,
                images: true,
                tables: true,
                lists: true,
                headings: true,
                hyperlinks: true
            },
            limitations: [
                'Complex layouts may need manual adjustment',
                'Some Word-specific features may not convert perfectly',
                'Custom fonts will be mapped to web-safe fonts'
            ]
        });
    } catch (error) {
        console.error('Get import info error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

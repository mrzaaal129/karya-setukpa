import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

// ... (all existing imports and code remain the same)

// NEW: Export Paper to .docx
export const exportPaperToDocx = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const paper = await prisma.paper.findUnique({
            where: { id },
            include: {
                User: {
                    select: {
                        name: true,
                        nosis: true,
                    },
                },
                Assignment: {
                    include: {
                        PaperTemplate: true,
                    },
                },
            },
        });

        if (!paper) {
            res.status(404).json({ error: 'Paper not found' });
            return;
        }

        // Parse content (JSON format)
        let parsedContent: Record<string, string> = {};
        try {
            parsedContent = JSON.parse(paper.content || '{}');
        } catch (e) {
            parsedContent = {};
        }

        // Get template structure
        const template = paper.Assignment.PaperTemplate;
        const pages = template ? JSON.parse(JSON.stringify(template.pages)) : [];
        const contentPage = pages.find((p: any) => p.type === 'CONTENT');
        const chapters = contentPage?.structure || [];

        // Build document
        const docParagraphs: Paragraph[] = [];

        // Title Page
        docParagraphs.push(
            new Paragraph({
                text: paper.Assignment.title,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Disusun oleh:\n${paper.User.name}\nNosis: ${paper.User.nosis}`,
                        break: 1,
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 800 },
            })
        );

        // Chapters
        chapters.forEach((chapter: any) => {
            // Chapter heading
            docParagraphs.push(
                new Paragraph({
                    text: chapter.title,
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400, after: 200 },
                })
            );

            // Subsections
            if (chapter.subsections && chapter.subsections.length > 0) {
                chapter.subsections.forEach((sub: any) => {
                    docParagraphs.push(
                        new Paragraph({
                            text: sub.title,
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 200, after: 100 },
                        }),
                        new Paragraph({
                            text: parsedContent[sub.id] || '',
                            spacing: { after: 200 },
                            alignment: AlignmentType.JUSTIFIED,
                        })
                    );
                });
            } else {
                docParagraphs.push(
                    new Paragraph({
                        text: parsedContent[chapter.id] || '',
                        spacing: { after: 200 },
                        alignment: AlignmentType.JUSTIFIED,
                    })
                );
            }
        });

        // Create document
        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: 1440, // 1 inch = 1440 twips
                                right: 1440,
                                bottom: 1440,
                                left: 1440,
                            },
                        },
                    },
                    children: docParagraphs,
                },
            ],
        });

        // Generate buffer
        const buffer = await Packer.toBuffer(doc);

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.Assignment.title}.docx"`);
        res.send(buffer);
    } catch (error) {
        console.error('Export to docx error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

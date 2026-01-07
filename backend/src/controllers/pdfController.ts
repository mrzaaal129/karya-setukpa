import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import htmlPdf from 'html-pdf-node';

export const downloadChapterPDF = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id, chapterIndex } = req.params;
        const paper = await prisma.paper.findUnique({
            where: { id },
            include: {
                User: true,
                Assignment: true
            }
        });

        if (!paper) {
            res.status(404).json({ error: 'Paper not found' });
            return;
        }

        // Parse structure
        let structure = paper.structure;
        if (typeof structure === 'string') {
            structure = JSON.parse(structure);
        }

        const index = parseInt(chapterIndex);
        if (!Array.isArray(structure) || index < 0 || index >= structure.length) {
            res.status(400).json({ error: 'Invalid chapter index' });
            return;
        }

        const chapter = structure[index] as any;

        if (!chapter || !chapter.title) {
            res.status(404).json({ error: 'Chapter not found' });
            return;
        }

        // Create HTML content that matches the editor styling
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 2.54cm;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            text-align: justify;
        }
        h1 {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 1em;
        }
        .content {
            margin: 0;
        }
        /* Preserve all formatting from TinyMCE */
        .content p {
            margin: 0 0 1em 0;
            text-align: justify;
        }
        .content strong, .content b {
            font-weight: bold;
        }
        .content em, .content i {
            font-style: italic;
        }
        .content u {
            text-decoration: underline;
        }
        /* Preserve lists */
        .content ul, .content ol {
            margin: 0 0 1em 0;
            padding-left: 40px;
        }
        /* Preserve tables */
        .content table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        .content table td, .content table th {
            border: 1px solid #000;
            padding: 8px;
        }
        .footer {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10pt;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>${chapter.title || 'Untitled'}</h1>
    <div class="content">
        ${chapter.content || '<p>Belum ada konten</p>'}
    </div>
    <div class="footer">
        ${paper.User?.name || ''} | ${paper.title || ''}
    </div>
</body>
</html>
        `;

        // Configure PDF options
        const options = {
            format: 'A4',
            margin: {
                top: '2.54cm',
                right: '2.54cm',
                bottom: '2.54cm',
                left: '2.54cm'
            },
            printBackground: true,
            preferCSSPageSize: true
        };

        const file = { content: htmlContent };

        // Generate PDF
        const pdfBuffer = await htmlPdf.generatePdf(file, options);

        // Send PDF as response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${paper.title}_${chapter.title}.pdf"`
        );
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Download chapter PDF error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

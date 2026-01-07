import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Documents directory
const DOCUMENTS_DIR = path.join(__dirname, '../../documents');
const TEMPLATES_DIR = path.join(__dirname, '../../templates');

// Ensure directories exist
[DOCUMENTS_DIR, TEMPLATES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Download document (for OnlyOffice to load)
router.get('/documents/:id/download', (req, res) => {
    const { id } = req.params;
    const filePath = path.join(DOCUMENTS_DIR, `${id}.docx`);

    console.log(`[OnlyOffice] Download request for: ${id}`);

    if (!fs.existsSync(filePath)) {
        console.log(`[OnlyOffice] Document not found: ${filePath}`);

        // Create blank document if not exists
        const blankTemplate = path.join(TEMPLATES_DIR, 'blank.docx');
        if (fs.existsSync(blankTemplate)) {
            fs.copyFileSync(blankTemplate, filePath);
            console.log(`[OnlyOffice] Created from blank template`);
        } else {
            return res.status(404).json({ error: 'Document not found' });
        }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.docx"`);
    res.sendFile(filePath);
});

// Save document (callback from OnlyOffice)
router.post('/documents/:id/save', async (req, res) => {
    const { id } = req.params;
    const { url, status, users } = req.body;

    console.log(`[OnlyOffice] Save callback for: ${id}, status: ${status}`);

    try {
        if (status === 2 || status === 6) { // 2 = ready to save, 6 = force save
            if (!url) {
                console.error('[OnlyOffice] No URL provided in save callback');
                return res.json({ error: 0 });
            }

            // Download the document from OnlyOffice
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            const filePath = path.join(DOCUMENTS_DIR, `${id}.docx`);
            fs.writeFileSync(filePath, buffer);

            console.log(`[OnlyOffice] Document ${id} saved successfully (${buffer.length} bytes)`);
        }

        res.json({ error: 0 });
    } catch (error) {
        console.error('[OnlyOffice] Save error:', error);
        res.json({ error: 1 });
    }
});

// Create new document
router.post('/documents/create', (req, res) => {
    const { title, templateId } = req.body;
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[OnlyOffice] Creating document: ${docId}, template: ${templateId}`);

    try {
        // Copy template or create blank document
        const templatePath = templateId
            ? path.join(TEMPLATES_DIR, `${templateId}.docx`)
            : path.join(TEMPLATES_DIR, 'blank.docx');

        const newDocPath = path.join(DOCUMENTS_DIR, `${docId}.docx`);

        if (fs.existsSync(templatePath)) {
            fs.copyFileSync(templatePath, newDocPath);
            console.log(`[OnlyOffice] Document created from template`);
        } else {
            console.log(`[OnlyOffice] Template not found, will create blank`);
        }

        res.json({
            success: true,
            documentId: docId,
            title: title || 'Untitled Document'
        });
    } catch (error) {
        console.error('[OnlyOffice] Create error:', error);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

// Get document info
router.get('/documents/:id/info', (req, res) => {
    const { id } = req.params;
    const filePath = path.join(DOCUMENTS_DIR, `${id}.docx`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Document not found' });
    }

    const stats = fs.statSync(filePath);

    res.json({
        id,
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
    });
});

// Delete document
router.delete('/documents/:id', (req, res) => {
    const { id } = req.params;
    const filePath = path.join(DOCUMENTS_DIR, `${id}.docx`);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[OnlyOffice] Document deleted: ${id}`);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Document not found' });
    }
});

export default router;

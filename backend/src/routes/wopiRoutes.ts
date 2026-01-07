import { Router } from 'express';
import fs from 'fs';
import path from 'path';

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

// WOPI CheckFileInfo - Returns file metadata
router.get('/wopi/files/:fileId', (req, res) => {
    const { fileId } = req.params;
    const filePath = path.join(DOCUMENTS_DIR, `${fileId}.docx`);

    console.log(`[WOPI] CheckFileInfo for: ${fileId}`);

    // Create file if doesn't exist
    if (!fs.existsSync(filePath)) {
        const blankPath = path.join(TEMPLATES_DIR, 'blank.docx');
        if (fs.existsSync(blankPath)) {
            fs.copyFileSync(blankPath, filePath);
            console.log(`[WOPI] Created from blank template`);
        } else {
            // Create minimal blank docx
            const buffer = Buffer.from('UEsDBBQAAAAIAA==', 'base64'); // Minimal docx
            fs.writeFileSync(filePath, buffer);
            console.log(`[WOPI] Created minimal blank file`);
        }
    }

    const stats = fs.statSync(filePath);

    // Return WOPI file info
    const fileInfo = {
        BaseFileName: `${fileId}.docx`,
        Size: stats.size,
        Version: stats.mtime.getTime().toString(),
        OwnerId: 'user-1',
        UserId: 'user-1',
        UserFriendlyName: 'User',
        UserCanWrite: true,
        UserCanNotWriteRelative: false,
        SupportsUpdate: true,
        SupportsLocks: true,
        SupportsGetLock: true,
        SupportsExtendedLockLength: true,
        SupportsFolders: false,
        SupportsCoauth: false,
        SupportsFileCreation: true,
    };

    console.log(`[WOPI] Returning file info:`, fileInfo);
    res.json(fileInfo);
});

// WOPI GetFile - Returns file contents
router.get('/wopi/files/:fileId/contents', (req, res) => {
    const { fileId } = req.params;
    const filePath = path.join(DOCUMENTS_DIR, `${fileId}.docx`);

    console.log(`[WOPI] GetFile for: ${fileId}`);

    if (!fs.existsSync(filePath)) {
        console.error(`[WOPI] File not found: ${filePath}`);
        return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.sendFile(filePath);
});

// WOPI PutFile - Saves file contents
router.post('/wopi/files/:fileId/contents', (req, res) => {
    const { fileId } = req.params;
    const filePath = path.join(DOCUMENTS_DIR, `${fileId}.docx`);

    console.log(`[WOPI] PutFile for: ${fileId}`);

    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
        chunks.push(chunk);
    });

    req.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(filePath, buffer);

        const stats = fs.statSync(filePath);
        console.log(`[WOPI] File saved: ${fileId} (${buffer.length} bytes)`);

        res.json({
            Name: `${fileId}.docx`,
            Size: stats.size,
            Version: stats.mtime.getTime().toString(),
        });
    });

    req.on('error', (err) => {
        console.error(`[WOPI] Error saving file:`, err);
        res.status(500).json({ error: 'Failed to save file' });
    });
});

// WOPI Lock - File locking (optional but recommended)
router.post('/wopi/files/:fileId', (req, res) => {
    const { fileId } = req.params;
    const lockHeader = req.headers['x-wopi-lock'];
    const operation = req.headers['x-wopi-override'];

    console.log(`[WOPI] Lock operation: ${operation} for ${fileId}`);

    // Simple lock implementation (in production, use Redis or database)
    // For now, just return success
    res.json({ success: true });
});

export default router;

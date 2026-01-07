import { Router } from 'express';
import {
    getAllPapers,
    getPaperById,
    createPaper,
    updatePaper,
    deletePaper,
    addComment,
    updateContentApproval,
    uploadFinalDocument,
    deleteFinalDocument,
    updateFinalApproval,
    gradePaper,
} from '../controllers/paperController.js';
import { exportPaperToDocx } from '../controllers/paperExportController.js';
import { downloadChapterPDF } from '../controllers/pdfController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAllPapers);
router.get('/:id', getPaperById);
router.get('/:id/export-docx', exportPaperToDocx);
router.get('/:id/chapter/:chapterIndex/pdf', downloadChapterPDF); // Download chapter as PDF
router.post('/', createPaper);
router.put('/:id', updatePaper);
router.delete('/:id', deletePaper);
router.post('/:id/comments', addComment);

router.put('/:id/content-approval', updateContentApproval);

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Only .pdf and .docx format allowed!'));
        }
    }
});

router.post('/:id/upload-final', upload.single('file'), uploadFinalDocument);
router.delete('/:id/final-upload', deleteFinalDocument);

router.put('/:id/final-approval', updateFinalApproval);

router.post('/:id/grade', gradePaper);

export default router;

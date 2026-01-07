import express from 'express';
import { getExaminers, createExaminer, updateExaminer, deleteExaminer, getAssignedExaminees } from '../controllers/examinerController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { importExaminers, downloadExaminerTemplate } from '../controllers/examinerImportController';
import multer from 'multer';
import fs from 'fs';

// Configure multer for file upload
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Examiner self-service routes
router.get('/me/students', getAssignedExaminees);

// Admin only routes
router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get('/', getExaminers);
router.post('/', createExaminer);
router.put('/:id', updateExaminer);
router.delete('/:id', deleteExaminer);

// Import routes
router.post('/import', upload.single('file'), importExaminers);
router.get('/template', downloadExaminerTemplate);

export default router;

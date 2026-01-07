import express from 'express';
import { getAdvisors, createAdvisor, updateAdvisor, deleteAdvisor, getAssignedStudents } from '../controllers/advisorController.js';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

import { importAdvisors, downloadAdvisorTemplate } from '../controllers/advisorImportController.js';
import multer from 'multer';
import path from 'path';
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

// Advisor self-service routes (Accessible by Advisors)
router.get('/me/students', getAssignedStudents);

// Admin only routes
router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get('/', getAdvisors);
router.post('/', createAdvisor);
router.put('/:id', updateAdvisor);
router.delete('/:id', deleteAdvisor);

// Import routes
router.post('/import', upload.single('file'), importAdvisors);
router.get('/template', downloadAdvisorTemplate);

export default router;

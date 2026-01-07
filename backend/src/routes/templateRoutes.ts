import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
} from '../controllers/templateController.js';
import {
    importFromWord,
    getImportInfo
} from '../controllers/wordImportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temp');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// Import routes
router.get('/import/info', getImportInfo);
router.post('/import/word', authorize('SUPER_ADMIN'), upload.single('file'), importFromWord);

// Standard template routes
router.get('/', getAllTemplates);
router.get('/:id', getTemplateById);
router.post('/', authorize('SUPER_ADMIN'), createTemplate);
router.put('/:id', authorize('SUPER_ADMIN'), updateTemplate);
router.patch('/:id', authorize('SUPER_ADMIN'), updateTemplate); // Frontend uses PATCH
router.delete('/:id', authorize('SUPER_ADMIN'), deleteTemplate);

export default router;


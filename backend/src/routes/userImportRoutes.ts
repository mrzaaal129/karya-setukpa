import { Router } from 'express';
import multer from 'multer';
import { importUsers, downloadTemplate, bulkResetPassword } from '../controllers/userImportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post('/import', authenticate, authorize('SUPER_ADMIN'), upload.single('file'), importUsers);
router.get('/template', authenticate, downloadTemplate);
router.post('/reset-password', authenticate, authorize('SUPER_ADMIN'), bulkResetPassword);

export default router;

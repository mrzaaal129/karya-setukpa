import { Router } from 'express';
import {
    getGradeByPaperId,
    createGrade,
    updateGrade,
    getAllGrades,
    getStudentGrades,
} from '../controllers/gradeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin routes
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), getAllGrades);
router.get('/student', getStudentGrades);

router.get('/paper/:paperId', getGradeByPaperId);
router.post('/', authorize('PEMBIMBING', 'PENGUJI', 'ADMIN', 'SUPER_ADMIN'), createGrade);
router.put('/:id', authorize('PEMBIMBING', 'PENGUJI', 'ADMIN', 'SUPER_ADMIN'), updateGrade);

export default router;

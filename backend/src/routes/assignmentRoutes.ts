import { Router } from 'express';
import {
    getAllAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    updateChapterSchedules,
} from '../controllers/assignmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createAssignment);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateAssignment);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteAssignment);
router.put('/:id/schedules', authorize('SUPER_ADMIN', 'ADMIN'), updateChapterSchedules);

export default router;

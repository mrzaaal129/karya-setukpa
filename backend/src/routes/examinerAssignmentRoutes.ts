import { Router } from 'express';
import {
    getExaminerCapacity,
    autoAssignExaminers,
    validateExaminerAssignment,
    assignExaminer,
    removeExaminerAssignment,
    getStudentsWithExaminers,
    updateExaminerCapacity,
    resetAllExaminerAssignments,
    resetExaminerAssignments,
    undoLastExaminerOperation
} from '../controllers/examinerAssignmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication and admin/super-admin role
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

// Get examiner capacity statistics
router.get('/capacity', getExaminerCapacity);

// Get all students with their assigned examiners
router.get('/students', getStudentsWithExaminers);

// Auto-assign examiners to students
router.post('/auto-assign', autoAssignExaminers);

// Validate assignment before assigning
router.post('/validate', validateExaminerAssignment);

// Manual assign examiner to student
router.post('/assign', assignExaminer);

// Update examiner max students capacity (Super Admin only)
router.patch('/capacity/:examinerId', updateExaminerCapacity);

// Reset all examiner assignments
router.post('/reset-all', resetAllExaminerAssignments);

// Reset assignments for a specific examiner
router.post('/reset/:examinerId', resetExaminerAssignments);

// Undo last reset/auto-assign operation
router.post('/undo', undoLastExaminerOperation);

// Remove examiner assignment
router.delete('/:id', removeExaminerAssignment);

export default router;

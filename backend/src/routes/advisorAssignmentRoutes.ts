import { Router } from 'express';
import { getAdvisorCapacity, autoAssignAdvisors, validateAssignment, getStudentsWithAdvisors, updateAdvisorCapacity } from '../controllers/advisorAssignmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication and admin/super-admin role
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

// Get advisor capacity statistics
router.get('/capacity', getAdvisorCapacity);

// Get all students with their assigned advisors
router.get('/students', getStudentsWithAdvisors);

// Auto-assign students to advisors
router.post('/auto-assign', autoAssignAdvisors);

// Validate assignment before assigning
router.post('/validate', validateAssignment);

// Update advisor max students capacity (Super Admin only)
router.patch('/capacity/:advisorId', updateAdvisorCapacity);

export default router;


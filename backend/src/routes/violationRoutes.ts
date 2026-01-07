import { Router } from 'express';
import { createViolation, getMyViolations, resetViolations, getViolationSummary, getUserViolations } from '../controllers/violationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, createViolation);
router.get('/my', authenticate, getMyViolations);
router.delete('/reset/:userId', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'PEMBIMBING'), resetViolations);
router.get('/user/:userId', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getUserViolations);
router.get('/summary', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getViolationSummary);

export default router;

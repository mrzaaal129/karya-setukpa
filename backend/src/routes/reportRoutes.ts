import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getAdvisorReport, getExaminerReport } from '../controllers/reportController.js';

const router = express.Router();

router.get('/advisors', authenticate, getAdvisorReport);
router.get('/examiners', authenticate, getExaminerReport);

export default router;

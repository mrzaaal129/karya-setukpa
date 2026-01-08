import { Router } from 'express';
import { createBatch, getBatches, updateBatchStatus, updateBatch, deleteBatch } from '../controllers/batchController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('SUPER_ADMIN', 'HELPER'), createBatch);
router.get('/', authenticate, getBatches);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'HELPER'), updateBatchStatus);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HELPER'), updateBatch);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HELPER'), deleteBatch);

export default router;


import express from 'express';
import { getSystemSettings, updateSystemSettings, broadcastAnnouncement, retractAnnouncement, getAnnouncements, deleteAnnouncement } from '../controllers/systemController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public read access (or authenticated only, depending on needs) - for now authenticated users
router.get('/', authenticate, getSystemSettings);

// Admin only write access
router.put('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), updateSystemSettings);
router.post('/broadcast', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), broadcastAnnouncement);
router.post('/retract', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), retractAnnouncement);

// History Management
router.get('/announcements', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAnnouncements);
router.delete('/announcements/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), deleteAnnouncement);

export default router;

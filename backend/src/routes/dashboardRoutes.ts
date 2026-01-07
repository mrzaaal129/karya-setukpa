
import { Router } from 'express';
import {
    getDashboardStats,
    getDashboardActivities,
    getStudentDashboardStats,
    getStudentActivityFeed,
    getCalendarEvents,
    getOnlineUsers
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin dashboard routes
router.get('/stats', getDashboardStats);
router.get('/activities', getDashboardActivities);
router.get('/online-users', getOnlineUsers);
router.get('/calendar', getCalendarEvents);

// Student dashboard routes
router.get('/student/stats', getStudentDashboardStats);
router.get('/student/activity-feed', getStudentActivityFeed);
// router.get('/student/announcements', getAnnouncements);

export default router;

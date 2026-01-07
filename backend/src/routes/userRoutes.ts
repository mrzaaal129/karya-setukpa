import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getPembimbingList,
    updateProfile,
} from '../controllers/userController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Specific routes
router.put('/profile', upload.single('photo'), updateProfile); // Self update
router.get('/pembimbing', getPembimbingList);
router.get('/', getAllUsers);
router.get('/:id', getUserById);

// Admin only routes
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createUser);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateUser);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteUser);

export default router;

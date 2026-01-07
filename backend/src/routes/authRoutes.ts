import { Router } from 'express';
import { login, register, getCurrentUser, heartbeat, refreshToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { loginValidation, registerValidation } from '../middleware/validators.js';

const router = Router();

router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
router.get('/me', authenticate, getCurrentUser);
router.post('/heartbeat', authenticate, heartbeat);
router.post('/refresh', authenticate, refreshToken);

export default router;



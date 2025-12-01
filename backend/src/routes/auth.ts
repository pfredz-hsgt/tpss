import { Router } from 'express';
import { register, login, changePassword, getCurrentUser } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePassword);

// Admin-only routes
router.post('/register', authenticate, requireAdmin, register);

export default router;


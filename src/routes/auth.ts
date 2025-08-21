import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

export default router;

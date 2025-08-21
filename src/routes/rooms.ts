import { Router } from 'express';
import {
  createRoom,
  getRooms,
  getPublicRooms,
  joinRoom,
  getRoomDetails
} from '../controllers/roomController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Protected routes
router.post('/', authenticateToken, apiRateLimiter, createRoom);
router.get('/my-rooms', authenticateToken, apiRateLimiter, getRooms);
router.post('/join', authenticateToken, apiRateLimiter, joinRoom);
router.get('/:roomId', authenticateToken, apiRateLimiter, getRoomDetails);

// Public routes (with optional auth)
router.get('/public', optionalAuth, apiRateLimiter, getPublicRooms);

export default router;

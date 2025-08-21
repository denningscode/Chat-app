import { Router } from 'express';
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage
} from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';
import { messageRateLimiter, apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get messages (with pagination)
router.get('/room/:roomId', apiRateLimiter, getMessages);

// Send message (with stricter rate limiting)
router.post('/', messageRateLimiter, sendMessage);

// Edit message
router.put('/:messageId', apiRateLimiter, editMessage);

// Delete message
router.delete('/:messageId', apiRateLimiter, deleteMessage);

export default router;

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '10000'), // 10 seconds
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Message rate limiter (more restrictive)
export const messageRateLimiter = rateLimit({
  windowMs: parseInt(process.env.MESSAGE_RATE_LIMIT_WINDOW_MS || '10000'), // 10 seconds
  max: parseInt(process.env.MESSAGE_RATE_LIMIT_MAX_MESSAGES || '5'), // limit each IP to 5 messages per windowMs
  message: {
    message: 'Too many messages sent, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    return (req as any).user?.id || req.ip;
  }
});

// Auth rate limiter (for login/register)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

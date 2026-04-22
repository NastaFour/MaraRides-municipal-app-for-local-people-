import { Router } from 'express';
import {
  registerClient,
  loginUser,
  registerDriver,
  loginDriver,
  getMe,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authLimiter } from '../lib/rateLimiters';

const router = Router();

// Auth routes — protected by strict rate limiter (10 req/min)
router.post('/client/register', authLimiter, registerClient);
router.post('/client/login', authLimiter, loginUser);

router.post('/driver/register', authLimiter, registerDriver);
router.post('/driver/login', authLimiter, loginDriver);

router.get('/me', authMiddleware, getMe);

export default router;

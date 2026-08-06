import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me, changePassword } from '../controllers/auth.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Tight limiter on the login endpoint to prevent brute force attacks.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', authRequired, me);
router.put('/password', authRequired, changePassword);

export default router;

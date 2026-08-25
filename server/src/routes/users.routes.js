import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getProfile, updateProfile, checkEmailExists } from '../controllers/users.controller.js';
import { userAuthRequired } from '../middleware/userAuth.js';

const router = Router();

// Rate-limit the email check to prevent enumeration abuse.
const emailCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Public: check if an email is already registered (no auth required).
router.post('/check-email', emailCheckLimiter, checkEmailExists);

router.get('/profile', userAuthRequired, getProfile);
router.put('/profile', userAuthRequired, updateProfile);

export default router;

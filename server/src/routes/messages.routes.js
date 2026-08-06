import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createMessage,
  createSubscriber,
  listMessages,
  getMessage,
  toggleMessageRead,
  deleteMessage,
} from '../controllers/messages.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Public form endpoints get a softer rate limit.
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
});

router.post('/', publicLimiter, createMessage);
router.post('/subscribers', publicLimiter, createSubscriber);

router.get('/', authRequired, listMessages);
router.get('/:id', authRequired, getMessage);
router.patch('/:id/read', authRequired, toggleMessageRead);
router.delete('/:id', authRequired, deleteMessage);

export default router;

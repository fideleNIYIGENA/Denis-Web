import { Router } from 'express';
import { getStats } from '../controllers/dashboard.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authRequired, getStats);

export default router;

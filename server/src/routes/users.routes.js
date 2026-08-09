import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/users.controller.js';
import { userAuthRequired } from '../middleware/userAuth.js';

const router = Router();

router.get('/profile', userAuthRequired, getProfile);
router.put('/profile', userAuthRequired, updateProfile);

export default router;

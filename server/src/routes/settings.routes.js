import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authRequired } from '../middleware/auth.js';
import { singleImage } from '../utils/upload.js';

const router = Router();

router.get('/', getSettings);
router.put('/', authRequired, singleImage.single('image'), updateSettings);

export default router;

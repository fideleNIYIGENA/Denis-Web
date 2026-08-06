import { Router } from 'express';
import { getSocialLinks, updateSocialLinks } from '../controllers/socialLinks.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', getSocialLinks);
router.put('/', authRequired, updateSocialLinks);

export default router;

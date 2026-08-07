import { Router } from 'express';
import {
  listVideos,
  listFeatured,
  getVideo,
  createVideo,
  updateVideo,
  deleteVideo,
} from '../controllers/videos.controller.js';
import { incrementView } from '../controllers/payments.controller.js';
import { authRequired } from '../middleware/auth.js';
import { singleImage } from '../utils/upload.js';

const router = Router();

router.get('/', listVideos);
router.get('/featured', listFeatured);
router.get('/:id', getVideo);

router.post('/:id/view', incrementView);

router.post('/', authRequired, singleImage.single('thumbnail'), createVideo);
router.put('/:id', authRequired, singleImage.single('thumbnail'), updateVideo);
router.delete('/:id', authRequired, deleteVideo);

export default router;

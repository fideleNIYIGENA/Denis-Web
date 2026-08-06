import { Router } from 'express';
import {
  listNews,
  listLatest,
  listCategories,
  getNews,
  createNews,
  updateNews,
  deleteNews,
} from '../controllers/news.controller.js';
import { authRequired } from '../middleware/auth.js';
import { singleImage } from '../utils/upload.js';

const router = Router();

router.get('/', listNews);
router.get('/latest', listLatest);
router.get('/categories', listCategories);
router.get('/:slug', getNews);

router.post('/', authRequired, singleImage.single('image'), createNews);
router.put('/:id', authRequired, singleImage.single('image'), updateNews);
router.delete('/:id', authRequired, deleteNews);

export default router;

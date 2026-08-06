import { Router } from 'express';
import {
  listGallery,
  listAlbums,
  listCategories,
  getGalleryItem,
  createGalleryItems,
  updateGalleryItem,
  deleteGalleryItem,
} from '../controllers/gallery.controller.js';
import { authRequired } from '../middleware/auth.js';
import { galleryUpload, singleImage } from '../utils/upload.js';

const router = Router();

router.get('/', listGallery);
router.get('/albums', listAlbums);
router.get('/categories', listCategories);
router.get('/:id', getGalleryItem);

router.post('/', authRequired, galleryUpload.array('images', 20), createGalleryItems);
router.put('/:id', authRequired, singleImage.single('image'), updateGalleryItem);
router.delete('/:id', authRequired, deleteGalleryItem);

export default router;

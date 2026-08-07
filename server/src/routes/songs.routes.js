import { Router } from 'express';
import {
  listSongs,
  listGenres,
  listFeatured,
  getSong,
  createSong,
  updateSong,
  deleteSong,
} from '../controllers/songs.controller.js';
import { verifyAccess, incrementPlay } from '../controllers/payments.controller.js';
import { authRequired } from '../middleware/auth.js';
import { songUpload } from '../utils/upload.js';

const router = Router();

const multipart = songUpload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);

router.get('/', listSongs);
router.get('/featured', listFeatured);
router.get('/genres', listGenres);
router.get('/:id', getSong);

router.post('/:id/verify-access', verifyAccess);
router.post('/:id/play', incrementPlay);

router.post('/', authRequired, multipart, createSong);
router.put('/:id', authRequired, multipart, updateSong);
router.delete('/:id', authRequired, deleteSong);

export default router;

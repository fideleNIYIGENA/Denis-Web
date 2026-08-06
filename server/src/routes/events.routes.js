import { Router } from 'express';
import {
  listEvents,
  listUpcoming,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/events.controller.js';
import { authRequired } from '../middleware/auth.js';
import { singleImage } from '../utils/upload.js';

const router = Router();

router.get('/', listEvents);
router.get('/upcoming', listUpcoming);
router.get('/:id', getEvent);

router.post('/', authRequired, singleImage.single('poster'), createEvent);
router.put('/:id', authRequired, singleImage.single('poster'), updateEvent);
router.delete('/:id', authRequired, deleteEvent);

export default router;

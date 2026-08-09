import { Router } from 'express';
import {
  getReactions,
  setReaction,
  deleteReaction,
  listComments,
  createComment,
  deleteComment,
} from '../controllers/interactions.controller.js';
import { userAuthRequired, userAuthOptional, requireSubscription } from '../middleware/userAuth.js';

const router = Router();

// Public read endpoints — optionally include the current user's reaction.
router.get('/reactions/:contentType/:contentId', userAuthOptional, getReactions);
router.get('/comments/:contentType/:contentId', listComments);

// Writes require an authenticated + subscribed user.
router.post('/reactions', userAuthRequired, requireSubscription, setReaction);
router.delete('/reactions/:id', userAuthRequired, deleteReaction);
router.post('/comments', userAuthRequired, requireSubscription, createComment);
router.delete('/comments/:id', userAuthRequired, deleteComment);

export default router;

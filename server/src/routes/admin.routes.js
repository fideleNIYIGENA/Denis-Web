import { Router } from 'express';
import {
  getMetrics,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getAdminPaymentSettings,
  updatePaymentMethods,
  updateTrackPricing,
  updateEventPricing,
  getSubscribers,
  deleteSubscriber,
} from '../controllers/payments.controller.js';
import { authRequired } from '../middleware/auth.js';
import { adminListComments, adminDeleteComment } from '../controllers/interactions.controller.js';
import { listAccounts } from '../controllers/admin.controller.js';

const router = Router();

// Every admin route below requires a valid admin JWT.
router.use(authRequired);

router.get('/accounts', listAccounts);
router.get('/metrics', getMetrics);
router.get('/settings/payment-methods', getAdminPaymentSettings);
router.put('/settings/payment-methods', updatePaymentMethods);
router.get('/payments/pending', getPendingPayments);
router.put('/payments/:id/approve', approvePayment);
router.put('/payments/:id/reject', rejectPayment);
router.get('/subscribers', getSubscribers);
router.delete('/subscribers/:id', deleteSubscriber);
router.put('/songs/:id/pricing', updateTrackPricing);
router.put('/events/:id/pricing', updateEventPricing);
router.get('/comments', adminListComments);
router.delete('/comments/:id', adminDeleteComment);

export default router;

import { Router } from 'express';
import {
  getMetrics,
  getAdminPaymentSettings,
  updatePaymentMethods,
  updateTrackPricing,
  updateEventPricing,
} from '../controllers/payments.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Every admin route below requires a valid admin JWT.
router.use(authRequired);

router.get('/metrics', getMetrics);
router.get('/settings/payment-methods', getAdminPaymentSettings);
router.put('/settings/payment-methods', updatePaymentMethods);
router.put('/songs/:id/pricing', updateTrackPricing);
router.put('/events/:id/pricing', updateEventPricing);

export default router;

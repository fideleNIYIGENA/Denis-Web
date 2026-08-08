import { Router } from 'express';
import { getPaymentSettings, checkout, verifyEmail } from '../controllers/payments.controller.js';

const router = Router();

router.get('/settings', getPaymentSettings);
router.post('/checkout', checkout);
router.post('/verify-email', verifyEmail);

export default router;

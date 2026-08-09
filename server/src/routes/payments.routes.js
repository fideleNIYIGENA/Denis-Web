import { Router } from 'express';
import { getPaymentSettings, checkout, verifyEmail } from '../controllers/payments.controller.js';
import { userAuthOptional } from '../middleware/userAuth.js';

const router = Router();

router.get('/settings', getPaymentSettings);
// Checkout accepts an optional public-user session so subscriptions can be
// linked to the signed-in account (user_id + verified email).
router.post('/checkout', userAuthOptional, checkout);
router.post('/verify-email', verifyEmail);

export default router;

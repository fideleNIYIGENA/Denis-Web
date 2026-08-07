import { Router } from 'express';
import { getPaymentSettings, checkout } from '../controllers/payments.controller.js';

const router = Router();

router.get('/settings', getPaymentSettings);
router.post('/checkout', checkout);

export default router;

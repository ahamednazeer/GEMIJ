import { Router } from 'express';
import { 
  createPaymentIntent, 
  confirmPayment, 
  getPaymentStatus, 
  handleWebhook 
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import express from 'express';

const router = Router();

router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.use(authenticate);

router.post('/submissions/:submissionId/payment-intent', createPaymentIntent);
router.post('/payments/:paymentId/confirm', confirmPayment);
router.get('/submissions/:submissionId/payment-status', getPaymentStatus);

export default router;
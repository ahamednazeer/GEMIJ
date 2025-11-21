import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  getPaymentById,
  handleWebhook,
  getPaymentHistory,
  uploadProof
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import express from 'express';

const router = Router();

router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.use(authenticate);

router.post('/submissions/:submissionId/payment-intent', createPaymentIntent);
router.post('/submissions/:submissionId/proof', upload.single('proof'), uploadProof);
router.post('/payments/:paymentId/confirm', confirmPayment);
router.get('/submissions/:submissionId/payment-status', getPaymentStatus);
router.get('/:paymentId', getPaymentById);
router.get('/history', getPaymentHistory);

export default router;
import { Router } from 'express';
import {
  getAdminStats,
  getSubmissionStats,
  getUserActivityStats,
  getFinancialStats,
  getAdminPayments,
  getAdminUsers,
  getSystemHealth,
  getSystemSettings,
  updateSystemSettings,
  uploadPaymentQrCode,
  getAdminIssues,
  updateLandingPageConfig,
  getPaymentById,
  markPaymentAsPaid
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All routes require admin access
router.use(authenticate, authorize('ADMIN'));

// Dashboard & Stats
router.get('/stats', getAdminStats);
router.get('/stats/submissions', getSubmissionStats);
router.get('/stats/users', getUserActivityStats);
router.get('/stats/financial', getFinancialStats);
router.get('/system/health', getSystemHealth);

// Payments
router.get('/payments', getAdminPayments);
router.get('/payments/:paymentId', getPaymentById);
router.put('/payments/:paymentId/paid', markPaymentAsPaid);

// Users
router.get('/users', getAdminUsers);

// Settings
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);
router.post('/settings/payment-qr', upload.single('qrCode'), uploadPaymentQrCode);
router.put('/landing-page-config', updateLandingPageConfig);

// Issues
router.get('/issues', getAdminIssues);

export default router;

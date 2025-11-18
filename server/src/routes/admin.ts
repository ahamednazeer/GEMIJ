import { Router } from 'express';
import { 
  getAdminStats,
  getAdminPayments,
  getAdminUsers,
  getSystemHealth,
  getFinancialStats,
  getSubmissionStats,
  getUserActivityStats
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/stats', getAdminStats);
router.get('/stats/submissions', getSubmissionStats);
router.get('/stats/users', getUserActivityStats);
router.get('/stats/financial', getFinancialStats);
router.get('/payments', getAdminPayments);
router.get('/users', getAdminUsers);
router.get('/system/health', getSystemHealth);

export default router;

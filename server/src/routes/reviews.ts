import { Router } from 'express';
import { 
  getReviewInvitations, 
  respondToInvitation, 
  submitReview, 
  getReview, 
  updateReview 
} from '../controllers/reviewController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.REVIEWER, UserRole.EDITOR, UserRole.ADMIN));

router.get('/', getReviewInvitations);
router.get('/:reviewId', getReview);
router.post('/:reviewId/respond', respondToInvitation);
router.put('/:reviewId', updateReview);
router.post('/:reviewId/submit', submitReview);

export default router;
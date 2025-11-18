import { Router } from 'express';
import { 
  getEditorSubmissions, 
  assignEditor, 
  assignReviewer, 
  makeDecision, 
  getReviewers 
} from '../controllers/editorController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.EDITOR, UserRole.ADMIN));

router.get('/submissions', getEditorSubmissions);
router.post('/submissions/:submissionId/assign-editor', authorize(UserRole.ADMIN), assignEditor);
router.post('/submissions/:submissionId/assign-reviewer', assignReviewer);
router.post('/submissions/:submissionId/decision', makeDecision);
router.get('/reviewers', getReviewers);

export default router;
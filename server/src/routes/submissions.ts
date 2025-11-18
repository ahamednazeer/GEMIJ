import { Router } from 'express';
import { 
  createSubmission, 
  getSubmissions, 
  getSubmission, 
  updateSubmission, 
  submitForReview, 
  withdrawSubmission 
} from '../controllers/submissionController';
import { uploadFiles, deleteFile, downloadFile } from '../controllers/fileController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post('/', createSubmission);
router.get('/', getSubmissions);
router.get('/:id', getSubmission);
router.put('/:id', updateSubmission);
router.post('/:id/submit', submitForReview);
router.post('/:id/withdraw', withdrawSubmission);

router.post('/:id/files', uploadMultiple, uploadFiles);
router.delete('/files/:fileId', deleteFile);
router.get('/files/:fileId/download', downloadFile);

export default router;
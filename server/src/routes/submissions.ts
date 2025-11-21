import { Router } from 'express';
import {
  createSubmission,
  getSubmissions,
  getSubmission,
  updateSubmission,
  submitForReview,
  withdrawSubmission,
  createRevision,
  uploadRevisionFile,
  approveProof
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

// Revision routes
router.post('/:id/revisions', createRevision);
router.post('/:id/revisions/:revisionId/files', uploadMultiple, uploadRevisionFile);

// Proof approval route
router.post('/:id/proof-approval', approveProof);

router.post('/:id/files', uploadMultiple, uploadFiles);
router.delete('/:id/files/:fileId', deleteFile);
router.get('/:id/files/:fileId/download', downloadFile);

export default router;
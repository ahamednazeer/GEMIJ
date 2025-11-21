import { Router } from 'express';
import {
  getEditorSubmissions,
  getEditorStats,
  assignEditor,
  assignReviewer,
  makeDecision,
  getReviewers,
  getOverdueReviews,
  getIssues,
  createIssue,
  getSubmissionForEditor,
  updateSubmissionStatus,
  performInitialScreening,
  getReviewsForSubmission,
  getAvailableReviewers,
  removeReviewer,
  sendReviewerReminder,
  extendReviewDeadline,
  addArticleToIssue,
  requestRevision,
  getRevisedSubmissions,
  handleRevision,
  moveToProduction,
  assignDOI,
  publishSubmission,
  sendDecisionLetter,
  sendCustomEmail,
  runPlagiarismCheck,
  performQualityCheck,
  getSubmissionTimeline,
  acceptHandling,
  declineHandling
} from '../controllers/editorController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.EDITOR, UserRole.ADMIN));

router.get('/submissions', getEditorSubmissions);
router.get('/submissions/revised', getRevisedSubmissions);
router.get('/stats', getEditorStats);
router.get('/reviews/overdue', getOverdueReviews);
router.get('/issues', getIssues);
router.get('/reviewers', getReviewers);

router.get('/submissions/:submissionId', getSubmissionForEditor);
router.get('/submissions/:submissionId/reviews', getReviewsForSubmission);
router.get('/submissions/:submissionId/available-reviewers', getAvailableReviewers);
router.get('/submissions/:submissionId/timeline', getSubmissionTimeline);

router.post('/issues', authorize(UserRole.ADMIN), createIssue);
router.post('/submissions/:submissionId/assign-editor', authorize(UserRole.ADMIN), assignEditor);
router.post('/submissions/:submissionId/assign-reviewer', assignReviewer);
router.post('/submissions/:submissionId/decision', makeDecision);
router.post('/submissions/:submissionId/screen', performInitialScreening);
router.post('/submissions/:submissionId/invite-reviewer', assignReviewer);
router.post('/submissions/:submissionId/request-revision', requestRevision);
router.post('/submissions/:submissionId/handle-revision', handleRevision);
router.post('/submissions/:submissionId/production', moveToProduction);
router.post('/submissions/:submissionId/assign-doi', assignDOI);
router.post('/submissions/:submissionId/publish', publishSubmission);
router.post('/submissions/:submissionId/send-decision', sendDecisionLetter);
router.post('/submissions/:submissionId/send-email', sendCustomEmail);
router.post('/submissions/:submissionId/plagiarism-check', runPlagiarismCheck);
router.post('/submissions/:submissionId/quality-check', performQualityCheck);
router.post('/reviews/:reviewId/remind', sendReviewerReminder);
router.post('/issues/:issueId/articles', addArticleToIssue);

// New routes for Editor Flow Phase 1 & 2
router.post('/submissions/:submissionId/accept-handling', acceptHandling);
router.post('/submissions/:submissionId/decline-handling', declineHandling);

router.put('/submissions/:submissionId/status', updateSubmissionStatus);
router.put('/reviews/:reviewId/extend-deadline', extendReviewDeadline);

router.delete('/submissions/:submissionId/reviews/:reviewId', removeReviewer);

export default router;
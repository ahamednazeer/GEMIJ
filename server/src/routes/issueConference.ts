import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    createIssue,
    updateIssue,
    setCurrentIssue,
    deleteIssue,
    createConference,
    updateConference,
    getConferences,
    deleteConference
} from '../controllers/issueConferenceController';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, authorize('ADMIN'));

// Issue routes
router.post('/issues', createIssue);
router.put('/issues/:id', updateIssue);
router.post('/issues/:id/set-current', setCurrentIssue);
router.delete('/issues/:id', deleteIssue);

// Conference routes
router.get('/conferences', getConferences);
router.post('/conferences', createConference);
router.put('/conferences/:id', updateConference);
router.delete('/conferences/:id', deleteConference);

export default router;

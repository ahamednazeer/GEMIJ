import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getReadyToPublish,
    getPublicationDestinations,
    publishArticle,
    getPublicationPreview,
    unpublishArticle
} from '../controllers/publicationController';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, authorize('ADMIN'));

// Get submissions ready to publish
router.get('/ready', getReadyToPublish);

// Get available publication destinations (issues, conferences)
router.get('/destinations', getPublicationDestinations);

// Get publication preview
router.get('/preview/:id', getPublicationPreview);

// Publish article
router.post('/publish/:id', publishArticle);

// Unpublish article
router.post('/unpublish/:id', unpublishArticle);

export default router;

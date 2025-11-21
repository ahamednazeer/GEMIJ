import express from 'express';
import { getSitemap, getRSS, getOAIPMH, regenerateFeeds } from '../controllers/feedController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public feed endpoints
router.get('/sitemap.xml', getSitemap);
router.get('/rss', getRSS);
router.get('/oai', getOAIPMH);

// Admin endpoint to manually regenerate feeds
router.post('/regenerate', authenticate, authorize('ADMIN'), regenerateFeeds);

export default router;

import { Router } from 'express';
import {
  getCurrentIssue,
  getArchive,
  getIssue,
  getArticle,
  getArticleById,
  downloadArticle,
  downloadArticleById,
  searchArticles,
  getJournalStats,
  getLandingPageConfig,
  getPublicSettings
} from '../controllers/publicController';

const router = Router();

router.get('/current-issue', getCurrentIssue);
router.get('/archive', getArchive);
router.get('/issues/:volume/:number', getIssue);
router.get('/articles/doi/:doi(*)', getArticle);
router.get('/articles/doi/:doi(*)/download', downloadArticle);
router.get('/articles/:id', getArticleById);
router.get('/articles/:id/download', downloadArticleById);
router.get('/search', searchArticles);
router.get('/stats', getJournalStats);
router.get('/landing-page-config', getLandingPageConfig);
router.get('/settings', getPublicSettings);

export default router;
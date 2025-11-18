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
  getJournalStats 
} from '../controllers/publicController';

const router = Router();

router.get('/current-issue', getCurrentIssue);
router.get('/archive', getArchive);
router.get('/issues/:volume/:number', getIssue);
router.get('/articles/:doi', getArticle);
router.get('/articles/:doi/download', downloadArticle);
router.get('/article/:id', getArticleById);
router.get('/article/:id/download', downloadArticleById);
router.get('/search', searchArticles);
router.get('/stats', getJournalStats);

export default router;
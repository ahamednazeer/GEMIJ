import { Router } from 'express';
import { 
  getCurrentIssue, 
  getArchive, 
  getIssue, 
  getArticle, 
  downloadArticle, 
  searchArticles, 
  getJournalStats 
} from '../controllers/publicController';

const router = Router();

router.get('/current-issue', getCurrentIssue);
router.get('/archive', getArchive);
router.get('/issues/:volume/:number', getIssue);
router.get('/articles/:doi', getArticle);
router.get('/articles/:doi/download', downloadArticle);
router.get('/search', searchArticles);
router.get('/stats', getJournalStats);

export default router;
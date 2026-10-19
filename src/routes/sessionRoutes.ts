import { Router } from 'express';
import {
  bookSession,
  completeSession,
  createSession,
  getAvailableSessions,
} from '../controllers/sessionController';

const router = Router();

router.post('/', createSession);
router.get('/available', getAvailableSessions);
router.post('/:id/book', bookSession);
router.patch('/:id/complete', completeSession);

export default router;

import { Router } from 'express';
import { createUser, getUserSessions } from '../controllers/userController';

const router = Router();

router.post('/', createUser);
router.get('/:id/sessions', getUserSessions);

export default router;

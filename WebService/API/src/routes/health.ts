import { Router } from 'express';
import { getHealth } from '../controllers/index.js';

const router = Router();

router.get('/health', getHealth);

export default router;

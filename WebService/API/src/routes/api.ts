import { Router } from 'express';
import { estimateFee } from '../controllers/index.js';
import { relayTransaction } from '../controllers/index.js';
import { getUnspentNotes, saveNote, markNoteAsSpent } from '../controllers/index.js';
import { getHistory, saveHistory } from '../controllers/index.js';
import {
  validateFeeEstimate,
  validateRelayIntent,
  heavyApiLimiter,
  writeApiLimiter,
  readApiLimiter,
} from '../middleware/index.js';

const router = Router();

// Fee estimation endpoint
router.post('/estimate-fee', heavyApiLimiter, validateFeeEstimate, estimateFee);

// Relay transaction endpoint
router.post('/relay', heavyApiLimiter, validateRelayIntent, relayTransaction);

// Note management endpoints
router.get('/notes/:zkAddress', readApiLimiter, getUnspentNotes);
router.post('/notes', writeApiLimiter, saveNote);
router.post('/notes/mark-spent', writeApiLimiter, markNoteAsSpent);

// History endpoints
router.get('/history/:zkAddress', readApiLimiter, getHistory);
router.post('/history', writeApiLimiter, saveHistory);

export default router;

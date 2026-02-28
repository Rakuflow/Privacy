import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

const baseOptions = {
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
};

// Heavy endpoints (relay + fee estimation)
export const heavyApiLimiter = rateLimit({
  ...baseOptions,
  max: config.RATE_LIMIT_MAX,
  message: 'Too many heavy requests, please try again later.',
});

// Write endpoints (save/update)
export const writeApiLimiter = rateLimit({
  ...baseOptions,
  max: Math.max(config.RATE_LIMIT_MAX * 6, 60),
  message: 'Too many write requests, please try again later.',
});

// Read endpoints (notes/history polling)
export const readApiLimiter = rateLimit({
  ...baseOptions,
  max: Math.max(config.RATE_LIMIT_MAX * 18, 180),
  message: 'Too many read requests, please try again later.',
});

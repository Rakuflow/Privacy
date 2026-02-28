import { Express } from 'express';
import healthRoutes from './health.js';
import apiRoutes from './api.js';

export function registerRoutes(app: Express) {
  // Health check (no rate limit)
  app.use('/', healthRoutes);

  // API routes (endpoint-level rate limit inside api router)
  app.use('/api', apiRoutes);
}

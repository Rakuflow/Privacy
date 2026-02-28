import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = randomUUID();
  const start = process.hrtime.bigint();

  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  logger.info(
    {
      requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    'Request started',
  );

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const payload = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (res.statusCode >= 500) {
      logger.error(payload, 'Request completed with server error');
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn(payload, 'Request completed with client error');
      return;
    }

    logger.info(payload, 'Request completed');
  });

  next();
}

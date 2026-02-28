import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  void next;

  const status = error.status || 500;
  const message = error.message || 'Internal server error';

  logger.error(
    {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: status,
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    },
    'Unhandled application error',
  );

  res.status(status).json({
    success: false,
    error: message,
  });
}

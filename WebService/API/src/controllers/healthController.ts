import { Request, Response } from 'express';
import { getRelayerBalance } from '../models/index.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { HealthResponse } from '../types.js';

const startTime = Date.now();

export async function getHealth(req: Request, res: Response<HealthResponse>) {
  try {
    const balance = await getRelayerBalance();

    res.json({
      status: 'ok',
      relayerAddress: config.RELAYER_ADDRESS,
      balance: '0x' + balance.toString(16),
      version: '2.0.0',
      uptime: Date.now() - startTime,
    });
  } catch (error) {
    logger.error(
      {
        requestId: res.locals.requestId,
        method: req.method,
        path: req.originalUrl,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
      'Health check failed',
    );

    res.status(500).json({
      status: 'error',
      relayerAddress: config.RELAYER_ADDRESS,
      balance: '0x0',
      version: '2.0.0',
      uptime: Date.now() - startTime,
    });
  }
}

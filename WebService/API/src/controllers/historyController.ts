import { Request, Response } from 'express';
import { History } from '../models/History.js';
import { logger } from '../config/logger.js';

export async function getHistory(req: Request, res: Response) {
  try {
    const { zkAddress } = req.params;

    const history = await History.find({ zkAddress }).sort({ timestamp: -1 });

    res.json({
      success: true,
      history: history.map((h) => ({
        type: h.type,
        transactionHash: h.transactionHash,
        timestamp: h.timestamp,
        amount: h.amount,
        recipientZkAddress: h.recipientZkAddress,
        recipientPublicAddress: h.recipientPublicAddress,
      })),
    });
  } catch (error) {
    logger.error(
      {
        requestId: res.locals.requestId,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
      'Get history error',
    );

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history',
    });
  }
}

export async function saveHistory(req: Request, res: Response) {
  try {
    const {
      zkAddress,
      type,
      transactionHash,
      timestamp,
      amount,
      recipientZkAddress,
      recipientPublicAddress,
    } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        error: 'transactionHash is required',
      });
    }

    const history = new History({
      zkAddress,
      type,
      transactionHash,
      timestamp,
      amount,
      recipientZkAddress,
      recipientPublicAddress,
    });

    await history.save();

    logger.info(
      {
        requestId: res.locals.requestId,
        zkAddress,
        transactionHash,
        type,
      },
      'History saved successfully',
    );

    res.json({
      success: true,
      message: 'History saved successfully',
    });
  } catch (error) {
    logger.error(
      {
        requestId: res.locals.requestId,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
      'Save history error',
    );

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save history',
    });
  }
}

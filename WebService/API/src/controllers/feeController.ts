import { Request, Response } from 'express';
import { estimateGasFee, createFeeQuote } from '../utils/feeEstimator.js';
import { provider, relayerAccount } from '../models/index.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { FeeEstimateRequest, FeeEstimateResponse } from '../types.js';

export async function estimateFee(
  req: Request<{}, {}, FeeEstimateRequest>,
  res: Response<FeeEstimateResponse>,
) {
  try {
    const { type, proof, publicInputs, recipient, feeToken } = req.body;

    let calldata: any[];
    if (type === 'transfer') {
      calldata = [proof, publicInputs];
    } else {
      calldata = [proof, publicInputs, recipient];
    }

    const functionName = type === 'transfer' ? 'shielded_transfer' : 'withdraw';

    const estimatedGasFee = await estimateGasFee(
      provider,
      relayerAccount,
      config.SHIELDED_POOL_CONTRACT,
      functionName,
      calldata,
    );

    const quote = await createFeeQuote(estimatedGasFee, feeToken);

    logger.info(
      {
        requestId: res.locals.requestId,
        type,
        feeToken,
        quoteId: quote.quoteId,
        estimatedGasFee: estimatedGasFee.toString(),
        totalFee: quote.totalFee,
      },
      'Fee quote created',
    );

    res.json({
      success: true,
      estimatedGasFee: estimatedGasFee.toString(),
      serviceFee: (BigInt(quote.totalFee) - estimatedGasFee).toString(),
      totalFee: quote.totalFee,
      feeToken,
      expiresAt: quote.expiresAt,
      quoteId: quote.quoteId,
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
      'Fee estimation error',
    );

    res.status(500).json({
      success: false,
      estimatedGasFee: '0',
      serviceFee: '0',
      totalFee: '0',
      feeToken: req.body.feeToken || 'STRK',
      expiresAt: 0,
      quoteId: '',
    });
  }
}

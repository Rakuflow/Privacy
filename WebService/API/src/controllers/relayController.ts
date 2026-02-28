import { Request, Response } from 'express';
import { verifyRelayIntentSignature, validateNonce } from '../utils/signatureVerifier.js';
import { verifyFeeQuote, collectFeeFromUser } from '../utils/feeEstimator.js';
import {
  executeShieldedTransfer,
  executeWithdraw,
  provider,
  isRelayerDeployedLatest,
} from '../models/index.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { RelayRequest, RelayResponse } from '../types.js';

export async function relayTransaction(
  req: Request<{}, {}, RelayRequest>,
  res: Response<RelayResponse>,
) {
  const requestId = res.locals.requestId;

  try {
    const { intent, quoteId } = req.body;

    logger.info(
      {
        requestId,
        intentType: intent.type,
        userAddress: intent.userAddress,
        quoteId,
      },
      'Relay request received',
    );

    const relayerReady = await isRelayerDeployedLatest();
    if (!relayerReady) {
      logger.warn({ requestId }, 'Relayer account is not deployed on target network');
      return res.status(503).json({
        success: false,
        error:
          'Relayer account is not deployed on this network. Check RELAYER_ADDRESS/RELAYER_PRIVATE_KEY and deploy account first.',
      });
    }

    const sigVerification = verifyRelayIntentSignature(intent);

    if (!sigVerification.valid) {
      logger.warn(
        {
          requestId,
          reason: sigVerification.error,
          userAddress: intent.userAddress,
        },
        'Relay signature verification failed',
      );
      return res.status(400).json({
        success: false,
        error: `Invalid signature: ${sigVerification.error}`,
      });
    }

    if (!validateNonce(intent.nonce, intent.userAddress)) {
      logger.warn(
        {
          requestId,
          userAddress: intent.userAddress,
          nonce: intent.nonce,
        },
        'Relay nonce already used',
      );
      return res.status(400).json({
        success: false,
        error: 'Nonce already used',
      });
    }

    let agreedFee: string;

    if (quoteId) {
      const quote = verifyFeeQuote(quoteId);
      if (!quote) {
        logger.warn(
          {
            requestId,
            quoteId,
          },
          'Relay quote is invalid or expired',
        );
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired fee quote',
        });
      }

      agreedFee = quote.totalFee;
    } else {
      agreedFee = intent.maxFeeAmount;
    }

    const feeAmount = BigInt(agreedFee);
    const paymentResult = await collectFeeFromUser(
      provider,
      intent.userAddress,
      config.RELAYER_ADDRESS,
      intent.feeToken,
      feeAmount,
    );

    if (!paymentResult.success) {
      logger.warn(
        {
          requestId,
          userAddress: intent.userAddress,
          feeToken: intent.feeToken,
          agreedFee,
          error: paymentResult.error,
        },
        'Relay fee collection failed',
      );
      return res.status(402).json({
        success: false,
        error: `Payment failed: ${paymentResult.error}`,
      });
    }

    const txMaxFeeWei = (() => {
      const agreed = BigInt(agreedFee);
      const relayFloor = BigInt(config.RELAYER_TX_MAX_FEE_WEI);
      return (agreed > relayFloor ? agreed : relayFloor).toString();
    })();

    let txResult;
    if (intent.type === 'transfer') {
      txResult = await executeShieldedTransfer(
        intent.proof,
        intent.publicInputs,
        txMaxFeeWei,
      );
    } else {
      if (!intent.recipient) {
        return res.status(400).json({
          success: false,
          error: 'Recipient required for withdraw',
        });
      }

      txResult = await executeWithdraw(
        intent.proof,
        intent.publicInputs,
        intent.recipient,
        txMaxFeeWei,
      );
    }

    logger.info(
      {
        requestId,
        txHash: txResult.transaction_hash,
      },
      'Relay transaction broadcasted',
    );

    await provider.waitForTransaction(txResult.transaction_hash);

    logger.info(
      {
        requestId,
        txHash: txResult.transaction_hash,
        feeCharged: agreedFee,
        feeToken: intent.feeToken,
        paymentTxHash: paymentResult.txHash,
      },
      'Relay transaction confirmed',
    );

    res.json({
      success: true,
      transactionHash: txResult.transaction_hash,
      feeCharged: agreedFee,
      feeToken: intent.feeToken,
      paymentTxHash: paymentResult.txHash,
    });
  } catch (error) {
    logger.error(
      {
        requestId,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
      'Relay transaction failed',
    );

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown relay error',
    });
  }
}

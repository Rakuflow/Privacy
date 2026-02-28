import { Request, Response, NextFunction } from 'express';

// Validate relay intent structure
export function validateRelayIntent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { intent } = req.body;

  if (!intent) {
    return res.status(400).json({
      success: false,
      error: 'Missing relay intent',
    });
  }

  const requiredFields = [
    'type',
    'proof',
    'publicInputs',
    'userAddress',
    'timestamp',
    'nonce',
    'signature',
    'feeToken',
    'maxFeeAmount',
  ];

  for (const field of requiredFields) {
    if (!intent[field]) {
      return res.status(400).json({
        success: false,
        error: `Missing field: ${field}`,
      });
    }
  }

  next();
}

// Validate fee estimate request
export function validateFeeEstimate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { type, proof, publicInputs, feeToken } = req.body;

  if (!type || !proof || !publicInputs || !feeToken) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
    });
  }

  if (proof.length !== 3) {
    return res.status(400).json({
      success: false,
      error: `Invalid proof length: expected 3, got ${proof.length}`,
    });
  }

  const expectedInputsLength = type === 'transfer' ? 4 : 5;
  if (publicInputs.length !== expectedInputsLength) {
    return res.status(400).json({
      success: false,
      error: `Invalid public inputs length: expected ${expectedInputsLength}, got ${publicInputs.length}`,
    });
  }

  next();
}

import { createRequire } from 'node:module';
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const defaultLevel = isProduction ? 'info' : 'debug';

const prettyTransport = (() => {
  if (isProduction) {
    return undefined;
  }

  try {
    const require = createRequire(import.meta.url);
    const prettyTarget = require.resolve('pino-pretty');

    return {
      target: prettyTarget,
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        levelFirst: true,
        singleLine: true,
        ignore: 'pid,hostname',
      },
    };
  } catch {
    return undefined;
  }
})();

export const logger = pino({
  name: 'rakushield-backend',
  level: process.env.LOG_LEVEL || defaultLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'request.headers.authorization',
      'request.headers.cookie',
      'intent.signature',
      'proof',
      'RELAYER_PRIVATE_KEY',
    ],
    censor: '[REDACTED]',
  },
  transport: prettyTransport,
});

import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/index.js';
import { logger } from './config/logger.js';
import { connectDatabase } from './config/database.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler, requestLogger } from './middleware/index.js';
import { registerSwagger } from './docs/swagger.js';

validateConfig();

const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());

registerSwagger(app);
registerRoutes(app);

app.use(errorHandler);

async function startServer() {
  await connectDatabase();

  app.listen(config.PORT, () => {
    logger.info(
      {
        port: config.PORT,
        relayerAddress: config.RELAYER_ADDRESS,
        shieldedPoolContract: config.SHIELDED_POOL_CONTRACT,
        rpcUrl: config.RPC_URL,
        docsUrl: `http://localhost:${config.PORT}/docs`,
        openApiUrl: `http://localhost:${config.PORT}/openapi.json`,
      },
      'RakuShield service started',
    );
  });
}

startServer().catch((error) => {
  logger.fatal(
    {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    },
    'Failed to start server',
  );
  process.exit(1);
});

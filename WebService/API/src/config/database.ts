import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from './logger.js';

async function scrubSensitiveNoteFields() {
  try {
    const result = await mongoose.connection
      .collection('notes')
      .updateMany({ spendingKey: { $exists: true } }, { $unset: { spendingKey: '' } });

    if (result.modifiedCount > 0) {
      logger.info(
        {
          modifiedCount: result.modifiedCount,
        },
        'Removed legacy spendingKey from notes',
      );
    }
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to scrub legacy spendingKey fields',
    );
  }
}

export async function connectDatabase() {
  try {
    await mongoose.connect(config.MONGO_URI, {
      dbName: config.MONGO_DB_NAME,
    });

    logger.info(
      {
        dbName: mongoose.connection.name,
      },
      'MongoDB connected',
    );

    await scrubSensitiveNoteFields();
  } catch (error) {
    logger.fatal(
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
      'MongoDB connection error',
    );
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});

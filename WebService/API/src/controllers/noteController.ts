import { Request, Response } from 'express';
import { Note } from '../models/Note.js';
import { logger } from '../config/logger.js';

export async function getUnspentNotes(req: Request, res: Response) {
  try {
    const { zkAddress } = req.params;

    const notes = await Note.find({
      zkAddress,
      isSpent: false,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      notes: notes.map((note) => ({
        commitment: note.commitment,
        amount: note.amount,
        rho: note.rho,
        rcm: note.rcm,
        isSpent: note.isSpent,
        leafIndex: note.leafIndex,
        transactionHash: note.transactionHash,
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
      'Get notes error',
    );

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notes',
    });
  }
}

export async function saveNote(req: Request, res: Response) {
  try {
    const { zkAddress, commitment, amount, rho, rcm, leafIndex, transactionHash } =
      req.body;

    const existing = await Note.findOne({ commitment });
    if (existing) {
      logger.info(
        {
          requestId: res.locals.requestId,
          commitment,
          zkAddress,
        },
        'Note already exists',
      );

      return res.json({
        success: true,
        message: 'Note already exists',
      });
    }

    const note = new Note({
      zkAddress,
      commitment,
      amount,
      rho,
      rcm,
      isSpent: false,
      leafIndex,
      transactionHash,
    });

    await note.save();

    logger.info(
      {
        requestId: res.locals.requestId,
        commitment,
        zkAddress,
      },
      'Note saved successfully',
    );

    res.json({
      success: true,
      message: 'Note saved successfully',
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
      'Save note error',
    );

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save note',
    });
  }
}

export async function markNoteAsSpent(req: Request, res: Response) {
  try {
    const { zkAddress, commitment } = req.body;

    const result = await Note.updateOne(
      { zkAddress, commitment },
      { isSpent: true },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    logger.info(
      {
        requestId: res.locals.requestId,
        commitment,
        zkAddress,
      },
      'Note marked as spent',
    );

    res.json({
      success: true,
      message: 'Note marked as spent',
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
      'Mark note as spent error',
    );

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark note as spent',
    });
  }
}

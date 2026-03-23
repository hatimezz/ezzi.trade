import { Router } from 'express';
import type { Request, Response } from 'express';
import { standardRateLimit } from '../middleware/rate-limit';
import { authMiddleware } from '../middleware/auth';
import { StartMiningSchema, EndMiningSchema } from '../lib/validation';
import { miningService } from '../services/mining.service';
import { logError } from '../lib/logger';

export const runtime = 'nodejs';

const router = Router();

// GET /api/mining/sessions - Get user's mining sessions
router.get('/sessions', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const sessions = await miningService.getActiveSessions(userId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    logError('[MINING SESSIONS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

// GET /api/mining/history - Get user's mining history
router.get('/history', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const sessions = await miningService.getSessionHistory(userId, limit);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    logError('[MINING HISTORY ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

// POST /api/mining/start - Start mining
router.post('/start', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = StartMiningSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: 'Invalid input' });
      return;
    }

    const { nftId, zone } = result.data;
    const userId = (req as any).user?.id;

    const session = await miningService.startMining({
      userId,
      nftId,
      zone,
    });

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    logError('[START MINING ERROR]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start mining',
    });
  }
});

// POST /api/mining/end - End mining
router.post('/end', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = EndMiningSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: 'Invalid input' });
      return;
    }

    const { sessionId } = result.data;
    const userId = (req as any).user?.id;

    const result_data = await miningService.endMining({
      sessionId,
      userId,
    });

    res.json({
      success: true,
      data: result_data,
    });
  } catch (error) {
    logError('[END MINING ERROR]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to end mining',
    });
  }
});

// GET /api/mining/zones - Get zones
router.get('/zones', async (_req: Request, res: Response): Promise<void> => {
  try {
    const zones = await miningService.getZones();

    res.json({
      success: true,
      data: zones,
    });
  } catch (error) {
    logError('[ZONES ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch zones' });
  }
});

// GET /api/mining/calculate/:sessionId - Calculate current earnings
router.get('/calculate/:sessionId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const earnings = await miningService.calculateCurrentEarnings(sessionId);

    res.json({
      success: true,
      data: earnings,
    });
  } catch (error) {
    logError('[CALCULATE ERROR]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate earnings',
    });
  }
});

export { router as miningRouter };

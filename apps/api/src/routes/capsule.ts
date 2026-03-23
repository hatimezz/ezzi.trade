import { Router } from 'express';
import type { Request, Response } from 'express';
import { standardRateLimit } from '../middleware/rate-limit';
import { authMiddleware } from '../middleware/auth';
import { OpenCapsuleSchema } from '../lib/validation';
import { capsuleService } from '../services/capsule.service';
import { emitCapsuleOpen } from '../lib/socket';
import { logError } from '../lib/logger';

export const runtime = 'nodejs';

const router = Router();

// GET /api/capsules - Get all capsule tiers
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const capsules = await capsuleService.getCapsuleTiers();

    res.json({
      success: true,
      data: capsules,
    });
  } catch (error) {
    logError('CAPSULES_ERROR', error, { route: '/capsules' });
    res.status(500).json({ success: false, error: 'Failed to fetch capsules' });
  }
});

// GET /api/capsules/:id - Get single capsule tier
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const capsule = await capsuleService.getCapsuleTier(id);

    if (!capsule) {
      res.status(404).json({ success: false, error: 'Capsule not found' });
      return;
    }

    res.json({
      success: true,
      data: capsule,
    });
  } catch (error) {
    logError('CAPSULE_DETAIL_ERROR', error, { route: '/capsules/:id' });
    res.status(500).json({ success: false, error: 'Failed to fetch capsule' });
  }
});

// POST /api/capsules/open - Open a capsule
router.post('/open', authMiddleware, standardRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = OpenCapsuleSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: 'Invalid input' });
      return;
    }

    const { capsuleTierId } = result.data;
    const userId = (req as any).user?.id;

    const opening = await capsuleService.openCapsule(capsuleTierId, userId);

    // Emit live event
    emitCapsuleOpen({
      userId,
      capsuleName: opening.opening.capsuleTier.displayName,
      result: opening.resultType,
      rarity: opening.rarity || undefined,
    });

    res.json({
      success: true,
      data: opening,
    });
  } catch (error) {
    logError('OPEN_CAPSULE_ERROR', error, { route: '/capsules/open' });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open capsule',
    });
  }
});

// GET /api/capsules/openings - Get user's capsule openings
router.get('/openings', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const openings = await capsuleService.getUserOpenings(userId, limit);

    res.json({
      success: true,
      data: openings,
    });
  } catch (error) {
    logError('CAPSULE_OPENINGS_ERROR', error, { route: '/capsules/openings' });
    res.status(500).json({ success: false, error: 'Failed to fetch openings' });
  }
});

// GET /api/capsules/recent - Get recent openings (public)
router.get('/recent', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const openings = await capsuleService.getRecentOpenings(limit);

    res.json({
      success: true,
      data: openings,
    });
  } catch (error) {
    logError('RECENT_OPENINGS_ERROR', error, { route: '/capsules/recent' });
    res.status(500).json({ success: false, error: 'Failed to fetch recent openings' });
  }
});

// GET /api/capsules/history - Get user's full capsule history
router.get('/history', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await capsuleService.getCapsuleHistory(userId, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logError('CAPSULE_HISTORY_ERROR', error, { route: '/capsules/history' });
    res.status(500).json({ success: false, error: 'Failed to fetch capsule history' });
  }
});

// GET /api/capsules/streak - Get user's daily streak
router.get('/streak', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    const streak = await capsuleService.getUserStreak(userId);

    res.json({
      success: true,
      data: streak,
    });
  } catch (error) {
    logError('CAPSULE_STREAK_ERROR', error, { route: '/capsules/streak' });
    res.status(500).json({ success: false, error: 'Failed to fetch streak' });
  }
});

export { router as capsuleRouter };

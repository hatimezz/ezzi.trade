import { Router } from 'express';
import type { Request, Response } from 'express';
import { standardRateLimit } from '../middleware/rate-limit';
import { authMiddleware } from '../middleware/auth';
import { CreateUserSchema, ConnectWalletSchema } from '../lib/validation';
import { userService } from '../services/user.service';

const router = Router();

// GET /api/users/profile - Get current user profile
router.get('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const user = await userService.getUserById(userId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[PROFILE ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// GET /api/users/nfts - Get user's owned NFTs
router.get('/nfts', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const nfts = await userService.getUserNFTs(userId);

    res.json({
      success: true,
      data: nfts,
    });
  } catch (error) {
    console.error('[USER NFTS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch NFTs' });
  }
});

// GET /api/users/balance - Get user's balance
router.get('/balance', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const balance = await userService.getUserBalance(userId);

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error('[BALANCE ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch balance' });
  }
});

// POST /api/users - Create new user
router.post('/', standardRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = CreateUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: result.error.errors });
      return;
    }

    const auth = await userService.createUser(result.data);

    // Set token cookie
    res.cookie('token', auth.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: auth,
    });
  } catch (error) {
    console.error('[CREATE USER ERROR]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
});

// POST /api/users/connect-wallet - Connect wallet
router.post('/connect-wallet', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = ConnectWalletSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: 'Invalid input' });
      return;
    }

    const { address, chain } = result.data;
    const userId = (req as any).user?.id;

    const wallet = await userService.connectWallet(userId, address, chain);

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error('[CONNECT WALLET ERROR]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect wallet',
    });
  }
});

// GET /api/users/stats - Get platform stats (public)
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await userService.getPlatformStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[STATS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export { router as userRouter };

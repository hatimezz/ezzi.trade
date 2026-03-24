import { Router } from 'express';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { logError, logInfo } from '../lib/logger';

export const runtime = 'nodejs';

const router = Router();

// Zod schema for Telegram auth
const TelegramAuthSchema = z.object({
  telegramId: z.string().min(1),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
});

// Generate JWT token
function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '30d' }
  );
}

// POST /api/telegram/auth - Authenticate Telegram user
router.post('/auth', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = TelegramAuthSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: result.error.errors,
      });
      return;
    }

    const { telegramId, username, firstName, lastName, photoUrl } = result.data;

    // Check if user exists by telegram ID
    let user = await prisma.user.findFirst({
      where: {
        telegramId: telegramId,
      },
      include: {
        balance: true,
      },
    });

    if (user) {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          username: username || user.username,
          displayName: firstName || user.displayName,
          avatarUrl: photoUrl || user.avatarUrl,
        },
      });
    } else {
      // Create new user
      const newUsername = username || `tg_${telegramId.slice(-8)}`;

      user = await prisma.user.create({
        data: {
          telegramId,
          username: newUsername,
          displayName: firstName || newUsername,
          avatarUrl: photoUrl || null,
        },
        include: {
          balance: true,
        },
      });

      // Create user balance with starter bonus
      await prisma.userBalance.create({
        data: {
          userId: user.id,
          ezziBalance: 100, // Starter bonus
          totalMined: 0,
          totalEarned: 100,
          totalSpent: 0,
        },
      });

      logInfo('TELEGRAM_USER_CREATED', { telegramId, userId: user.id });
    }

    // Generate token
    const token = generateToken(user.id);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        userAgent: req.headers['user-agent'] || 'telegram',
        ipAddress: req.ip || null,
      },
    });

    // Get balance
    const balance = await prisma.userBalance.findUnique({
      where: { userId: user.id },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        balance: balance?.ezziBalance || 0,
        token,
      },
    });

    logInfo('TELEGRAM_AUTH_SUCCESS', { telegramId, userId: user.id });
  } catch (error) {
    logError('TELEGRAM_AUTH_ERROR', error, { path: '/telegram/auth' });
    res.status(500).json({ success: false, error: 'Failed to authenticate' });
  }
});

// GET /api/telegram/user/:id - Get user by telegram ID
router.get('/user/:telegramId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { telegramId } = req.params;

    const user = await prisma.user.findFirst({
      where: { telegramId },
      include: {
        balance: true,
        wallets: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        balance: user.balance?.ezziBalance || 0,
      },
    });
  } catch (error) {
    logError('TELEGRAM_USER_ERROR', error, { path: '/telegram/user' });
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// POST /api/telegram/sync - Sync balance from Mini App
router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { telegramId, balance, totalMined } = req.body;

    if (!telegramId) {
      res.status(400).json({ success: false, error: 'telegramId required' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { telegramId },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Update balance
    if (typeof balance === 'number') {
      await prisma.userBalance.upsert({
        where: { userId: user.id },
        update: {
          ezziBalance: balance,
          totalMined: totalMined || 0,
        },
        create: {
          userId: user.id,
          ezziBalance: balance,
          totalMined: totalMined || 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      });
    }

    res.json({
      success: true,
      data: { message: 'Synced successfully' },
    });
  } catch (error) {
    logError('TELEGRAM_SYNC_ERROR', error, { path: '/telegram/sync' });
    res.status(500).json({ success: false, error: 'Failed to sync' });
  }
});

export { router as telegramRouter };
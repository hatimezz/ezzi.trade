import { Router } from 'express';
import type { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/db';
import redis from '../lib/redis';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logError } from '../lib/logger';

export const runtime = 'nodejs';

const router = Router();

// Zod schemas
const SignupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(50).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const WalletAuthSchema = z.object({
  address: z.string().min(32).max(44),
  chain: z.enum(['solana', 'ethereum']).default('solana'),
  signature: z.string().min(64),
  message: z.string(),
});

// Rate limit config: 5 attempts, 30min lockout
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 30 * 60; // 30 minutes in seconds

async function checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const redisKey = `rate_limit:auth:${key}`;
  const attempts = await redis.get(redisKey);
  const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

  if (currentAttempts >= RATE_LIMIT_ATTEMPTS) {
    const ttl = await redis.ttl(redisKey);
    return { allowed: false, remaining: 0, retryAfter: ttl };
  }

  return { allowed: true, remaining: RATE_LIMIT_ATTEMPTS - currentAttempts };
}

async function incrementRateLimit(key: string): Promise<void> {
  const redisKey = `rate_limit:auth:${key}`;
  const multi = redis.multi();
  multi.incr(redisKey);
  multi.expire(redisKey, RATE_LIMIT_WINDOW);
  await multi.exec();
}

async function clearRateLimit(key: string): Promise<void> {
  await redis.del(`rate_limit:auth:${key}`);
}

// Generate JWT token
function generateToken(userId: string, email?: string | null): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

// Set auth cookie
function setAuthCookie(res: Response, token: string): void {
  res.cookie('ezzi_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// Clear auth cookie
function clearAuthCookie(res: Response): void {
  res.clearCookie('ezzi_token');
}

// POST /api/auth/signup - Register new user
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = SignupSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: result.error.errors,
      });
      return;
    }

    const { email, username, password, displayName } = result.data;

    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Email or username already exists',
      });
      return;
    }

    // Hash password with bcrypt 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: displayName || username,
      },
    });

    // Create password record (extend schema if needed, for now we store in metadata)
    await prisma.session.create({
      data: {
        userId: user.id,
        token: passwordHash, // Using token field temporarily for password hash
        expiresAt: new Date('2099-01-01'), // Never expire for password storage
        userAgent: 'password_auth',
      },
    });

    // Create user balance
    await prisma.userBalance.create({
      data: {
        userId: user.id,
        ezziBalance: 0,
        totalMined: 0,
        totalEarned: 0,
        totalSpent: 0,
      },
    });

    // Generate token and create session
    const token = generateToken(user.id, user.email);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      },
    });

    // Set auth cookie
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
        },
      },
    });
  } catch (error) {
    logError('SIGNUP_ERROR', error, { path: '/auth/signup' });
    res.status(500).json({ success: false, error: 'Failed to create account' });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: result.error.errors,
      });
      return;
    }

    const { email, password } = result.data;

    // Check rate limit by IP + email combination
    const rateLimitKey = `${req.ip}:${email}`;
    const rateLimit = await checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter,
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await incrementRateLimit(rateLimitKey);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        remainingAttempts: rateLimit.remaining - 1,
      });
      return;
    }

    // Get password hash from sessions (stored with userAgent = 'password_auth')
    const passwordSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        userAgent: 'password_auth',
      },
    });

    if (!passwordSession) {
      await incrementRateLimit(rateLimitKey);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        remainingAttempts: rateLimit.remaining - 1,
      });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, passwordSession.token);

    if (!isValid) {
      await incrementRateLimit(rateLimitKey);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        remainingAttempts: rateLimit.remaining - 1,
      });
      return;
    }

    // Clear rate limit on successful login
    await clearRateLimit(rateLimitKey);

    // Generate token
    const token = generateToken(user.id, user.email);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Set auth cookie
    setAuthCookie(res, token);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
        },
      },
    });
  } catch (error) {
    logError('LOGIN_ERROR', error, { path: '/auth/login' });
    res.status(500).json({ success: false, error: 'Failed to login' });
  }
});

// POST /api/auth/wallet - Authenticate with wallet (Phantom)
router.post('/wallet', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = WalletAuthSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: result.error.errors,
      });
      return;
    }

    const { address, chain, signature, message } = result.data;

    // Verify signature (simplified - in production use proper verification)
    // For Solana, we would verify using @solana/web3.js
    // This is a placeholder implementation

    // Check if wallet exists
    let wallet = await prisma.wallet.findUnique({
      where: { address },
      include: { user: true },
    });

    let user;

    if (wallet) {
      user = wallet.user;
    } else {
      // Create new user with wallet
      const username = `wallet_${address.slice(0, 8)}`;
      user = await prisma.user.create({
        data: {
          username,
          displayName: `Warrior ${address.slice(0, 6)}`,
        },
      });

      // Create wallet
      await prisma.wallet.create({
        data: {
          userId: user.id,
          address,
          chain,
          isPrimary: true,
        },
      });

      // Create user balance
      await prisma.userBalance.create({
        data: {
          userId: user.id,
          ezziBalance: 0,
          totalMined: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Set auth cookie
    setAuthCookie(res, token);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
        },
      },
    });
  } catch (error) {
    logError('WALLET_AUTH_ERROR', error, { path: '/auth/wallet' });
    res.status(500).json({ success: false, error: 'Failed to authenticate with wallet' });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.ezzi_token;

    if (token) {
      // Delete session
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    clearAuthCookie(res);

    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    logError('LOGOUT_ERROR', error, { path: '/auth/logout' });
    res.status(500).json({ success: false, error: 'Failed to logout' });
  }
});

// POST /api/auth/refresh - Refresh session
router.post('/refresh', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const oldToken = req.cookies?.ezzi_token;

    if (!userId || !oldToken) {
      res.status(401).json({ success: false, error: 'Invalid session' });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    // Delete old session
    await prisma.session.deleteMany({
      where: { token: oldToken },
    });

    // Generate new token
    const newToken = generateToken(user.id, user.email);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create new session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: newToken,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      },
    });

    // Set new auth cookie
    setAuthCookie(res, newToken);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
        },
      },
    });
  } catch (error) {
    logError('REFRESH_ERROR', error, { path: '/auth/refresh' });
    res.status(500).json({ success: false, error: 'Failed to refresh session' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        balance: true,
        _count: {
          select: {
            ownedNfts: true,
            capsuleOpenings: true,
          },
        },
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
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
          wallets: user.wallets,
          balance: user.balance,
          stats: {
            nftCount: user._count.ownedNfts,
            capsuleCount: user._count.capsuleOpenings,
          },
        },
      },
    });
  } catch (error) {
    logError('ME_ERROR', error, { path: '/auth/me' });
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

export { router as authRouter };

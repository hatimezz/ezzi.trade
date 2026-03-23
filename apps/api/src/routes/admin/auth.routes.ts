import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireAdmin, type AdminRequest, type AdminTokenPayload } from '../../middleware/admin.middleware';
import { strictRateLimit } from '../../middleware/rate-limit';

export const runtime = 'nodejs';

const router = Router();

const LoginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(128),
});

function hashIp(ip: string | undefined): string {
  const raw = ip || 'unknown';
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

// POST /api/admin/auth/login
router.post('/login', strictRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, password } = parsed.data;
    const ipHash = hashIp(req.ip);

    const admin = await prisma.admin.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    if (!admin) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    if (!admin.isActive) {
      res.status(403).json({ success: false, error: 'Account is deactivated' });
      return;
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (admin.lockedUntil.getTime() - Date.now()) / 60000
      );
      res.status(403).json({
        success: false,
        error: `Account is locked. Try again in ${minutesLeft} minutes.`,
      });
      return;
    }

    const passwordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordValid) {
      const newAttempts = admin.loginAttempts + 1;
      const updateData: { loginAttempts: number; lockedUntil?: Date } = {
        loginAttempts: newAttempts,
      };

      if (newAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await prisma.admin.update({
        where: { id: admin.id },
        data: updateData,
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'LOGIN_FAILED',
          target: 'Admin',
          targetId: admin.id,
          after: { attempts: newAttempts, locked: newAttempts >= 5 },
          ipHash,
        },
      });

      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipHash,
      },
    });

    const payload: AdminTokenPayload = {
      adminId: admin.id,
      role: admin.role,
      type: 'admin',
    };

    const token = jwt.sign(payload, getJwtSecret(), {
      expiresIn: '8h',
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'LOGIN_SUCCESS',
        target: 'Admin',
        targetId: admin.id,
        ipHash,
      },
    });

    res.cookie('ezzi_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// POST /api/admin/auth/logout
router.post('/logout', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.ezzi_admin_token;

    if (token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret()) as AdminTokenPayload;
        const ipHash = hashIp(req.ip);

        await prisma.adminAuditLog.create({
          data: {
            adminId: decoded.adminId,
            action: 'LOGOUT',
            target: 'Admin',
            targetId: decoded.adminId,
            ipHash,
          },
        });
      } catch {
        // Token already expired or invalid, still clear cookie
      }
    }

    res.clearCookie('ezzi_admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.json({ success: true, data: { message: 'Logged out' } });
  } catch {
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// GET /api/admin/auth/me
router.get('/me', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.adminId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin not found' });
      return;
    }

    res.json({ success: true, data: admin });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch admin profile' });
  }
});

export { router as adminAuthRouter };

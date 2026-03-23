import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireAdmin, requireSuperAdmin, requireAdminWrite, type AdminRequest } from '../../middleware/admin.middleware';

export const runtime = 'nodejs';

const router = Router();

function hashIp(ip: string | undefined): string {
  const raw = ip || 'unknown';
  return crypto.createHash('sha256').update(raw).digest('hex');
}

const PaginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  search: z.string().optional(),
  tier: z.string().optional(),
  status: z.enum(['active', 'suspended', 'banned', 'deleted']).optional(),
  sortBy: z.enum(['createdAt', 'lastLoginAt', 'username']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const GiveEzziSchema = z.object({
  amount: z.number().positive().max(1000000),
  reason: z.string().min(1).max(500),
});

const SetTierSchema = z.object({
  tier: z.string().min(1).max(20),
  reason: z.string().min(1).max(500),
});

const SuspendSchema = z.object({
  reason: z.string().min(1).max(500),
  durationHours: z.number().int().positive().max(8760).optional(),
});

const BanSchema = z.object({
  reason: z.string().min(1).max(500),
});

// GET /api/admin/users
router.get('/', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = PaginationSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { page, limit, search, tier, status, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tier) {
      where.tier = tier;
    }

    if (status === 'active') {
      where.isActive = true;
      where.bannedAt = null;
      where.suspendedAt = null;
      where.deletedAt = null;
    } else if (status === 'suspended') {
      where.suspendedAt = { not: null };
      where.bannedAt = null;
      where.deletedAt = null;
    } else if (status === 'banned') {
      where.bannedAt = { not: null };
      where.deletedAt = null;
    } else if (status === 'deleted') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          tier: true,
          isActive: true,
          country: true,
          suspendedAt: true,
          bannedAt: true,
          deletedAt: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              ownedNfts: true,
              capsuleOpenings: true,
              presalePurchases: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id
router.get('/:id', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        wallets: { select: { id: true, address: true, chain: true, isPrimary: true } },
        balance: true,
        ownedNfts: {
          include: { warrior: { select: { name: true, rarity: true, zone: true } } },
          take: 20,
        },
        capsuleOpenings: { take: 10, orderBy: { createdAt: 'desc' } },
        presalePurchases: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: {
          select: {
            ownedNfts: true,
            capsuleOpenings: true,
            miningSessions: true,
            presalePurchases: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// POST /api/admin/users/:id/suspend
router.post('/:id/suspend', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = SuspendSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { reason, durationHours } = parsed.data;
    const suspendedUntil = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
      : null;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        suspendedAt: new Date(),
        suspendedUntil,
        suspendedReason: reason,
        isActive: false,
      },
      select: { id: true, username: true },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'USER_SUSPENDED',
        target: 'User',
        targetId: user.id,
        after: { reason, durationHours, suspendedUntil },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: `User ${user.username || user.id} suspended` } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to suspend user' });
  }
});

// POST /api/admin/users/:id/unsuspend
router.post('/:id/unsuspend', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        suspendedAt: null,
        suspendedUntil: null,
        suspendedReason: null,
        isActive: true,
      },
      select: { id: true, username: true },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'USER_UNSUSPENDED',
        target: 'User',
        targetId: user.id,
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: `User ${user.username || user.id} unsuspended` } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to unsuspend user' });
  }
});

// POST /api/admin/users/:id/ban
router.post('/:id/ban', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = BanSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        bannedAt: new Date(),
        bannedReason: parsed.data.reason,
        isActive: false,
      },
      select: { id: true, username: true },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'USER_BANNED',
        target: 'User',
        targetId: user.id,
        after: { reason: parsed.data.reason },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: `User ${user.username || user.id} banned` } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to ban user' });
  }
});

// POST /api/admin/users/:id/give-ezzi
router.post('/:id/give-ezzi', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = GiveEzziSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { amount, reason } = parsed.data;

    const balance = await prisma.userBalance.upsert({
      where: { userId: req.params.id },
      create: {
        userId: req.params.id,
        ezziBalance: amount,
        totalEarned: amount,
      },
      update: {
        ezziBalance: { increment: amount },
        totalEarned: { increment: amount },
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'GIVE_EZZI',
        target: 'User',
        targetId: req.params.id,
        after: { amount, reason, newBalance: balance.ezziBalance },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: `Gave ${amount} EZZI`, newBalance: balance.ezziBalance } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to give EZZI' });
  }
});

// POST /api/admin/users/:id/set-tier
router.post('/:id/set-tier', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = SetTierSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { tier, reason } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { tier: true },
    });

    const previousTier = user?.tier;

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { tier },
      select: { id: true, username: true, tier: true },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'SET_USER_TIER',
        target: 'User',
        targetId: req.params.id,
        before: { tier: previousTier },
        after: { tier, reason },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: `Tier set to ${tier}`, user: updated } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to set tier' });
  }
});

// DELETE /api/admin/users/:id (soft delete)
router.delete('/:id', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
      select: { id: true, username: true },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'USER_SOFT_DELETED',
        target: 'User',
        targetId: user.id,
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: `User ${user.username || user.id} deleted` } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

export { router as adminUsersRouter };

import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireAdmin, requireSuperAdmin, type AdminRequest } from '../../middleware/admin.middleware';
import { getCachedKey, setCachedKey } from '../../lib/redis';

export const runtime = 'nodejs';

const router = Router();

function hashIp(ip: string | undefined): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
}

const OpeningsFilterSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  tierId: z.string().optional(),
  resultType: z.string().optional(),
  rarity: z.string().optional(),
});

const CapsuleSettingsSchema = z.object({
  tierId: z.string().min(1),
  commonRate: z.number().int().min(0).max(100).optional(),
  rareRate: z.number().int().min(0).max(100).optional(),
  epicRate: z.number().int().min(0).max(100).optional(),
  legendaryRate: z.number().int().min(0).max(100).optional(),
  mythicRate: z.number().int().min(0).max(100).optional(),
  ezziRate: z.number().int().min(0).max(100).optional(),
  price: z.number().positive().optional(),
});

// GET /api/admin/capsules/openings
router.get('/openings', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = OpeningsFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { page, limit, tierId, resultType, rarity } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (tierId) where.capsuleTierId = tierId;
    if (resultType) where.resultType = resultType;
    if (rarity) where.rarity = rarity;

    const [openings, total] = await Promise.all([
      prisma.capsuleOpening.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, email: true } },
          capsuleTier: { select: { name: true, displayName: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.capsuleOpening.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        openings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch capsule openings' });
  }
});

// GET /api/admin/capsules/stats
router.get('/stats', requireAdmin(), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = 'admin:capsule:stats';
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const [tiers, totalOpenings, byRarity, recentOpenings] = await Promise.all([
      prisma.capsuleTier.findMany({
        select: {
          id: true,
          name: true,
          displayName: true,
          price: true,
          totalSupply: true,
          remaining: true,
          _count: { select: { openings: true } },
        },
      }),
      prisma.capsuleOpening.count(),
      prisma.capsuleOpening.groupBy({
        by: ['rarity'],
        _count: { id: true },
      }),
      prisma.capsuleOpening.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const rarityDistribution: Record<string, number> = {};
    for (const r of byRarity) {
      if (r.rarity) {
        rarityDistribution[r.rarity] = r._count.id;
      }
    }

    type TierWithCount = { id: string; name: string; displayName: string; price: number; totalSupply: number; remaining: number; _count: { openings: number } };
    const totalRevenue = tiers.reduce(
      (sum: number, t: TierWithCount) => sum + t._count.openings * t.price,
      0
    );

    const stats = {
      totalOpenings,
      recentOpenings24h: recentOpenings,
      totalRevenue,
      rarityDistribution,
      tiers: tiers.map((t: TierWithCount) => ({
        id: t.id,
        name: t.name,
        displayName: t.displayName,
        price: t.price,
        totalSupply: t.totalSupply,
        remaining: t.remaining,
        opened: t._count.openings,
      })),
    };

    await setCachedKey(cacheKey, JSON.stringify(stats), 60);
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch capsule stats' });
  }
});

// POST /api/admin/capsules/settings
router.post('/settings', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = CapsuleSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { tierId, ...updates } = parsed.data;

    const tier = await prisma.capsuleTier.findUnique({ where: { id: tierId } });
    if (!tier) {
      res.status(404).json({ success: false, error: 'Capsule tier not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (updates.commonRate !== undefined) updateData.commonRate = updates.commonRate;
    if (updates.rareRate !== undefined) updateData.rareRate = updates.rareRate;
    if (updates.epicRate !== undefined) updateData.epicRate = updates.epicRate;
    if (updates.legendaryRate !== undefined) updateData.legendaryRate = updates.legendaryRate;
    if (updates.mythicRate !== undefined) updateData.mythicRate = updates.mythicRate;
    if (updates.ezziRate !== undefined) updateData.ezziRate = updates.ezziRate;
    if (updates.price !== undefined) updateData.price = updates.price;

    const updated = await prisma.capsuleTier.update({
      where: { id: tierId },
      data: updateData,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'CAPSULE_SETTINGS_UPDATED',
        target: 'CapsuleTier',
        targetId: tierId,
        before: {
          commonRate: tier.commonRate,
          rareRate: tier.rareRate,
          epicRate: tier.epicRate,
          legendaryRate: tier.legendaryRate,
          mythicRate: tier.mythicRate,
          ezziRate: tier.ezziRate,
          price: tier.price,
        },
        after: updateData,
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update capsule settings' });
  }
});

export { router as adminCapsulesRouter };

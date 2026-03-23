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

const PresaleSettingsSchema = z.object({
  presaleActive: z.boolean().optional(),
  presalePhase: z.number().int().min(1).max(4).optional(),
  presalePrice: z.number().positive().max(1).optional(),
  presaleTarget: z.number().positive().optional(),
  presaleEndDate: z.string().datetime().optional().nullable(),
});

const BuyersPaginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  phase: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.string().optional(),
});

const RefundSchema = z.object({
  reason: z.string().min(1).max(500),
});

// GET /api/admin/presale/stats
router.get('/stats', requireAdmin(), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = 'admin:presale:stats';
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const settings = await prisma.siteSettings.findFirst({ where: { id: 'singleton' } });

    const [totalPurchases, byPhase, recentBuyers, totalRevenue] = await Promise.all([
      prisma.presalePurchase.count(),
      prisma.presalePurchase.groupBy({
        by: ['phase'],
        _count: { id: true },
        _sum: { usdAmount: true, ezziAmount: true },
      }),
      prisma.presalePurchase.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.presalePurchase.aggregate({ _sum: { usdAmount: true, ezziAmount: true } }),
    ]);

    const stats = {
      active: settings?.presaleActive ?? false,
      phase: settings?.presalePhase ?? 1,
      price: settings?.presalePrice?.toNumber() ?? 0.015,
      raised: settings?.presaleRaised?.toNumber() ?? 0,
      target: settings?.presaleTarget?.toNumber() ?? 100000,
      endDate: settings?.presaleEndDate,
      totalPurchases,
      recentBuyers24h: recentBuyers,
      totalRevenueUsd: totalRevenue._sum.usdAmount?.toNumber() ?? 0,
      totalEzziSold: totalRevenue._sum.ezziAmount?.toNumber() ?? 0,
      byPhase: byPhase.map((p: { phase: number; _count: { id: number }; _sum: { usdAmount: { toNumber(): number } | null; ezziAmount: { toNumber(): number } | null } }) => ({
        phase: p.phase,
        purchases: p._count.id,
        usdRaised: p._sum.usdAmount?.toNumber() ?? 0,
        ezziSold: p._sum.ezziAmount?.toNumber() ?? 0,
      })),
    };

    await setCachedKey(cacheKey, JSON.stringify(stats), 60);
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch presale stats' });
  }
});

// GET /api/admin/presale/buyers
router.get('/buyers', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = BuyersPaginationSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { page, limit, phase, status } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (phase) where.phase = phase;
    if (status) where.status = status;

    const [purchases, total] = await Promise.all([
      prisma.presalePurchase.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.presalePurchase.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        purchases,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch buyers' });
  }
});

// POST /api/admin/presale/settings
router.post('/settings', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = PresaleSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const before = await prisma.siteSettings.findFirst({ where: { id: 'singleton' } });

    const updateData: Record<string, unknown> = { updatedBy: req.admin!.adminId };
    if (parsed.data.presaleActive !== undefined) updateData.presaleActive = parsed.data.presaleActive;
    if (parsed.data.presalePhase !== undefined) updateData.presalePhase = parsed.data.presalePhase;
    if (parsed.data.presalePrice !== undefined) updateData.presalePrice = parsed.data.presalePrice;
    if (parsed.data.presaleTarget !== undefined) updateData.presaleTarget = parsed.data.presaleTarget;
    if (parsed.data.presaleEndDate !== undefined) {
      updateData.presaleEndDate = parsed.data.presaleEndDate
        ? new Date(parsed.data.presaleEndDate)
        : null;
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...updateData },
      update: updateData,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'PRESALE_SETTINGS_UPDATED',
        target: 'SiteSettings',
        targetId: 'singleton',
        before: before ? {
          presaleActive: before.presaleActive,
          presalePhase: before.presalePhase,
          presalePrice: before.presalePrice?.toNumber(),
        } : null,
        after: parsed.data,
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: settings });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update presale settings' });
  }
});

// POST /api/admin/presale/phase/advance
router.post('/phase/advance', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.siteSettings.findFirst({ where: { id: 'singleton' } });
    const currentPhase = settings?.presalePhase ?? 1;

    if (currentPhase >= 4) {
      res.status(400).json({ success: false, error: 'Already at final phase' });
      return;
    }

    const priceMap: Record<number, number> = {
      1: 0.010,
      2: 0.015,
      3: 0.018,
      4: 0.020,
    };

    const nextPhase = currentPhase + 1;

    const updated = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        presalePhase: nextPhase,
        presalePrice: priceMap[nextPhase] ?? 0.020,
        updatedBy: req.admin!.adminId,
      },
      update: {
        presalePhase: nextPhase,
        presalePrice: priceMap[nextPhase] ?? 0.020,
        updatedBy: req.admin!.adminId,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'PRESALE_PHASE_ADVANCED',
        target: 'SiteSettings',
        targetId: 'singleton',
        before: { phase: currentPhase },
        after: { phase: nextPhase, price: priceMap[nextPhase] },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { phase: nextPhase, price: priceMap[nextPhase], settings: updated } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to advance presale phase' });
  }
});

// POST /api/admin/presale/buyer/:id/refund
router.post('/buyer/:id/refund', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = RefundSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const purchase = await prisma.presalePurchase.findUnique({
      where: { id: req.params.id },
    });

    if (!purchase) {
      res.status(404).json({ success: false, error: 'Purchase not found' });
      return;
    }

    if (purchase.status === 'refunded') {
      res.status(400).json({ success: false, error: 'Already refunded' });
      return;
    }

    const updated = await prisma.presalePurchase.update({
      where: { id: req.params.id },
      data: { status: 'refunded' },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'PRESALE_REFUND',
        target: 'PresalePurchase',
        targetId: req.params.id,
        before: { status: purchase.status },
        after: { status: 'refunded', reason: parsed.data.reason },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: 'Purchase refunded', purchase: updated } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to process refund' });
  }
});

export { router as adminPresaleRouter };

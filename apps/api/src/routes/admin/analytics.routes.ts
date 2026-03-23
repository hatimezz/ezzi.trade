import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireAdmin, type AdminRequest } from '../../middleware/admin.middleware';
import { getCachedKey, setCachedKey } from '../../lib/redis';

export const runtime = 'nodejs';

const router = Router();

const PeriodSchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});

function getStartDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

// GET /api/admin/analytics/revenue
router.get('/revenue', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = PeriodSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { period } = parsed.data;
    const cacheKey = `admin:analytics:revenue:${period}`;
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const startDate = getStartDate(period);
    const where = startDate ? { createdAt: { gte: startDate } } : {};

    const [presaleRevenue, capsuleRevenue, marketplaceVolume, presaleByDay] = await Promise.all([
      prisma.presalePurchase.aggregate({
        where,
        _sum: { usdAmount: true },
        _count: { id: true },
      }),
      prisma.capsuleOpening.count({ where }),
      prisma.marketplaceListing.aggregate({
        where: { ...where, status: 'sold' },
        _sum: { price: true },
        _count: { id: true },
      }),
      prisma.presalePurchase.groupBy({
        by: ['createdAt'],
        where,
        _sum: { usdAmount: true },
        _count: { id: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const dailyData: Record<string, { revenue: number; count: number }> = {};
    for (const entry of presaleByDay) {
      const day = entry.createdAt.toISOString().split('T')[0];
      if (!dailyData[day]) {
        dailyData[day] = { revenue: 0, count: 0 };
      }
      dailyData[day].revenue += entry._sum.usdAmount?.toNumber() ?? 0;
      dailyData[day].count += entry._count.id;
    }

    const data = {
      presale: {
        totalUsd: presaleRevenue._sum.usdAmount?.toNumber() ?? 0,
        purchases: presaleRevenue._count.id,
      },
      capsules: {
        openings: capsuleRevenue,
      },
      marketplace: {
        volumeSol: marketplaceVolume._sum.price ?? 0,
        sales: marketplaceVolume._count.id,
      },
      dailyPresale: Object.entries(dailyData).map(([date, vals]) => ({
        date,
        revenue: vals.revenue,
        count: vals.count,
      })),
    };

    await setCachedKey(cacheKey, JSON.stringify(data), 300);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch revenue analytics' });
  }
});

// GET /api/admin/analytics/users
router.get('/users', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = PeriodSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { period } = parsed.data;
    const cacheKey = `admin:analytics:users:${period}`;
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const startDate = getStartDate(period);
    const where = startDate ? { createdAt: { gte: startDate } } : {};

    const [totalUsers, newUsers, byTier, byCountry, registrationsByDay] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { ...where, deletedAt: null } }),
      prisma.user.groupBy({
        by: ['tier'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      prisma.user.groupBy({
        by: ['country'],
        where: { deletedAt: null },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      prisma.user.groupBy({
        by: ['createdAt'],
        where: { ...where, deletedAt: null },
        _count: { id: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const dailyRegistrations: Record<string, number> = {};
    for (const entry of registrationsByDay) {
      const day = entry.createdAt.toISOString().split('T')[0];
      dailyRegistrations[day] = (dailyRegistrations[day] || 0) + entry._count.id;
    }

    const data = {
      total: totalUsers,
      newInPeriod: newUsers,
      byTier: byTier.map((t: { tier: string; _count: { id: number } }) => ({ tier: t.tier, count: t._count.id })),
      byCountry: byCountry.map((c: { country: string | null; _count: { id: number } }) => ({ country: c.country || 'Unknown', count: c._count.id })),
      dailyRegistrations: Object.entries(dailyRegistrations).map(([date, count]) => ({
        date,
        count,
      })),
    };

    await setCachedKey(cacheKey, JSON.stringify(data), 300);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch user analytics' });
  }
});

// GET /api/admin/analytics/transactions
router.get('/transactions', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = PeriodSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { period } = parsed.data;
    const cacheKey = `admin:analytics:transactions:${period}`;
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const startDate = getStartDate(period);
    const where = startDate ? { createdAt: { gte: startDate } } : {};

    const [total, byType, byStatus, recentTxs] = await Promise.all([
      prisma.processedTx.count({ where }),
      prisma.processedTx.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.processedTx.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.processedTx.findMany({
        where,
        orderBy: { processedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          txHash: true,
          type: true,
          status: true,
          amount: true,
          token: true,
          processedAt: true,
        },
      }),
    ]);

    const data = {
      total,
      byType: byType.map((t: { type: string; _count: { id: number }; _sum: { amount: number | null } }) => ({
        type: t.type,
        count: t._count.id,
        totalAmount: t._sum.amount ?? 0,
      })),
      byStatus: byStatus.map((s: { status: string; _count: { id: number } }) => ({
        status: s.status,
        count: s._count.id,
      })),
      recent: recentTxs,
    };

    await setCachedKey(cacheKey, JSON.stringify(data), 300);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch transaction analytics' });
  }
});

export { router as adminAnalyticsRouter };

import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireAdmin, requireAdminWrite, type AdminRequest } from '../../middleware/admin.middleware';
import { getCachedKey, setCachedKey } from '../../lib/redis';

export const runtime = 'nodejs';

const router = Router();

function hashIp(ip: string | undefined): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
}

const ListingsFilterSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  status: z.enum(['active', 'sold', 'cancelled', 'removed']).optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
});

const RemoveListingSchema = z.object({
  reason: z.string().min(1).max(500),
});

// GET /api/admin/marketplace/listings
router.get('/listings', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = ListingsFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { page, limit, status, minPrice, maxPrice } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) (where.price as Record<string, number>).gte = minPrice;
      if (maxPrice !== undefined) (where.price as Record<string, number>).lte = maxPrice;
    }

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        include: {
          nft: {
            include: {
              warrior: { select: { name: true, displayName: true, rarity: true, zone: true, imageUrl: true } },
            },
          },
          seller: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.marketplaceListing.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        listings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch listings' });
  }
});

// GET /api/admin/marketplace/stats
router.get('/stats', requireAdmin(), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = 'admin:marketplace:stats';
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const [total, active, sold, totalVolume, avgPrice] = await Promise.all([
      prisma.marketplaceListing.count(),
      prisma.marketplaceListing.count({ where: { status: 'active' } }),
      prisma.marketplaceListing.count({ where: { status: 'sold' } }),
      prisma.marketplaceListing.aggregate({
        where: { status: 'sold' },
        _sum: { price: true },
      }),
      prisma.marketplaceListing.aggregate({
        where: { status: 'active' },
        _avg: { price: true },
      }),
    ]);

    const stats = {
      total,
      active,
      sold,
      totalVolume: totalVolume._sum.price ?? 0,
      averagePrice: avgPrice._avg.price ?? 0,
    };

    await setCachedKey(cacheKey, JSON.stringify(stats), 120);
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch marketplace stats' });
  }
});

// POST /api/admin/marketplace/listing/:id/remove
router.post('/listing/:id/remove', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = RemoveListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } });
    if (!listing) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }

    if (listing.status !== 'active') {
      res.status(400).json({ success: false, error: 'Listing is not active' });
      return;
    }

    const updated = await prisma.marketplaceListing.update({
      where: { id: req.params.id },
      data: { status: 'removed' },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'LISTING_REMOVED',
        target: 'MarketplaceListing',
        targetId: req.params.id,
        before: { status: listing.status },
        after: { status: 'removed', reason: parsed.data.reason },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: 'Listing removed', listing: updated } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to remove listing' });
  }
});

export { router as adminMarketplaceRouter };

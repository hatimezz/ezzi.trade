import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/db';
import { requireAdmin, type AdminRequest } from '../../middleware/admin.middleware';
import redis, { getCachedKey, setCachedKey } from '../../lib/redis';

export const runtime = 'nodejs';

const router = Router();

// GET /api/admin/stats
router.get('/', requireAdmin(), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = 'admin:stats:overview';
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersToday,
      activeUsers24h,
      totalNfts,
      mintedNfts,
      totalCapsuleOpenings,
      totalListings,
      activeListings,
      totalWaitlist,
      totalPresalePurchases,
      presaleRevenue,
      totalMiningEarned,
      totalPartnerApps,
      pendingPartnerApps,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart }, deletedAt: null } }),
      prisma.user.count({ where: { lastLoginAt: { gte: yesterday }, deletedAt: null } }),
      prisma.nFT.count(),
      prisma.nFT.count({ where: { mintedAt: { not: null } } }),
      prisma.capsuleOpening.count(),
      prisma.marketplaceListing.count(),
      prisma.marketplaceListing.count({ where: { status: 'active' } }),
      prisma.waitlistEntry.count(),
      prisma.presalePurchase.count(),
      prisma.presalePurchase.aggregate({ _sum: { usdAmount: true } }),
      prisma.userBalance.aggregate({ _sum: { totalMined: true } }),
      prisma.partnerApplication.count(),
      prisma.partnerApplication.count({ where: { status: 'PENDING' } }),
    ]);

    const siteSettings = await prisma.siteSettings.findFirst({
      where: { id: 'singleton' },
    });

    const stats = {
      users: {
        total: totalUsers,
        today: usersToday,
        active24h: activeUsers24h,
      },
      revenue: {
        presaleUsd: presaleRevenue._sum.usdAmount?.toNumber() ?? 0,
        presalePurchases: totalPresalePurchases,
      },
      nfts: {
        total: totalNfts,
        minted: mintedNfts,
      },
      capsules: {
        openings: totalCapsuleOpenings,
      },
      marketplace: {
        totalListings,
        activeListings,
      },
      mining: {
        totalEarned: totalMiningEarned._sum.totalMined ?? 0,
      },
      partners: {
        total: totalPartnerApps,
        pending: pendingPartnerApps,
      },
      waitlist: {
        total: totalWaitlist,
      },
      presale: {
        active: siteSettings?.presaleActive ?? false,
        phase: siteSettings?.presalePhase ?? 1,
        price: siteSettings?.presalePrice?.toNumber() ?? 0.015,
        raised: siteSettings?.presaleRaised?.toNumber() ?? 0,
        target: siteSettings?.presaleTarget?.toNumber() ?? 100000,
      },
      site: {
        maintenanceMode: siteSettings?.maintenanceMode ?? false,
        registrationOpen: siteSettings?.registrationOpen ?? true,
      },
    };

    await setCachedKey(cacheKey, JSON.stringify(stats), 60);

    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch admin stats' });
  }
});

export { router as adminStatsRouter };

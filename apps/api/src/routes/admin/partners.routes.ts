import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireAdmin, requireAdminWrite, requireSuperAdmin, type AdminRequest } from '../../middleware/admin.middleware';
import { getCachedKey, setCachedKey } from '../../lib/redis';

export const runtime = 'nodejs';

const router = Router();

function hashIp(ip: string | undefined): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
}

const ApplicationsFilterSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  type: z.enum(['INFLUENCER', 'AFFILIATE']).optional(),
});

const RejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

const PayoutsFilterSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  status: z.enum(['REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
});

const ProcessBatchSchema = z.object({
  withdrawalIds: z.array(z.string().min(1)).min(1).max(50),
});

// GET /api/admin/partners/applications
router.get('/applications', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = ApplicationsFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { page, limit, status, type } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [applications, total] = await Promise.all([
      prisma.partnerApplication.findMany({
        where,
        include: {
          influencer: { select: { id: true, tier: true, totalSales: true, totalEarned: true } },
          affiliate: { select: { id: true, tier: true, totalSales: true, totalEarned: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.partnerApplication.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
});

// POST /api/admin/partners/approve/:id
router.post('/approve/:id', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const application = await prisma.partnerApplication.findUnique({
      where: { id: req.params.id },
    });

    if (!application) {
      res.status(404).json({ success: false, error: 'Application not found' });
      return;
    }

    if (application.status !== 'PENDING') {
      res.status(400).json({ success: false, error: `Application already ${application.status.toLowerCase()}` });
      return;
    }

    await prisma.partnerApplication.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });

    if (application.type === 'INFLUENCER') {
      await prisma.influencer.create({
        data: {
          applicationId: application.id,
          twitterHandle: application.twitterHandle || '',
          tier: application.estimatedTier || 'NANO',
          walletAddress: application.walletAddress,
        },
      });
    } else {
      await prisma.affiliate.create({
        data: {
          applicationId: application.id,
          walletAddress: application.walletAddress,
          tier: 'STARTER',
        },
      });
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'PARTNER_APPROVED',
        target: 'PartnerApplication',
        targetId: req.params.id,
        after: { type: application.type },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: 'Application approved' } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to approve application' });
  }
});

// POST /api/admin/partners/reject/:id
router.post('/reject/:id', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = RejectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const application = await prisma.partnerApplication.findUnique({
      where: { id: req.params.id },
    });

    if (!application) {
      res.status(404).json({ success: false, error: 'Application not found' });
      return;
    }

    if (application.status !== 'PENDING') {
      res.status(400).json({ success: false, error: `Application already ${application.status.toLowerCase()}` });
      return;
    }

    await prisma.partnerApplication.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: parsed.data.reason,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'PARTNER_REJECTED',
        target: 'PartnerApplication',
        targetId: req.params.id,
        after: { reason: parsed.data.reason },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: 'Application rejected' } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to reject application' });
  }
});

// GET /api/admin/partners/payouts
router.get('/payouts', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = PayoutsFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { page, limit, status } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          influencer: {
            select: { id: true, twitterHandle: true },
            include: { application: { select: { email: true } } },
          },
          affiliate: {
            select: { id: true },
            include: { application: { select: { email: true } } },
          },
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withdrawal.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        withdrawals,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch payouts' });
  }
});

// POST /api/admin/partners/payouts/process-batch
router.post('/payouts/process-batch', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = ProcessBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { withdrawalIds } = parsed.data;

    const result = await prisma.withdrawal.updateMany({
      where: {
        id: { in: withdrawalIds },
        status: 'REQUESTED',
      },
      data: {
        status: 'PROCESSING',
        processedAt: new Date(),
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'PAYOUTS_BATCH_PROCESSED',
        target: 'Withdrawal',
        after: { count: result.count, ids: withdrawalIds },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({
      success: true,
      data: { message: `Processing ${result.count} payouts`, count: result.count },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to process payouts' });
  }
});

// GET /api/admin/partners/stats
router.get('/stats', requireAdmin(), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = 'admin:partner:stats';
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      totalInfluencers,
      totalAffiliates,
      totalCommissions,
      pendingPayouts,
      totalClicks,
    ] = await Promise.all([
      prisma.partnerApplication.count(),
      prisma.partnerApplication.count({ where: { status: 'PENDING' } }),
      prisma.partnerApplication.count({ where: { status: 'APPROVED' } }),
      prisma.influencer.count(),
      prisma.affiliate.count(),
      prisma.commission.aggregate({ _sum: { ezziAmount: true } }),
      prisma.withdrawal.count({ where: { status: 'REQUESTED' } }),
      prisma.referralClick.count(),
    ]);

    const stats = {
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        approved: approvedApplications,
      },
      influencers: totalInfluencers,
      affiliates: totalAffiliates,
      totalCommissionsEzzi: totalCommissions._sum.ezziAmount?.toNumber() ?? 0,
      pendingPayouts,
      totalClicks,
    };

    await setCachedKey(cacheKey, JSON.stringify(stats), 120);
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch partner stats' });
  }
});

export { router as adminPartnersRouter };

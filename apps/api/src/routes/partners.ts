import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { standardRateLimit, strictRateLimit } from '../middleware/rate-limit';
import { commissionService } from '../services/commission.service';
import { prisma } from '../lib/db';

export const runtime = 'nodejs';

const router = Router();

function hashIp(ip: string | undefined): string {
  return crypto.createHash('sha256').update(ip ?? 'unknown').digest('hex');
}

// ─── Validation Schemas ─────────────────────────────────────────────────────

const ApplyInfluencerSchema = z.object({
  email: z.string().email().optional(),
  walletAddress: z.string().min(32).max(44),
  type: z.literal('INFLUENCER'),
  twitterHandle: z.string().min(1).max(50),
  followersCount: z.number().int().positive(),
  niches: z.array(z.string().min(1)).min(1).max(8),
  language: z.string().min(1).max(30).default('English'),
  bestTweetUrl: z.string().url().optional(),
  whyApply: z.string().max(500).optional(),
  estimatedTier: z.enum(['NANO', 'MICRO', 'MID', 'MACRO']).optional(),
});

const ApplyAffiliateSchema = z.object({
  email: z.string().email().optional(),
  walletAddress: z.string().min(32).max(44),
  type: z.literal('AFFILIATE'),
  promoteChannel: z.string().min(1).max(500).optional(),
});

const ApplySchema = z.discriminatedUnion('type', [
  ApplyInfluencerSchema,
  ApplyAffiliateSchema,
]);

const TrackClickSchema = z.object({
  refCode: z.string().min(1).max(100),
  sessionId: z.string().optional(),
});

const DashboardQuerySchema = z.object({
  refCode: z.string().min(1).max(100),
});

const WithdrawSchema = z.object({
  refCode: z.string().min(1).max(100),
  walletAddress: z.string().min(32).max(44),
  ezziAmount: z.number().positive().min(100),
});

const StatusQuerySchema = z.object({
  email: z.string().email(),
});

// ─── POST /api/partners/apply ────────────────────────────────────────────────

router.post(
  '/apply',
  strictRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = ApplySchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: result.error.flatten().fieldErrors,
        });
        return;
      }

      const data = result.data;

      if (data.email) {
        const existingEmail = await prisma.partnerApplication.findFirst({
          where: { email: data.email },
        });
        if (existingEmail) {
          res
            .status(409)
            .json({ success: false, error: 'Application already exists for this email' });
          return;
        }
      }

      const existingWallet = await prisma.partnerApplication.findFirst({
        where: { walletAddress: data.walletAddress },
      });
      if (existingWallet) {
        res
          .status(409)
          .json({ success: false, error: 'Application already exists for this wallet' });
        return;
      }

      let application;

      if (data.type === 'INFLUENCER') {
        application = await prisma.partnerApplication.create({
          data: {
            email: data.email ?? null,
            walletAddress: data.walletAddress,
            type: 'INFLUENCER',
            twitterHandle: data.twitterHandle,
            followersCount: data.followersCount,
            niches: data.niches,
            language: data.language,
            bestTweetUrl: data.bestTweetUrl ?? null,
            whyApply: data.whyApply ?? null,
            estimatedTier: data.estimatedTier ?? null,
          },
          select: { id: true, type: true, status: true, refCode: true, createdAt: true },
        });
      } else {
        application = await prisma.partnerApplication.create({
          data: {
            email: data.email ?? null,
            walletAddress: data.walletAddress,
            type: 'AFFILIATE',
            promoteChannel: data.promoteChannel ?? null,
          },
          select: { id: true, type: true, status: true, refCode: true, createdAt: true },
        });
      }

      res.status(201).json({ success: true, data: application });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to submit application' });
    }
  }
);

// ─── GET /api/partners/status?email=xxx ─────────────────────────────────────

router.get(
  '/status',
  standardRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = StatusQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Invalid email' });
        return;
      }

      const application = await commissionService.getApplicationByEmail(parsed.data.email);
      if (!application) {
        res.status(404).json({ success: false, error: 'No application found for this email' });
        return;
      }

      res.json({ success: true, data: application });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch status' });
    }
  }
);

// ─── POST /api/partners/track ────────────────────────────────────────────────

router.post('/track', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = TrackClickSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input' });
      return;
    }

    await commissionService.recordReferralClick({
      refCode: parsed.data.refCode,
      ipHash: hashIp(req.ip),
      userAgent: req.headers['user-agent'],
      sessionId: parsed.data.sessionId,
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to track click' });
  }
});

// ─── GET /api/partners/dashboard?refCode=xxx ─────────────────────────────────

router.get(
  '/dashboard',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = DashboardQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'refCode is required' });
        return;
      }

      const dashboard = await commissionService.getPartnerDashboard(parsed.data.refCode);
      if (!dashboard) {
        res.status(404).json({ success: false, error: 'Partner not found' });
        return;
      }

      res.json({ success: true, data: dashboard });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
    }
  }
);

// ─── POST /api/partners/withdraw ─────────────────────────────────────────────

router.post(
  '/withdraw',
  standardRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = WithdrawSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      await commissionService.requestWithdrawal(parsed.data);

      res.json({
        success: true,
        data: { message: 'Withdrawal request submitted. Processing within 3-5 business days.' },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to request withdrawal';
      res.status(400).json({ success: false, error: msg });
    }
  }
);

export { router as partnerRouter };

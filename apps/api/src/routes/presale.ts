import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { getCachedKey, setCachedKey, deleteCachedKey } from '../lib/redis';
import { getIO } from '../lib/socket';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

export const runtime = 'nodejs';

const router = Router();

// ============================================
// PHASE CONFIGURATION
// ============================================

const PHASES = [
  { phase: 1, price: 0.012, maxTokens: 5_000_000, label: 'Early Believers' },
  { phase: 2, price: 0.015, maxTokens: 3_000_000, label: 'Momentum' },
  { phase: 3, price: 0.018, maxTokens: 2_000_000, label: 'Final Call' },
];

const BELIEVER_TIERS = [
  { name: 'Spark', minUsd: 50, maxUsd: 499, color: '#00d4ff' },
  { name: 'Flame', minUsd: 500, maxUsd: 4999, color: '#ffd700' },
  { name: 'Genesis', minUsd: 5000, maxUsd: Infinity, color: '#ff00ff' },
];

function getBelieverTier(totalUsd: number): { name: string; color: string } | null {
  if (totalUsd < 50) return null;
  return BELIEVER_TIERS.find((t) => totalUsd >= t.minUsd && totalUsd <= t.maxUsd) ?? null;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const PurchaseSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  txHash: z.string().min(64).max(128),
  solAmount: z.number().positive().max(10000),
  refCode: z.string().max(50).optional(),
});

// ============================================
// GET /api/presale — public presale status
// ============================================

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = 'presale:status';
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const settings = await prisma.siteSettings.findFirst({
      where: { id: 'singleton' },
    });

    const phaseStats = await prisma.presalePurchase.groupBy({
      by: ['phase'],
      where: { status: 'confirmed' },
      _sum: { ezziAmount: true, usdAmount: true },
      _count: { id: true },
    });

    const totalAgg = await prisma.presalePurchase.aggregate({
      where: { status: 'confirmed' },
      _sum: { ezziAmount: true, usdAmount: true },
      _count: { id: true },
    });

    const totalTokensSold = totalAgg._sum.ezziAmount?.toNumber() ?? 0;
    const burnedTokens = totalTokensSold * 0.02;

    const phases = PHASES.map((p) => {
      const stats = phaseStats.find(
        (s: { phase: number }) => s.phase === p.phase,
      );
      const tokensSold = stats?._sum.ezziAmount?.toNumber() ?? 0;
      return {
        phase: p.phase,
        price: p.price,
        maxTokens: p.maxTokens,
        label: p.label,
        tokensSold,
        usdRaised: stats?._sum.usdAmount?.toNumber() ?? 0,
        buyers: stats?._count.id ?? 0,
        soldOut: tokensSold >= p.maxTokens,
        percentFilled: Math.min((tokensSold / p.maxTokens) * 100, 100),
      };
    });

    const data = {
      active: settings?.presaleActive ?? false,
      currentPhase: settings?.presalePhase ?? 1,
      phases,
      raised: settings?.presaleRaised?.toNumber() ?? 0,
      target: settings?.presaleTarget?.toNumber() ?? 100000,
      endDate: settings?.presaleEndDate?.toISOString() ?? null,
      solPriceUsd: settings?.solPriceUsd?.toNumber() ?? 100,
      burnedTokens,
      totalTokensSold,
      totalUsdRaised: totalAgg._sum.usdAmount?.toNumber() ?? 0,
      totalBuyers: totalAgg._count.id,
      believerTiers: BELIEVER_TIERS.map((t) => ({
        name: t.name,
        minUsd: t.minUsd,
        maxUsd: t.maxUsd === Infinity ? null : t.maxUsd,
        color: t.color,
      })),
    };

    await setCachedKey(cacheKey, JSON.stringify(data), 15);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch presale status' });
  }
});

// ============================================
// POST /api/presale/purchase — authenticated
// ============================================

router.post(
  '/purchase',
  authMiddleware as unknown as (req: Request, res: Response, next: () => void) => void,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const parsed = PurchaseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { walletAddress, txHash, solAmount, refCode } = parsed.data;
      const userId = authReq.user!.id;

      const existingTx = await prisma.presalePurchase.findUnique({
        where: { txHash },
      });
      if (existingTx) {
        res.status(409).json({ success: false, error: 'Transaction already processed' });
        return;
      }

      const settings = await prisma.siteSettings.findFirst({
        where: { id: 'singleton' },
      });

      if (!settings?.presaleActive) {
        res.status(400).json({ success: false, error: 'Presale is not active' });
        return;
      }

      const currentPhase = settings.presalePhase;
      const phaseConfig = PHASES.find((p) => p.phase === currentPhase);
      if (!phaseConfig) {
        res.status(400).json({ success: false, error: 'Invalid presale phase' });
        return;
      }

      const solPriceUsd = settings.solPriceUsd.toNumber();
      const usdAmount = solAmount * solPriceUsd;
      const pricePerEzzi = phaseConfig.price;
      const ezziAmount = usdAmount / pricePerEzzi;

      const phaseSold = await prisma.presalePurchase.aggregate({
        where: { phase: currentPhase, status: 'confirmed' },
        _sum: { ezziAmount: true },
      });
      const alreadySold = phaseSold._sum.ezziAmount?.toNumber() ?? 0;

      if (alreadySold + ezziAmount > phaseConfig.maxTokens) {
        const remaining = Math.max(0, phaseConfig.maxTokens - alreadySold);
        res.status(400).json({
          success: false,
          error: `Phase ${currentPhase} capacity exceeded. Remaining: ${Math.floor(remaining).toLocaleString()} EZZI`,
        });
        return;
      }

      const userTotal = await prisma.presalePurchase.aggregate({
        where: { userId, status: 'confirmed' },
        _sum: { usdAmount: true },
      });
      const totalSpend = (userTotal._sum.usdAmount?.toNumber() ?? 0) + usdAmount;
      const tier = getBelieverTier(totalSpend);

      const purchase = await prisma.presalePurchase.create({
        data: {
          userId,
          walletAddress,
          ezziAmount,
          usdAmount,
          solAmount,
          phase: currentPhase,
          pricePerEzzi,
          status: 'confirmed',
          txHash,
          refCode: refCode ?? null,
        },
      });

      await prisma.siteSettings.update({
        where: { id: 'singleton' },
        data: { presaleRaised: { increment: usdAmount } },
      });

      await deleteCachedKey('presale:status');
      await deleteCachedKey('presale:leaderboard');

      const io = getIO();
      const burnedTokens = ezziAmount * 0.02;
      const shortWallet = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

      io.to('public-feed').emit('presale-burn', {
        burnedTokens,
        totalRaised: settings.presaleRaised.toNumber() + usdAmount,
        buyer: shortWallet,
        ezziAmount,
        phase: currentPhase,
        timestamp: new Date().toISOString(),
      });

      io.to('public-feed').emit('live-event', {
        type: 'presale_purchase',
        message: `${shortWallet} bought ${Math.floor(ezziAmount).toLocaleString()} EZZI`,
        walletAddress,
        timestamp: new Date(),
        metadata: { phase: currentPhase, usdAmount, tier: tier?.name ?? null },
      });

      res.json({
        success: true,
        data: {
          id: purchase.id,
          ezziAmount: Number(purchase.ezziAmount),
          usdAmount: Number(purchase.usdAmount),
          solAmount: Number(purchase.solAmount),
          phase: purchase.phase,
          pricePerEzzi: Number(purchase.pricePerEzzi),
          txHash: purchase.txHash,
          tier: tier?.name ?? null,
        },
      });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to process purchase' });
    }
  },
);

// ============================================
// GET /api/presale/leaderboard — top believers
// ============================================

router.get('/leaderboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = 'presale:leaderboard';
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const topBuyers = await prisma.presalePurchase.groupBy({
      by: ['walletAddress'],
      where: { status: 'confirmed' },
      _sum: { usdAmount: true, ezziAmount: true },
      _count: { id: true },
      orderBy: { _sum: { usdAmount: 'desc' } },
      take: 20,
    });

    const leaderboard = topBuyers.map(
      (b: {
        walletAddress: string;
        _sum: {
          usdAmount: { toNumber(): number } | null;
          ezziAmount: { toNumber(): number } | null;
        };
        _count: { id: number };
      }) => {
        const totalUsd = b._sum.usdAmount?.toNumber() ?? 0;
        const tier = getBelieverTier(totalUsd);
        return {
          wallet: `${b.walletAddress.slice(0, 4)}...${b.walletAddress.slice(-4)}`,
          totalUsd,
          totalEzzi: b._sum.ezziAmount?.toNumber() ?? 0,
          purchases: b._count.id,
          tier: tier?.name ?? 'Newcomer',
          tierColor: tier?.color ?? '#4a5568',
        };
      },
    );

    await setCachedKey(cacheKey, JSON.stringify(leaderboard), 60);
    res.json({ success: true, data: leaderboard });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

export { router as presaleRouter };

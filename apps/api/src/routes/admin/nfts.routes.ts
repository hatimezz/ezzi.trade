import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireAdmin, requireSuperAdmin, requireAdminWrite, type AdminRequest } from '../../middleware/admin.middleware';
import { getCachedKey, setCachedKey } from '../../lib/redis';

export const runtime = 'nodejs';

const router = Router();

function hashIp(ip: string | undefined): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
}

const NFTFilterSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  rarity: z.string().optional(),
  zone: z.string().optional(),
  warrior: z.string().optional(),
  isFlagged: z.string().transform((v) => v === 'true').optional(),
  isStaked: z.string().transform((v) => v === 'true').optional(),
  ownerId: z.string().optional(),
});

const FlagSchema = z.object({
  reason: z.string().min(1).max(500),
});

const MintBatchSchema = z.object({
  warriorId: z.string().min(1),
  count: z.number().int().positive().max(100),
});

// GET /api/admin/nfts
router.get('/', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = NFTFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { page, limit, rarity, zone, warrior, isFlagged, isStaked, ownerId } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (rarity) where.warrior = { ...((where.warrior as object) || {}), rarity };
    if (zone) where.warrior = { ...((where.warrior as object) || {}), zone };
    if (warrior) where.warriorId = warrior;
    if (isFlagged !== undefined) where.isFlagged = isFlagged;
    if (isStaked !== undefined) where.isStaked = isStaked;
    if (ownerId) where.ownerId = ownerId;

    const [nfts, total] = await Promise.all([
      prisma.nFT.findMany({
        where,
        include: {
          warrior: { select: { name: true, displayName: true, rarity: true, zone: true, imageUrl: true } },
          owner: { select: { id: true, username: true, email: true } },
        },
        orderBy: { mintedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.nFT.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        nfts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch NFTs' });
  }
});

// GET /api/admin/nfts/stats
router.get('/stats', requireAdmin(), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = 'admin:nft:stats';
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const [total, minted, staked, flagged, byRarity, byWarrior] = await Promise.all([
      prisma.nFT.count(),
      prisma.nFT.count({ where: { mintedAt: { not: null } } }),
      prisma.nFT.count({ where: { isStaked: true } }),
      prisma.nFT.count({ where: { isFlagged: true } }),
      prisma.warrior.findMany({
        select: {
          rarity: true,
          _count: { select: { nfts: true } },
        },
      }),
      prisma.warrior.findMany({
        select: {
          name: true,
          displayName: true,
          rarity: true,
          totalSupply: true,
          _count: { select: { nfts: true } },
        },
      }),
    ]);

    const rarityMap: Record<string, number> = {};
    for (const r of byRarity) {
      rarityMap[r.rarity] = (rarityMap[r.rarity] || 0) + r._count.nfts;
    }

    const stats = {
      total,
      minted,
      staked,
      flagged,
      byRarity: rarityMap,
      byWarrior: byWarrior.map((w: { name: string; displayName: string; rarity: string; totalSupply: number; _count: { nfts: number } }) => ({
        name: w.name,
        displayName: w.displayName,
        rarity: w.rarity,
        totalSupply: w.totalSupply,
        minted: w._count.nfts,
      })),
    };

    await setCachedKey(cacheKey, JSON.stringify(stats), 120);
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch NFT stats' });
  }
});

// POST /api/admin/nfts/:id/flag
router.post('/:id/flag', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = FlagSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const nft = await prisma.nFT.findUnique({ where: { id: req.params.id } });
    if (!nft) {
      res.status(404).json({ success: false, error: 'NFT not found' });
      return;
    }

    const updated = await prisma.nFT.update({
      where: { id: req.params.id },
      data: {
        isFlagged: !nft.isFlagged,
        flagReason: nft.isFlagged ? null : parsed.data.reason,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: nft.isFlagged ? 'NFT_UNFLAGGED' : 'NFT_FLAGGED',
        target: 'NFT',
        targetId: req.params.id,
        after: { isFlagged: updated.isFlagged, reason: parsed.data.reason },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: updated.isFlagged ? 'NFT flagged' : 'NFT unflagged', nft: updated } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to flag NFT' });
  }
});

// POST /api/admin/nfts/mint-batch
router.post('/mint-batch', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = MintBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { warriorId, count } = parsed.data;

    const warrior = await prisma.warrior.findUnique({ where: { id: warriorId } });
    if (!warrior) {
      res.status(404).json({ success: false, error: 'Warrior not found' });
      return;
    }

    const existingCount = await prisma.nFT.count({ where: { warriorId } });
    if (existingCount + count > warrior.totalSupply) {
      res.status(400).json({
        success: false,
        error: `Would exceed total supply. Existing: ${existingCount}, Requested: ${count}, Max: ${warrior.totalSupply}`,
      });
      return;
    }

    const nfts = [];
    for (let i = 0; i < count; i++) {
      nfts.push({
        warriorId,
        editionNumber: existingCount + i + 1,
        mintedAt: new Date(),
        mintedBy: req.admin!.adminId,
      });
    }

    const result = await prisma.nFT.createMany({ data: nfts });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'NFT_BATCH_MINTED',
        target: 'Warrior',
        targetId: warriorId,
        after: { warriorName: warrior.name, count: result.count },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({
      success: true,
      data: { message: `Minted ${result.count} NFTs for ${warrior.displayName}`, count: result.count },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to mint NFTs' });
  }
});

export { router as adminNftsRouter };

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

const WaitlistFilterSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  search: z.string().optional(),
  source: z.string().optional(),
});

// GET /api/admin/waitlist
router.get('/', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = WaitlistFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { page, limit, search, source } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    if (source) where.source = source;

    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.waitlistEntry.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        entries,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch waitlist' });
  }
});

// GET /api/admin/waitlist/stats
router.get('/stats', requireAdmin(), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = 'admin:waitlist:stats';
    const cached = await getCachedKey(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const [total, today, bySources] = await Promise.all([
      prisma.waitlistEntry.count(),
      prisma.waitlistEntry.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.waitlistEntry.groupBy({
        by: ['source'],
        _count: { id: true },
      }),
    ]);

    const sourceBreakdown: Record<string, number> = {};
    for (const s of bySources) {
      sourceBreakdown[s.source || 'unknown'] = s._count.id;
    }

    const stats = { total, today, bySource: sourceBreakdown };

    await setCachedKey(cacheKey, JSON.stringify(stats), 120);
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch waitlist stats' });
  }
});

// POST /api/admin/waitlist/export
router.post('/export', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const entries = await prisma.waitlistEntry.findMany({
      select: { email: true, country: true, source: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const csvHeader = 'email,country,source,date\n';
    const csvRows = entries
      .map(
        (e: { email: string; country: string | null; source: string | null; createdAt: Date }) =>
          `${e.email},${e.country || ''},${e.source || ''},${e.createdAt.toISOString()}`
      )
      .join('\n');

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'WAITLIST_EXPORTED',
        target: 'WaitlistEntry',
        after: { count: entries.length },
        ipHash: hashIp(req.ip),
      },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=waitlist-export.csv');
    res.send(csvHeader + csvRows);
  } catch {
    res.status(500).json({ success: false, error: 'Failed to export waitlist' });
  }
});

// DELETE /api/admin/waitlist/:id
router.delete('/:id', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const entry = await prisma.waitlistEntry.findUnique({ where: { id: req.params.id } });
    if (!entry) {
      res.status(404).json({ success: false, error: 'Entry not found' });
      return;
    }

    await prisma.waitlistEntry.delete({ where: { id: req.params.id } });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'WAITLIST_ENTRY_DELETED',
        target: 'WaitlistEntry',
        targetId: req.params.id,
        before: { email: entry.email },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: 'Entry deleted' } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete entry' });
  }
});

export { router as adminWaitlistRouter };

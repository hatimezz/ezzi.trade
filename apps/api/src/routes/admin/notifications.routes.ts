import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireAdminWrite, requireAdmin, type AdminRequest } from '../../middleware/admin.middleware';

export const runtime = 'nodejs';

const router = Router();

function hashIp(ip: string | undefined): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
}

const BroadcastSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  type: z.string().min(1).max(50).default('broadcast'),
  link: z.string().url().optional(),
  targetTier: z.string().optional(),
});

const HistoryFilterSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  type: z.string().optional(),
});

// POST /api/admin/notifications/broadcast
router.post('/broadcast', requireAdminWrite(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = BroadcastSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { title, body, type, link, targetTier } = parsed.data;

    const where: Record<string, unknown> = { isActive: true, deletedAt: null };
    if (targetTier) where.tier = targetTier;

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (users.length === 0) {
      res.status(400).json({ success: false, error: 'No users match the target criteria' });
      return;
    }

    const notifications = users.map((u: { id: string }) => ({
      userId: u.id,
      type,
      title,
      body,
      link: link || null,
    }));

    const batchSize = 500;
    let totalCreated = 0;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const result = await prisma.notification.createMany({ data: batch });
      totalCreated += result.count;
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'NOTIFICATION_BROADCAST',
        target: 'Notification',
        after: { title, type, recipients: totalCreated, targetTier: targetTier || 'all' },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({
      success: true,
      data: { message: `Broadcast sent to ${totalCreated} users`, count: totalCreated },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to send broadcast' });
  }
});

// GET /api/admin/notifications/history
router.get('/history', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = HistoryFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { page, limit, type } = parsed.data;

    const where: Record<string, unknown> = { action: { startsWith: 'NOTIFICATION' } };
    if (type) {
      where.action = `NOTIFICATION_${type.toUpperCase()}`;
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch notification history' });
  }
});

export { router as adminNotificationsRouter };

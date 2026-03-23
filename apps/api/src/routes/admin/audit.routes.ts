import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireAdmin, type AdminRequest } from '../../middleware/admin.middleware';

export const runtime = 'nodejs';

const router = Router();

const AuditFilterSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
  adminId: z.string().optional(),
  action: z.string().optional(),
  target: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// GET /api/admin/audit-logs
router.get('/', requireAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = AuditFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { page, limit, adminId, action, target, startDate, endDate } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (adminId) where.adminId = adminId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (target) where.target = { contains: target, mode: 'insensitive' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: { select: { id: true, username: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
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
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

export { router as adminAuditRouter };

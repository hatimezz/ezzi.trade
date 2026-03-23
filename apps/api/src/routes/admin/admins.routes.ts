import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireSuperAdmin, type AdminRequest } from '../../middleware/admin.middleware';

export const runtime = 'nodejs';

const router = Router();

function hashIp(ip: string | undefined): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
}

const CreateAdminSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'VIEWER']),
});

const UpdateAdminSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'VIEWER']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
});

// GET /api/admin/admins
router.get('/', requireSuperAdmin(), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
        loginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { auditLogs: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: admins });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch admins' });
  }
});

// POST /api/admin/admins
router.post('/', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = CreateAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { username, email, password, role } = parsed.data;

    const existing = await prisma.admin.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { email: { equals: email, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      res.status(409).json({ success: false, error: 'Username or email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
      data: { username, email, passwordHash, role },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'ADMIN_CREATED',
        target: 'Admin',
        targetId: admin.id,
        after: { username, email, role },
        ipHash: hashIp(req.ip),
      },
    });

    res.status(201).json({ success: true, data: admin });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create admin' });
  }
});

// PUT /api/admin/admins/:id
router.put('/:id', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = UpdateAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!existingAdmin) {
      res.status(404).json({ success: false, error: 'Admin not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
    if (parsed.data.password) {
      updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    }

    const admin = await prisma.admin.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, username: true, email: true, role: true, isActive: true },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'ADMIN_UPDATED',
        target: 'Admin',
        targetId: req.params.id,
        before: { email: existingAdmin.email, role: existingAdmin.role, isActive: existingAdmin.isActive },
        after: { email: parsed.data.email, role: parsed.data.role, isActive: parsed.data.isActive, passwordChanged: !!parsed.data.password },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: admin });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update admin' });
  }
});

// DELETE /api/admin/admins/:id
router.delete('/:id', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.admin!.adminId) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, role: true },
    });

    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin not found' });
      return;
    }

    await prisma.admin.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'ADMIN_DEACTIVATED',
        target: 'Admin',
        targetId: req.params.id,
        before: { username: admin.username, role: admin.role },
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: { message: `Admin ${admin.username} deactivated` } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete admin' });
  }
});

export { router as adminAdminsRouter };

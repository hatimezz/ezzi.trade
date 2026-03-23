import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/db';
import { requireAdmin, requireSuperAdmin, type AdminRequest } from '../../middleware/admin.middleware';

export const runtime = 'nodejs';

const router = Router();

function hashIp(ip: string | undefined): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
}

const UpdateSettingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  maintenanceMsg: z.string().max(500).optional(),
  presaleActive: z.boolean().optional(),
  registrationOpen: z.boolean().optional(),
  capsuleOpen: z.boolean().optional(),
  marketplaceOpen: z.boolean().optional(),
  announcementBar: z.string().max(300).optional().nullable(),
  announcementActive: z.boolean().optional(),
  ezziPriceUsd: z.number().positive().optional(),
  solPriceUsd: z.number().positive().optional(),
});

const MaintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(500).optional(),
});

const PresaleToggleSchema = z.object({
  active: z.boolean(),
});

const RegistrationToggleSchema = z.object({
  open: z.boolean(),
});

const AnnouncementSchema = z.object({
  text: z.string().max(300),
  active: z.boolean(),
});

// GET /api/admin/settings
router.get('/', requireAdmin(), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    let settings = await prisma.siteSettings.findFirst({ where: { id: 'singleton' } });

    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: 'singleton' } });
    }

    res.json({ success: true, data: settings });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/admin/settings
router.put('/', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = UpdateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const before = await prisma.siteSettings.findFirst({ where: { id: 'singleton' } });

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...parsed.data, updatedBy: req.admin!.adminId },
      update: { ...parsed.data, updatedBy: req.admin!.adminId },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'SETTINGS_UPDATED',
        target: 'SiteSettings',
        targetId: 'singleton',
        before: before ? {
          maintenanceMode: before.maintenanceMode,
          presaleActive: before.presaleActive,
          registrationOpen: before.registrationOpen,
        } : null,
        after: parsed.data,
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: settings });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// POST /api/admin/settings/maintenance
router.post('/maintenance', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = MaintenanceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const updateData: Record<string, unknown> = {
      maintenanceMode: parsed.data.enabled,
      updatedBy: req.admin!.adminId,
    };
    if (parsed.data.message) updateData.maintenanceMsg = parsed.data.message;

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...updateData },
      update: updateData,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: parsed.data.enabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
        target: 'SiteSettings',
        targetId: 'singleton',
        after: parsed.data,
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: settings });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to toggle maintenance' });
  }
});

// POST /api/admin/settings/presale
router.post('/presale', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = PresaleToggleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', presaleActive: parsed.data.active, updatedBy: req.admin!.adminId },
      update: { presaleActive: parsed.data.active, updatedBy: req.admin!.adminId },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: parsed.data.active ? 'PRESALE_ACTIVATED' : 'PRESALE_DEACTIVATED',
        target: 'SiteSettings',
        targetId: 'singleton',
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: settings });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to toggle presale' });
  }
});

// POST /api/admin/settings/registration
router.post('/registration', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = RegistrationToggleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', registrationOpen: parsed.data.open, updatedBy: req.admin!.adminId },
      update: { registrationOpen: parsed.data.open, updatedBy: req.admin!.adminId },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: parsed.data.open ? 'REGISTRATION_OPENED' : 'REGISTRATION_CLOSED',
        target: 'SiteSettings',
        targetId: 'singleton',
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: settings });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to toggle registration' });
  }
});

// POST /api/admin/settings/announcement
router.post('/announcement', requireSuperAdmin(), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const parsed = AnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        announcementBar: parsed.data.text,
        announcementActive: parsed.data.active,
        updatedBy: req.admin!.adminId,
      },
      update: {
        announcementBar: parsed.data.text,
        announcementActive: parsed.data.active,
        updatedBy: req.admin!.adminId,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.adminId,
        action: 'ANNOUNCEMENT_UPDATED',
        target: 'SiteSettings',
        targetId: 'singleton',
        after: parsed.data,
        ipHash: hashIp(req.ip),
      },
    });

    res.json({ success: true, data: settings });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update announcement' });
  }
});

export { router as adminSettingsRouter };

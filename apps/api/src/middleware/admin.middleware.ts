import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'VIEWER';

export interface AdminTokenPayload {
  adminId: string;
  role: AdminRole;
  type: 'admin';
}

export interface AdminRequest extends Request {
  admin?: {
    adminId: string;
    role: AdminRole;
  };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export function requireAdmin(allowedRoles?: AdminRole[]) {
  return async (
    req: AdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.cookies?.ezzi_admin_token;

      if (!token) {
        res.status(401).json({ success: false, error: 'Admin authentication required' });
        return;
      }

      let decoded: AdminTokenPayload;
      try {
        decoded = jwt.verify(token, getJwtSecret()) as AdminTokenPayload;
      } catch {
        res.status(401).json({ success: false, error: 'Invalid or expired admin token' });
        return;
      }

      if (decoded.type !== 'admin') {
        res.status(401).json({ success: false, error: 'Invalid token type' });
        return;
      }

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: { id: true, role: true, isActive: true, lockedUntil: true },
      });

      if (!admin) {
        res.status(401).json({ success: false, error: 'Admin account not found' });
        return;
      }

      if (!admin.isActive) {
        res.status(403).json({ success: false, error: 'Admin account is deactivated' });
        return;
      }

      if (admin.lockedUntil && admin.lockedUntil > new Date()) {
        res.status(403).json({ success: false, error: 'Admin account is locked' });
        return;
      }

      if (allowedRoles && !allowedRoles.includes(admin.role)) {
        res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}`,
        });
        return;
      }

      req.admin = {
        adminId: admin.id,
        role: admin.role,
      };

      next();
    } catch {
      res.status(500).json({ success: false, error: 'Admin authentication failed' });
    }
  };
}

export function requireSuperAdmin() {
  return requireAdmin(['SUPER_ADMIN']);
}

export function requireAdminWrite() {
  return requireAdmin(['SUPER_ADMIN', 'ADMIN']);
}

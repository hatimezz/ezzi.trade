import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    isAdmin: boolean;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.ezzi_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email?: string;
    };

    const session = await prisma.session.findFirst({
      where: {
        token,
        userId: decoded.userId,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      res.status(401).json({ success: false, error: 'Session expired' });
      return;
    }

    req.user = {
      id: session.userId,
      email: session.user.email || undefined,
      isAdmin: session.user.isAdmin,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
}

export type { AuthRequest };

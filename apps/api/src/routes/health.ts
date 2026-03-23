import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../lib/db';

export const runtime = 'nodejs';

const router = Router();

interface HealthResponse {
  success: true;
  data: {
    status: 'ok';
    timestamp: string;
    version: string;
    database: 'connected' | 'disconnected';
    uptime: number;
  };
}

router.get('/', async (_req: Request, res: Response<HealthResponse>): Promise<void> => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'connected',
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'disconnected',
        uptime: process.uptime(),
      },
    });
  }
});

export { router as healthRouter };

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

interface RateLimitConfig {
  window: number; // seconds
  max: number;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + config.window * 1000,
      });
      next();
      return;
    }

    if (entry.count >= config.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter,
      });
      return;
    }

    entry.count++;
    next();
  };
}

// Specific rate limits
export const strictRateLimit = rateLimit({ window: 60, max: 10 });
export const standardRateLimit = rateLimit({ window: 60, max: 30 });
export const generousRateLimit = rateLimit({ window: 60, max: 100 });

import { getIO } from '../lib/socket';
import { logInfo, logError } from '../lib/logger';
import { prisma } from '../lib/db';
import { redis } from '../lib/redis';

// Zone multipliers
const ZONE_MULTIPLIERS: Record<string, number> = {
  NEON_CITY: 1.0,
  DESERT_STORM: 1.2,
  DEEP_OCEAN: 1.4,
  VOLCANO: 1.6,
  TUNDRA: 1.8,
  THE_VOID: 2.0,
  SPECIAL: 2.5,
};

// Rarity multipliers
const RARITY_MULTIPLIERS: Record<string, number> = {
  common: 1,
  rare: 1.5,
  epic: 3,
  legendary: 8,
  mythic: 10,
};

interface MiningSession {
  id: string;
  userId: string;
  nftId: string;
  zone: string;
  startedAt: Date;
  status: string;
  nft?: {
    durability: number;
    warrior?: {
      miningRate: number;
      rarity: string;
    };
  };
}

export class RealtimeMiningService {
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY_MS = 1000; // Update every second
  private readonly CACHE_KEY_PREFIX = 'mining:earnings:';

  start(): void {
    if (this.updateInterval) return;

    logInfo('REALTIME_MINING_SERVICE_STARTED');

    this.updateInterval = setInterval(() => {
      this.updateEarnings();
    }, this.UPDATE_FREQUENCY_MS);
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logInfo('REALTIME_MINING_SERVICE_STOPPED');
    }
  }

  /**
   * Calculate mining rate for a session
   */
  private calculateMiningRate(
    baseRate: number,
    rarity: string,
    zone: string,
    durability: number
  ): number {
    const rarityMult = RARITY_MULTIPLIERS[rarity] || 1;
    const zoneMult = ZONE_MULTIPLIERS[zone] || 1;
    const durabilityMult = durability / 100;

    // Return EZZI per hour
    return 10 * rarityMult * zoneMult * durabilityMult;
  }

  /**
   * Calculate current earnings for a session
   */
  private calculateEarnings(session: MiningSession): {
    totalEarnings: number;
    sessionTimeSeconds: number;
    earningsPerSecond: number;
  } {
    const sessionTimeMs = Date.now() - new Date(session.startedAt).getTime();
    const sessionTimeHours = sessionTimeMs / (1000 * 60 * 60);
    const sessionTimeSeconds = Math.floor(sessionTimeMs / 1000);

    const miningRate = this.calculateMiningRate(
      session.nft?.warrior?.miningRate || 1,
      session.nft?.warrior?.rarity || 'common',
      session.zone,
      session.nft?.durability || 100
    );

    const earningsPerHour = miningRate;
    const earningsPerSecond = earningsPerHour / 3600;
    const totalEarnings = earningsPerHour * sessionTimeHours;

    return {
      totalEarnings: Math.floor(totalEarnings * 100) / 100,
      sessionTimeSeconds,
      earningsPerSecond: Math.floor(earningsPerSecond * 10000) / 10000,
    };
  }

  /**
   * Update earnings for all active mining sessions
   */
  private async updateEarnings(): Promise<void> {
    try {
      const io = getIO();

      // Get all active sessions with NFT data
      const activeSessions = await prisma.miningSession.findMany({
        where: { status: 'active' },
        include: {
          nft: {
            include: {
              warrior: true,
            },
          },
        },
      });

      for (const session of activeSessions) {
        const earnings = this.calculateEarnings(session);

        // Cache earnings in Redis for quick retrieval
        const cacheKey = `${this.CACHE_KEY_PREFIX}${session.id}`;
        await redis.setex(
          cacheKey,
          60, // 1 minute TTL
          JSON.stringify(earnings)
        );

        // Emit to user's room
        io.to(`user:${session.userId}`).emit('mining:update', {
          sessionId: session.id,
          nftId: session.nftId,
          zone: session.zone,
          ...earnings,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logError('REALTIME_MINING_UPDATE_ERROR', error);
    }
  }

  /**
   * Get cached earnings for a session
   */
  async getCachedEarnings(sessionId: string): Promise<{
    totalEarnings: number;
    sessionTimeSeconds: number;
    earningsPerSecond: number;
  } | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${sessionId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logError('GET_CACHED_EARNINGS_ERROR', error, { sessionId });
      return null;
    }
  }

  /**
   * Emit mining started event
   */
  emitMiningStarted(userId: string, session: MiningSession): void {
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('mining:started', {
        sessionId: session.id,
        nftId: session.nftId,
        zone: session.zone,
        startedAt: session.startedAt,
        timestamp: Date.now(),
      });
      logInfo('MINING_STARTED_EMITTED', { userId, sessionId: session.id });
    } catch (error) {
      logError('EMIT_MINING_STARTED_ERROR', error);
    }
  }

  /**
   * Emit mining ended event
   */
  emitMiningEnded(userId: string, sessionId: string, earnings: number, hours: number): void {
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('mining:ended', {
        sessionId,
        earnings,
        hours,
        timestamp: Date.now(),
      });
      logInfo('MINING_ENDED_EMITTED', { userId, sessionId, earnings });
    } catch (error) {
      logError('EMIT_MINING_ENDED_ERROR', error);
    }
  }

  /**
   * Join user to their mining room
   */
  joinUserRoom(socketId: string, userId: string): void {
    try {
      const io = getIO();
      io.sockets.sockets.get(socketId)?.join(`user:${userId}`);
      logInfo('USER_JOINED_MINING_ROOM', { socketId, userId });
    } catch (error) {
      logError('JOIN_USER_ROOM_ERROR', error);
    }
  }
}

export const realtimeMiningService = new RealtimeMiningService();

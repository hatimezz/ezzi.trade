import { prisma } from '../lib/db';
import crypto from 'crypto';

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

interface StartMiningInput {
  userId: string;
  nftId: string;
  zone: string;
}

interface EndMiningInput {
  sessionId: string;
  userId: string;
}

export class MiningService {
  calculateMiningRate(
    baseRate: number,
    rarity: string,
    zone: string,
    durability: number
  ): number {
    const rarityMult = RARITY_MULTIPLIERS[rarity] || 1;
    const zoneMult = ZONE_MULTIPLIERS[zone] || 1;
    const durabilityMult = durability / 100;

    return 10 * rarityMult * zoneMult * durabilityMult; // 10 EZZI base per hour
  }

  async startMining(input: StartMiningInput) {
    const nft = await prisma.nFT.findFirst({
      where: {
        id: input.nftId,
        ownerId: input.userId,
      },
      include: { warrior: true },
    });

    if (!nft) {
      throw new Error('NFT not found or not owned');
    }

    if (nft.isStaked) {
      throw new Error('NFT is already mining');
    }

    // Check durability
    if (nft.durability <= 0) {
      throw new Error('NFT durability depleted. Repair required.');
    }

    // Check for existing active session
    const existingSession = await prisma.miningSession.findFirst({
      where: {
        nftId: input.nftId,
        status: 'active',
      },
    });

    if (existingSession) {
      throw new Error('NFT is already mining');
    }

    const session = await prisma.$transaction([
      prisma.miningSession.create({
        data: {
          userId: input.userId,
          nftId: input.nftId,
          zone: input.zone,
          status: 'active',
        },
        include: {
          nft: {
            include: {
              warrior: true,
            },
          },
        },
      }),
      prisma.nFT.update({
        where: { id: input.nftId },
        data: { isStaked: true },
      }),
    ]);

    return session[0];
  }

  async endMining(input: EndMiningInput) {
    const session = await prisma.miningSession.findFirst({
      where: {
        id: input.sessionId,
        userId: input.userId,
        status: 'active',
      },
      include: {
        nft: {
          include: {
            warrior: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Mining session not found');
    }

    // Calculate earnings (server-side only)
    const hours =
      (Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60 * 60);

    if (hours < 0.016) {
      // Less than 1 minute
      throw new Error('Mining session too short');
    }

    const earnedAmount = this.calculateMiningRate(
      session.nft.warrior.miningRate,
      session.nft.warrior.rarity,
      session.zone,
      session.nft.durability
    );

    const actualEarnings = Math.floor(earnedAmount * hours);

    // Calculate durability loss (2% per hour)
    const durabilityLoss = Math.min(
      Math.floor(hours * 2),
      session.nft.durability
    );

    // Update in transaction
    const [updatedSession, updatedNft, balance] = await prisma.$transaction([
      prisma.miningSession.update({
        where: { id: input.sessionId },
        data: {
          status: 'completed',
          endedAt: new Date(),
          earnedAmount: actualEarnings,
        },
      }),
      prisma.nFT.update({
        where: { id: session.nftId },
        data: {
          isStaked: false,
          durability: session.nft.durability - durabilityLoss,
        },
      }),
      prisma.userBalance.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          ezziBalance: actualEarnings,
          totalMined: actualEarnings,
        },
        update: {
          ezziBalance: { increment: actualEarnings },
          totalMined: { increment: actualEarnings },
        },
      }),
    ]);

    return {
      session: updatedSession,
      earnings: actualEarnings,
      hours: Math.round(hours * 100) / 100,
      durabilityLoss,
    };
  }

  async getActiveSessions(userId: string) {
    return prisma.miningSession.findMany({
      where: {
        userId,
        status: 'active',
      },
      include: {
        nft: {
          include: {
            warrior: true,
          },
        },
      },
    });
  }

  async getSessionHistory(userId: string, limit: number = 50) {
    return prisma.miningSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        nft: {
          include: {
            warrior: true,
          },
        },
      },
    });
  }

  async getZones() {
    return [
      { zone: 'NEON_CITY', name: 'Neon City', multiplier: 1.0, color: '#00ff9f' },
      { zone: 'DESERT_STORM', name: 'Desert Storm', multiplier: 1.2, color: '#ff8c00' },
      { zone: 'DEEP_OCEAN', name: 'Deep Ocean', multiplier: 1.4, color: '#0080ff' },
      { zone: 'VOLCANO', name: 'Volcano', multiplier: 1.6, color: '#ff3300' },
      { zone: 'TUNDRA', name: 'Frozen Tundra', multiplier: 1.8, color: '#a8d8ff' },
      { zone: 'THE_VOID', name: 'The Void', multiplier: 2.0, color: '#cc00ff' },
      { zone: 'SPECIAL', name: 'Special', multiplier: 2.5, color: '#ffd700' },
    ];
  }

  // Calculate current earnings without ending session
  async calculateCurrentEarnings(sessionId: string) {
    const session = await prisma.miningSession.findUnique({
      where: { id: sessionId },
      include: {
        nft: {
          include: {
            warrior: true,
          },
        },
      },
    });

    if (!session || session.status !== 'active') {
      throw new Error('Session not active');
    }

    const hours =
      (Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60 * 60);
    const earnedAmount = this.calculateMiningRate(
      session.nft.warrior.miningRate,
      session.nft.warrior.rarity,
      session.zone,
      session.nft.durability
    );

    return {
      sessionId,
      hours: Math.round(hours * 100) / 100,
      currentEarnings: Math.floor(earnedAmount * hours),
      projectedHourly: earnedAmount,
    };
  }
}

export const miningService = new MiningService();

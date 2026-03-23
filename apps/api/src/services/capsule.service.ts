import { prisma } from '../lib/db';
import crypto from 'crypto';
import redis from '../lib/redis';
import { liveFeedService } from './live-feed.service';

const STREAK_KEY_PREFIX = 'capsule:streak:';
const STREAK_RESET_HOURS = 24;

export class CapsuleService {
  async getCapsuleTiers() {
    return prisma.capsuleTier.findMany({
      orderBy: { price: 'asc' },
    });
  }

  async getCapsuleTier(id: string) {
    return prisma.capsuleTier.findUnique({
      where: { id },
    });
  }

  async openCapsule(capsuleTierId: string, userId: string) {
    const tier = await prisma.capsuleTier.findUnique({
      where: { id: capsuleTierId },
    });

    if (!tier) {
      throw new Error('Capsule tier not found');
    }

    if (tier.remaining <= 0) {
      throw new Error('Capsule sold out');
    }

    // Get user for live feed
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Roll for rarity using crypto.randomBytes
    const random = crypto.randomBytes(4).readUInt32LE(0) / 0xffffffff * 100;

    // Use DB rates directly from capsule tier
    const rates = {
      mythic: tier.mythicRate,
      legendary: tier.legendaryRate,
      epic: tier.epicRate,
      rare: tier.rareRate,
      common: tier.commonRate,
      ezzi: tier.ezziRate,
    };

    // EZZI amounts per capsule tier (from DB CapsuleTier price)
    const ezziRanges: Record<string, { min: number; max: number }> = {
      CORE: { min: 500, max: 2000 },
      SURGE: { min: 2000, max: 5000 },
      VOID: { min: 5000, max: 15000 },
      CELESTIAL: { min: 10000, max: 30000 },
      GENESIS: { min: 20000, max: 50000 },
    };

    const ezziRange = ezziRanges[tier.name] || { min: 500, max: 2000 };

    let cumulative = 0;
    let rolledRarity: string | null = null;
    let resultType: 'nft' | 'ezzi';
    let amount: number | null = null;
    let resultId: string | null = null;

    // Check for EZZI drop first
    const ezziChance = rates.ezzi;
    if (random >= 100 - ezziChance) {
      // EZZI drop
      resultType = 'ezzi';
      const randomAmount = crypto.randomBytes(4).readUInt32LE(0);
      amount = Math.floor(
        ezziRange.min + (randomAmount % (ezziRange.max - ezziRange.min + 1))
      );
    } else {
      // Determine rarity for NFT using weighted RNG
      resultType = 'nft';

      // Check mythic first (1% base)
      if (random < (cumulative += rates.mythic)) {
        rolledRarity = 'mythic';
      } else if (random < (cumulative += rates.legendary)) {
        rolledRarity = 'legendary';
      } else if (random < (cumulative += rates.epic)) {
        rolledRarity = 'epic';
      } else if (random < (cumulative += rates.rare)) {
        rolledRarity = 'rare';
      } else {
        rolledRarity = 'common';
      }

      // Get warriors of rolled rarity
      const warriors = await prisma.warrior.findMany({
        where: { rarity: rolledRarity },
      });

      if (warriors.length === 0) {
        throw new Error('No warriors found for this rarity');
      }

      // Select random warrior
      const warriorIndex = crypto.randomBytes(4).readUInt32LE(0) % warriors.length;
      const warrior = warriors[warriorIndex];

      // Create NFT
      const nft = await prisma.nFT.create({
        data: {
          warriorId: warrior.id,
          ownerId: userId,
          durability: 100,
          mintedAt: new Date(),
          mintedBy: userId,
        },
      });

      resultId = nft.id;
    }

    // Create opening record and update in transaction
    const [opening] = await prisma.$transaction([
      prisma.capsuleOpening.create({
        data: {
          userId,
          capsuleTierId,
          resultType,
          resultId,
          amount,
          rarity: rolledRarity,
        },
        include: {
          capsuleTier: true,
        },
      }),
      prisma.capsuleTier.update({
        where: { id: capsuleTierId },
        data: { remaining: { decrement: 1 } },
      }),
      ...(resultType === 'ezzi'
        ? [
            prisma.userBalance.upsert({
              where: { userId },
              create: {
                userId,
                ezziBalance: amount!,
                totalEarned: amount!,
              },
              update: {
                ezziBalance: { increment: amount! },
                totalEarned: { increment: amount! },
              },
            }),
          ]
        : []),
    ]);

    // Update streak
    await this.updateStreak(userId);

    // Push live feed event
    await liveFeedService.pushEvent({
      type: 'capsule_opened',
      userId,
      displayName: user.displayName || 'Anonymous',
      avatarUrl: user.avatarUrl || undefined,
      rarity: rolledRarity || undefined,
      capsuleName: tier.displayName,
      amount: amount || undefined,
    });

    return {
      opening,
      resultType,
      rarity: rolledRarity,
      amount,
      nftId: resultId,
    };
  }

  async getUserOpenings(userId: string, limit: number = 50) {
    return prisma.capsuleOpening.findMany({
      where: { userId },
      orderBy: { openedAt: 'desc' },
      take: limit,
      include: {
        capsuleTier: true,
        nft: {
          include: {
            warrior: true,
          },
        },
      },
    });
  }

  async getRecentOpenings(limit: number = 20) {
    return prisma.capsuleOpening.findMany({
      orderBy: { openedAt: 'desc' },
      take: limit,
      include: {
        capsuleTier: true,
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
        nft: {
          include: {
            warrior: true,
          },
        },
      },
    });
  }

  async updateStreak(userId: string): Promise<number> {
    const key = `${STREAK_KEY_PREFIX}${userId}`;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const existing = await redis.get(key);
    let streak: { count: number; lastOpened: string };

    if (existing) {
      streak = JSON.parse(existing);
      const lastOpened = new Date(streak.lastOpened);
      const lastOpenedDate = new Date(lastOpened.getFullYear(), lastOpened.getMonth(), lastOpened.getDate());
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const diffHours = (todayDate.getTime() - lastOpenedDate.getTime()) / (1000 * 60 * 60);

      if (diffHours >= 24 && diffHours < 48) {
        // Next day - increment streak
        streak.count += 1;
        streak.lastOpened = today;
      } else if (diffHours >= 48) {
        // Streak broken - reset
        streak.count = 1;
        streak.lastOpened = today;
      }
      // Else same day - no change
    } else {
      // First opening
      streak = { count: 1, lastOpened: today };
    }

    await redis.setex(key, STREAK_RESET_HOURS * 60 * 60, JSON.stringify(streak));
    return streak.count;
  }

  async getUserStreak(userId: string): Promise<{ count: number; lastOpened: string }> {
    const key = `${STREAK_KEY_PREFIX}${userId}`;
    const existing = await redis.get(key);

    if (existing) {
      const streak = JSON.parse(existing);
      const lastOpened = new Date(streak.lastOpened);
      const lastOpenedDate = new Date(lastOpened.getFullYear(), lastOpened.getMonth(), lastOpened.getDate());
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffHours = (todayDate.getTime() - lastOpenedDate.getTime()) / (1000 * 60 * 60);

      if (diffHours >= 48) {
        // Streak expired
        return { count: 0, lastOpened: streak.lastOpened };
      }

      return streak;
    }

    return { count: 0, lastOpened: '' };
  }

  async getCapsuleHistory(userId: string, limit: number = 50) {
    return prisma.capsuleOpening.findMany({
      where: { userId },
      orderBy: { openedAt: 'desc' },
      take: limit,
      include: {
        capsuleTier: true,
        nft: {
          include: {
            warrior: true,
          },
        },
      },
    });
  }
}

export const capsuleService = new CapsuleService();

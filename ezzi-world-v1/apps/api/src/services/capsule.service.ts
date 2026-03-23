import { prisma } from '../lib/db';
import crypto from 'crypto';

// Capsule rarity rates
const CAPSULE_RATES = {
  CORE: { common: 55, rare: 20, epic: 10, legendary: 3, mythic: 0.5, ezzi: 11.5 },
  SURGE: { common: 25, rare: 35, epic: 20, legendary: 8, mythic: 2, ezzi: 10 },
  VOID: { common: 10, rare: 25, epic: 30, legendary: 20, mythic: 8, ezzi: 7 },
  CELESTIAL: { common: 0, rare: 20, epic: 35, legendary: 30, mythic: 15, ezzi: 0 },
  GENESIS: { common: 0, rare: 0, epic: 20, legendary: 40, mythic: 35, ezzi: 5 },
};

// EZZI amounts per capsule tier
const EZZI_AMOUNTS = {
  CORE: { min: 500, max: 2000 },
  SURGE: { min: 2000, max: 5000 },
  VOID: { min: 5000, max: 15000 },
  CELESTIAL: { min: 10000, max: 30000 },
  GENESIS: { min: 20000, max: 50000 },
};

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

    // Roll for rarity using crypto.randomBytes
    const random = crypto.randomBytes(4).readUInt32LE(0) / 0xffffffff * 100;
    const rates = CAPSULE_RATES[tier.name as keyof typeof CAPSULE_RATES];

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
      const ezziRange = EZZI_AMOUNTS[tier.name as keyof typeof EZZI_AMOUNTS];
      const randomAmount = crypto.randomBytes(4).readUInt32LE(0);
      amount = Math.floor(
        ezziRange.min + (randomAmount % (ezziRange.max - ezziRange.min + 1))
      );
    } else {
      // Determine rarity for NFT
      resultType = 'nft';

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
}

export const capsuleService = new CapsuleService();

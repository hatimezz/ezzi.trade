import { prisma } from '../lib/db';
import crypto from 'crypto';
import { liveFeedService } from './live-feed.service';

interface PurchaseNFTInput {
  nftId: string;
  buyerId: string;
  sellerId: string;
  price: number;
}

interface CreateNFTInput {
  warriorId: string;
  ownerId: string;
  editionNumber?: number;
}

interface NFTFilters {
  rarity?: string;
  zone?: string;
  minPrice?: number;
  maxPrice?: number;
  ownerId?: string;
  isListed?: boolean;
  skip?: number;
  take?: number;
}

export class NFTService {
  // Calculate dynamic price based on sale count
  calculatePrice(basePrice: number, saleCount: number): number {
    // Price increases by 2% with each sale
    return basePrice * Math.pow(1.02, saleCount);
  }

  async createNFT(input: CreateNFTInput) {
    const warrior = await prisma.warrior.findUnique({
      where: { id: input.warriorId },
    });

    if (!warrior) {
      throw new Error('Warrior not found');
    }

    // Count existing NFTs for this warrior
    const existingCount = await prisma.nFT.count({
      where: { warriorId: input.warriorId },
    });

    if (existingCount >= warrior.totalSupply) {
      throw new Error('Warrior supply limit reached');
    }

    const nft = await prisma.nFT.create({
      data: {
        warriorId: input.warriorId,
        ownerId: input.ownerId,
        editionNumber: input.editionNumber || existingCount + 1,
        durability: 100,
        mintedAt: new Date(),
        mintedBy: input.ownerId,
      },
      include: {
        warrior: true,
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return nft;
  }

  async getNFTs(filters: NFTFilters) {
    const where: any = {};

    if (filters.rarity || filters.zone) {
      where.warrior = {};
      if (filters.rarity) where.warrior.rarity = filters.rarity;
      if (filters.zone) where.warrior.zone = filters.zone;
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.isListed !== undefined) {
      if (filters.isListed) {
        where.listing = { status: 'active' };
      } else {
        where.listing = null;
      }
    }

    const [nfts, total] = await Promise.all([
      prisma.nFT.findMany({
        where,
        include: {
          warrior: true,
          owner: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          listing: true,
        },
        skip: filters.skip || 0,
        take: filters.take || 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.nFT.count({ where }),
    ]);

    // Calculate dynamic prices
    const nftsWithPrice = nfts.map((nft: (typeof nfts)[number]) => ({
      ...nft,
      currentPrice: this.calculatePrice(
        nft.warrior.basePrice,
        nft.saleCount
      ),
    }));

    return {
      items: nftsWithPrice,
      total,
      hasMore: total > (filters.skip || 0) + (filters.take || 20),
    };
  }

  async getNFTById(id: string) {
    const nft = await prisma.nFT.findUnique({
      where: { id },
      include: {
        warrior: true,
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        listing: true,
        miningSessions: {
          where: { status: 'active' },
          take: 1,
        },
      },
    });

    if (!nft) return null;

    return {
      ...nft,
      currentPrice: this.calculatePrice(
        nft.warrior.basePrice,
        nft.saleCount
      ),
    };
  }

  async getWarriors() {
    return prisma.warrior.findMany({
      orderBy: { rarity: 'asc' },
    });
  }

  async repairNFT(nftId: string, userId: string) {
    const nft = await prisma.nFT.findFirst({
      where: { id: nftId, ownerId: userId },
      include: { warrior: true },
    });

    if (!nft) {
      throw new Error('NFT not found or not owned');
    }

    // Fetch repair price from DB (per 10% durability)
    const repairCostPer10 = 10; // Default repair cost

    // Calculate repair cost
    const durabilityToRestore = Math.min(100 - nft.durability, 100);
    const cost = (durabilityToRestore / 10) * repairCostPer10;

    // Check user balance
    const balance = await prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!balance || balance.ezziBalance < cost) {
      throw new Error('Insufficient EZZI balance');
    }

    // Deduct EZZI and restore durability
    await prisma.$transaction([
      prisma.userBalance.update({
        where: { userId },
        data: {
          ezziBalance: { decrement: cost },
          totalSpent: { increment: cost },
        },
      }),
      prisma.nFT.update({
        where: { id: nftId },
        data: {
          durability: 100,
        },
      }),
    ]);

    return { success: true, cost, durability: 100 };
  }

  async purchaseNFT(input: PurchaseNFTInput) {
    const { nftId, buyerId, sellerId, price } = input;

    // Get NFT with listing info
    const nft = await prisma.nFT.findFirst({
      where: {
        id: nftId,
        ownerId: sellerId,
        listing: { status: 'active' },
      },
      include: {
        warrior: true,
        listing: true,
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!nft || !nft.listing) {
      throw new Error('NFT not found or not listed for sale');
    }

    if (nft.listing.price !== price) {
      throw new Error('Price mismatch');
    }

    // Check buyer balance
    const buyerBalance = await prisma.userBalance.findUnique({
      where: { userId: buyerId },
    });

    if (!buyerBalance || buyerBalance.ezziBalance < price) {
      throw new Error('Insufficient EZZI balance');
    }

    // Get buyer info for live feed
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    if (!buyer) {
      throw new Error('Buyer not found');
    }

    // Execute purchase in transaction
    const [, , , updatedNft] = await prisma.$transaction([
      // Deduct from buyer
      prisma.userBalance.upsert({
        where: { userId: buyerId },
        create: {
          userId: buyerId,
          ezziBalance: -price,
          totalSpent: price,
        },
        update: {
          ezziBalance: { decrement: price },
          totalSpent: { increment: price },
        },
      }),
      // Add to seller
      prisma.userBalance.upsert({
        where: { userId: sellerId },
        create: {
          userId: sellerId,
          ezziBalance: price,
          totalEarned: price,
        },
        update: {
          ezziBalance: { increment: price },
          totalEarned: { increment: price },
        },
      }),
      // Update listing status
      prisma.marketplaceListing.update({
        where: { id: nft.listing.id },
        data: {
          status: 'sold',
          soldAt: new Date(),
          buyerId: buyerId,
        },
      }),
      // Transfer NFT ownership and increment sale count
      prisma.nFT.update({
        where: { id: nftId },
        data: {
          ownerId: buyerId,
          saleCount: { increment: 1 },
        },
        include: {
          warrior: true,
        },
      }),
    ]);

    // Push live feed event
    await liveFeedService.pushEvent({
      type: 'nft_purchased',
      userId: buyerId,
      displayName: buyer.displayName || 'Anonymous',
      avatarUrl: buyer.avatarUrl || undefined,
      rarity: nft.warrior.rarity,
      warriorName: nft.warrior.displayName,
      amount: price,
    });

    return {
      success: true,
      nft: updatedNft,
      price,
      buyerId,
      sellerId,
    };
  }
}

export const nftService = new NFTService();

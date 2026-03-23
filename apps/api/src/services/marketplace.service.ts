import { prisma } from '../lib/db';
import { nftService } from './nft.service';

interface CreateListingInput {
  nftId: string;
  sellerId: string;
  price: number;
}

interface PurchaseInput {
  listingId: string;
  buyerId: string;
  txHash: string;
}

export class MarketplaceService {
  async createListing(input: CreateListingInput) {
    const nft = await prisma.nFT.findFirst({
      where: {
        id: input.nftId,
        ownerId: input.sellerId,
      },
      include: { warrior: true },
    });

    if (!nft) {
      throw new Error('NFT not found or not owned');
    }

    if (nft.listingId) {
      throw new Error('NFT already listed');
    }

    if (nft.isStaked) {
      throw new Error('Cannot list staked NFT');
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        nftId: input.nftId,
        sellerId: input.sellerId,
        price: input.price,
        status: 'active',
      },
      include: {
        nft: {
          include: {
            warrior: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return listing;
  }

  async getListings(filters: {
    rarity?: string;
    zone?: string;
    minPrice?: number;
    maxPrice?: number;
    skip?: number;
    take?: number;
  }) {
    const where: any = { status: 'active' };

    if (filters.rarity || filters.zone) {
      where.nft = { warrior: {} };
      if (filters.rarity) where.nft.warrior.rarity = filters.rarity;
      if (filters.zone) where.nft.warrior.zone = filters.zone;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        include: {
          nft: {
            include: {
              warrior: true,
            },
          },
          seller: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: filters.skip || 0,
        take: filters.take || 20,
      }),
      prisma.marketplaceListing.count({ where }),
    ]);

    // Calculate dynamic prices
    const listingsWithDynamicPrice = listings.map((listing: (typeof listings)[number]) => ({
      ...listing,
      dynamicPrice: nftService.calculatePrice(
        listing.nft.warrior.basePrice,
        listing.nft.saleCount
      ),
    }));

    return {
      items: listingsWithDynamicPrice,
      total,
      hasMore: total > (filters.skip || 0) + (filters.take || 20),
    };
  }

  async getListingById(listingId: string) {
    return prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        nft: {
          include: {
            warrior: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            wallets: true,
          },
        },
      },
    });
  }

  async purchase(input: PurchaseInput) {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: input.listingId },
      include: {
        nft: { include: { warrior: true } },
        seller: true,
      },
    });

    if (!listing || listing.status !== 'active') {
      throw new Error('Listing not found or not active');
    }

    // Update in transaction
    const [updatedListing, updatedNft, transaction] = await prisma.$transaction([
      prisma.marketplaceListing.update({
        where: { id: input.listingId },
        data: {
          status: 'sold',
          buyerId: input.buyerId,
          soldAt: new Date(),
        },
        include: {
          nft: { include: { warrior: true } },
          seller: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.nFT.update({
        where: { id: listing.nftId },
        data: {
          ownerId: input.buyerId,
          saleCount: { increment: 1 },
        },
      }),
      prisma.processedTx.create({
        data: {
          txHash: input.txHash,
          type: 'nft_purchase',
          status: 'confirmed',
          amount: listing.price,
          token: 'SOL',
          fromAddress: listing.sellerId,
          toAddress: input.buyerId,
          userId: input.buyerId,
          metadata: JSON.stringify({
            listingId: input.listingId,
            nftId: listing.nftId,
            sellerId: listing.sellerId,
          }),
        },
      }),
    ]);

    return {
      listing: updatedListing,
      nft: updatedNft,
      transaction,
    };
  }

  async cancelListing(listingId: string, sellerId: string) {
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        id: listingId,
        sellerId,
        status: 'active',
      },
    });

    if (!listing) {
      throw new Error('Listing not found or not owned');
    }

    await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { status: 'cancelled' },
    });

    return { success: true };
  }

  async getFloorPrices() {
    const warriors = await prisma.warrior.findMany({
      select: {
        rarity: true,
        basePrice: true,
      },
    });

    const floorPrices: Record<string, number> = {};

    for (const warrior of warriors) {
      if (!floorPrices[warrior.rarity] || warrior.basePrice < floorPrices[warrior.rarity]) {
        floorPrices[warrior.rarity] = warrior.basePrice;
      }
    }

    return floorPrices;
  }
}

export const marketplaceService = new MarketplaceService();

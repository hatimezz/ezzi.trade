import { prisma } from '../lib/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface CreateUserInput {
  email: string;
  username: string;
  displayName?: string;
}

interface AuthResponse {
  user: {
    id: string;
    email?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    isAdmin: boolean;
  };
  token: string;
}

export class UserService {
  async createUser(input: CreateUserInput): Promise<AuthResponse> {
    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existing) {
      throw new Error('Email or username already exists');
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        displayName: input.displayName || input.username,
      },
    });

    // Create balance
    await prisma.userBalance.create({
      data: {
        userId: user.id,
        ezziBalance: 0,
        totalMined: 0,
        totalEarned: 0,
        totalSpent: 0,
      },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email || undefined,
        username: user.username || undefined,
        displayName: user.displayName || undefined,
        avatarUrl: user.avatarUrl || undefined,
        isAdmin: user.isAdmin,
      },
      token,
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        balance: true,
        _count: {
          select: {
            ownedNfts: true,
            capsuleOpenings: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin,
      wallets: user.wallets,
      balance: user.balance,
      stats: {
        nftCount: user._count.ownedNfts,
        capsuleCount: user._count.capsuleOpenings,
      },
    };
  }

  async getUserNFTs(userId: string) {
    return prisma.nFT.findMany({
      where: { ownerId: userId },
      include: {
        warrior: true,
        listing: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserBalance(userId: string) {
    const balance = await prisma.userBalance.findUnique({
      where: { userId },
    });

    return (
      balance || {
        userId,
        ezziBalance: 0,
        totalMined: 0,
        totalEarned: 0,
        totalSpent: 0,
      }
    );
  }

  async connectWallet(
    userId: string,
    address: string,
    chain: string = 'solana'
  ) {
    // Check if wallet already exists
    const existing = await prisma.wallet.findUnique({
      where: { address },
    });

    if (existing) {
      if (existing.userId !== userId) {
        throw new Error('Wallet already connected to another account');
      }
      return existing;
    }

    // Check if user has primary wallet
    const hasPrimary = await prisma.wallet.findFirst({
      where: { userId, isPrimary: true },
    });

    return prisma.wallet.create({
      data: {
        userId,
        address,
        chain,
        isPrimary: !hasPrimary,
      },
    });
  }

  generateToken(userId: string, email?: string | null): string {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }

  async getPlatformStats() {
    const [
      totalUsers,
      totalNfts,
      totalCapsulesOpened,
      totalEzziMined,
      activeListings,
      activeMiningSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.nFT.count(),
      prisma.capsuleOpening.count(),
      prisma.userBalance.aggregate({
        _sum: { totalMined: true },
      }),
      prisma.marketplaceListing.count({
        where: { status: 'active' },
      }),
      prisma.miningSession.count({
        where: { status: 'active' },
      }),
    ]);

    return {
      totalUsers,
      totalNfts,
      totalCapsulesOpened,
      totalEzziMined: totalEzziMined._sum.totalMined || 0,
      activeListings,
      activeMiningSessions,
    };
  }

  generateAvatar(address: string): string {
    // Generate deterministic avatar from address
    const colors = ['#00d4ff', '#ffd700', '#ff8c00', '#cc00ff', '#00ff9f'];
    const hash = crypto.createHash('sha256').update(address).digest('hex');
    const colorIndex = parseInt(hash.slice(0, 2), 16) % colors.length;
    return colors[colorIndex];
  }
}

export const userService = new UserService();

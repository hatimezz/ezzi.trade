import { prisma } from '../lib/db';
import type { PrismaClient } from '@prisma/client';

const COMMISSION_RATE_PERCENT = 10;
const LOCK_DAYS = 7;

type OrderType = 'NFT_PURCHASE' | 'CAPSULE_PURCHASE' | 'TOKEN_PURCHASE';

export class CommissionService {
  async processCommission(params: {
    refCode: string;
    orderId: string;
    orderType: OrderType;
    orderAmountEzzi: number;
  }): Promise<void> {
    const { refCode, orderId, orderType, orderAmountEzzi } = params;

    const application = await prisma.partnerApplication.findUnique({
      where: { refCode },
      include: {
        influencer: { select: { id: true } },
        affiliate: { select: { id: true } },
      },
    });

    if (!application || application.status !== 'APPROVED') return;

    const ezziAmount = (orderAmountEzzi * COMMISSION_RATE_PERCENT) / 100;
    const lockedUntil = new Date(Date.now() + LOCK_DAYS * 24 * 60 * 60 * 1000);

    if (application.type === 'INFLUENCER' && application.influencer) {
      const influencerId = application.influencer.id;
      await prisma.$transaction([
        prisma.commission.create({
          data: {
            influencerId,
            orderId,
            orderType,
            orderAmount: orderAmountEzzi,
            ezziAmount,
            ratePercent: COMMISSION_RATE_PERCENT,
            status: 'PENDING',
            lockedUntil,
          },
        }),
        prisma.influencer.update({
          where: { id: influencerId },
          data: {
            totalSales: { increment: 1 },
            pendingEarned: { increment: ezziAmount },
          },
        }),
      ]);
    } else if (application.type === 'AFFILIATE' && application.affiliate) {
      const affiliateId = application.affiliate.id;
      await prisma.$transaction([
        prisma.commission.create({
          data: {
            affiliateId,
            orderId,
            orderType,
            orderAmount: orderAmountEzzi,
            ezziAmount,
            ratePercent: COMMISSION_RATE_PERCENT,
            status: 'PENDING',
            lockedUntil,
          },
        }),
        prisma.affiliate.update({
          where: { id: affiliateId },
          data: {
            totalSales: { increment: 1 },
            pendingEarned: { increment: ezziAmount },
          },
        }),
      ]);
    }
  }

  async approveLockedCommissions(): Promise<number> {
    const result = await prisma.commission.updateMany({
      where: {
        status: 'PENDING',
        lockedUntil: { lte: new Date() },
        isFraud: false,
      },
      data: { status: 'APPROVED' },
    });
    return result.count;
  }

  async recordReferralClick(params: {
    refCode: string;
    ipHash: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void> {
    const { refCode, ipHash, userAgent, sessionId } = params;

    const application = await prisma.partnerApplication.findUnique({
      where: { refCode },
      include: {
        influencer: { select: { id: true } },
        affiliate: { select: { id: true } },
      },
    });

    if (!application || application.status !== 'APPROVED') return;

    await prisma.$transaction(async (tx: PrismaClient) => {
      await tx.referralClick.create({
        data: {
          refCode,
          influencerId: application.influencer?.id ?? null,
          affiliateId: application.affiliate?.id ?? null,
          ipHash,
          userAgent: userAgent ?? null,
          sessionId: sessionId ?? null,
        },
      });

      if (application.influencer) {
        await tx.influencer.update({
          where: { id: application.influencer.id },
          data: { totalClicks: { increment: 1 } },
        });
      } else if (application.affiliate) {
        await tx.affiliate.update({
          where: { id: application.affiliate.id },
          data: { totalClicks: { increment: 1 } },
        });
      }
    });
  }

  async getPartnerDashboard(refCode: string) {
    const application = await prisma.partnerApplication.findUnique({
      where: { refCode },
      include: {
        influencer: {
          include: {
            commissions: { orderBy: { createdAt: 'desc' }, take: 20 },
            withdrawals: { orderBy: { requestedAt: 'desc' }, take: 10 },
          },
        },
        affiliate: {
          include: {
            commissions: { orderBy: { createdAt: 'desc' }, take: 20 },
            withdrawals: { orderBy: { requestedAt: 'desc' }, take: 10 },
          },
        },
      },
    });

    if (!application) return null;

    const partner = application.influencer ?? application.affiliate;
    if (!partner) return null;

    const totalClicks = await prisma.referralClick.count({ where: { refCode } });

    return {
      application: {
        id: application.id,
        type: application.type,
        status: application.status,
        refCode: application.refCode,
        email: application.email,
        walletAddress: application.walletAddress,
      },
      partner: {
        id: partner.id,
        tier: partner.tier as string,
        totalSales: partner.totalSales,
        totalEarned: partner.totalEarned.toString(),
        pendingEarned: partner.pendingEarned.toString(),
        totalClicks,
        isActive: partner.isActive,
        commissions: partner.commissions.map((c: { id: string; orderId: string; orderType: unknown; orderAmount: { toString: () => string }; ezziAmount: { toString: () => string }; ratePercent: { toString: () => string }; status: unknown; lockedUntil: Date; paidAt: Date | null; createdAt: Date }) => ({
          id: c.id,
          orderId: c.orderId,
          orderType: c.orderType as string,
          orderAmount: c.orderAmount.toString(),
          ezziAmount: c.ezziAmount.toString(),
          ratePercent: c.ratePercent.toString(),
          status: c.status as string,
          lockedUntil: c.lockedUntil,
          paidAt: c.paidAt,
          createdAt: c.createdAt,
        })),
        withdrawals: partner.withdrawals.map((w: { id: string; walletAddress: string; ezziAmount: { toString: () => string }; method: unknown; status: unknown; requestedAt: Date; processedAt: Date | null }) => ({
          id: w.id,
          walletAddress: w.walletAddress,
          ezziAmount: w.ezziAmount.toString(),
          method: w.method as string,
          status: w.status as string,
          requestedAt: w.requestedAt,
          processedAt: w.processedAt,
        })),
      },
    };
  }

  async requestWithdrawal(params: {
    refCode: string;
    walletAddress: string;
    ezziAmount: number;
  }): Promise<void> {
    const { refCode, walletAddress, ezziAmount } = params;

    const application = await prisma.partnerApplication.findUnique({
      where: { refCode },
      include: {
        influencer: { select: { id: true, pendingEarned: true } },
        affiliate: { select: { id: true, pendingEarned: true } },
      },
    });

    if (!application || application.status !== 'APPROVED') {
      throw new Error('Partner not found or not approved');
    }

    const partner = application.influencer ?? application.affiliate;
    if (!partner) throw new Error('Partner record not found');

    const available = parseFloat(partner.pendingEarned.toString());
    if (ezziAmount > available) {
      throw new Error('Amount exceeds available pending balance');
    }

    await prisma.$transaction(async (tx: PrismaClient) => {
      await tx.withdrawal.create({
        data: {
          influencerId: application.influencer?.id ?? null,
          affiliateId: application.affiliate?.id ?? null,
          walletAddress,
          ezziAmount,
          method: 'EZZI_COIN',
          status: 'REQUESTED',
        },
      });

      if (application.influencer) {
        await tx.influencer.update({
          where: { id: application.influencer.id },
          data: { pendingEarned: { decrement: ezziAmount } },
        });
      } else if (application.affiliate) {
        await tx.affiliate.update({
          where: { id: application.affiliate.id },
          data: { pendingEarned: { decrement: ezziAmount } },
        });
      }
    });
  }

  async getApplicationByEmail(email: string) {
    return prisma.partnerApplication.findFirst({
      where: { email },
      select: {
        id: true,
        type: true,
        status: true,
        refCode: true,
        createdAt: true,
        rejectionReason: true,
      },
    });
  }
}

export const commissionService = new CommissionService();

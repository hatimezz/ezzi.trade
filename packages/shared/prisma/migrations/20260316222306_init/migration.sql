-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('INFLUENCER', 'AFFILIATE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InfluencerTier" AS ENUM ('NANO', 'MICRO', 'MID', 'MACRO');

-- CreateEnum
CREATE TYPE "AffiliateTier" AS ENUM ('STARTER', 'SILVER', 'GOLD', 'DIAMOND');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('NFT_PURCHASE', 'CAPSULE_PURCHASE', 'TOKEN_PURCHASE');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'FRAUD');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('EZZI_COIN', 'USDC', 'NFT_REWARD');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'MODERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "targetId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMsg" TEXT NOT NULL DEFAULT 'EZZI World is undergoing maintenance. Back soon.',
    "presaleActive" BOOLEAN NOT NULL DEFAULT true,
    "presalePhase" INTEGER NOT NULL DEFAULT 1,
    "presalePrice" DECIMAL(10,6) NOT NULL DEFAULT 0.015,
    "presaleTarget" DECIMAL(18,2) NOT NULL DEFAULT 100000,
    "presaleRaised" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "presaleEndDate" TIMESTAMP(3),
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "capsuleOpen" BOOLEAN NOT NULL DEFAULT true,
    "marketplaceOpen" BOOLEAN NOT NULL DEFAULT true,
    "announcementBar" TEXT,
    "announcementActive" BOOLEAN NOT NULL DEFAULT false,
    "ezziPriceUsd" DECIMAL(10,6) NOT NULL DEFAULT 0.015,
    "solPriceUsd" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "country" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" TIMESTAMP(3),
    "suspendedUntil" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "bannedAt" TIMESTAMP(3),
    "bannedReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'solana',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "source" TEXT,
    "referrer" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warrior" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "totalSupply" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "attack" INTEGER NOT NULL DEFAULT 0,
    "defense" INTEGER NOT NULL DEFAULT 0,
    "speed" INTEGER NOT NULL DEFAULT 0,
    "magic" INTEGER NOT NULL DEFAULT 0,
    "miningRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "lore" TEXT,
    "ability" TEXT,
    "abilityDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warrior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFT" (
    "id" TEXT NOT NULL,
    "warriorId" TEXT NOT NULL,
    "tokenId" TEXT,
    "editionNumber" INTEGER NOT NULL DEFAULT 1,
    "ownerId" TEXT,
    "durability" INTEGER NOT NULL DEFAULT 100,
    "saleCount" INTEGER NOT NULL DEFAULT 0,
    "isStaked" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "metadataUri" TEXT,
    "mintedAt" TIMESTAMP(3),
    "mintedBy" TEXT,

    CONSTRAINT "NFT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceUsd" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soldAt" TIMESTAMP(3),
    "buyerId" TEXT,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "earnedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapsuleTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "totalSupply" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "commonRate" INTEGER NOT NULL DEFAULT 0,
    "rareRate" INTEGER NOT NULL DEFAULT 0,
    "epicRate" INTEGER NOT NULL DEFAULT 0,
    "legendaryRate" INTEGER NOT NULL DEFAULT 0,
    "mythicRate" INTEGER NOT NULL DEFAULT 0,
    "ezziRate" INTEGER NOT NULL DEFAULT 0,
    "cssClass" TEXT NOT NULL DEFAULT 'capsule-core',
    "animation" TEXT NOT NULL DEFAULT 'rotate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapsuleTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapsuleOpening" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capsuleTierId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultType" TEXT NOT NULL,
    "resultId" TEXT,
    "amount" DOUBLE PRECISION,
    "rarity" TEXT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapsuleOpening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ezziBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMined" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedTx" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DOUBLE PRECISION NOT NULL,
    "token" TEXT NOT NULL DEFAULT 'SOL',
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "wallet" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresalePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "ezziAmount" DECIMAL(18,2) NOT NULL,
    "usdAmount" DECIMAL(18,2) NOT NULL,
    "solAmount" DECIMAL(18,9),
    "phase" INTEGER NOT NULL DEFAULT 1,
    "pricePerEzzi" DECIMAL(10,6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "txHash" TEXT,
    "refCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresalePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "walletAddress" TEXT NOT NULL,
    "email" TEXT,
    "type" "PartnerType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "twitterHandle" TEXT,
    "followersCount" INTEGER,
    "niches" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'English',
    "bestTweetUrl" TEXT,
    "whyApply" TEXT,
    "estimatedTier" "InfluencerTier",
    "promoteChannel" TEXT,
    "refCode" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Influencer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "twitterHandle" TEXT NOT NULL,
    "tier" "InfluencerTier" NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(18,9) NOT NULL DEFAULT 0,
    "pendingEarned" DECIMAL(18,9) NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "activeCampaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "tier" "AffiliateTier" NOT NULL DEFAULT 'STARTER',
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(18,9) NOT NULL DEFAULT 0,
    "pendingEarned" DECIMAL(18,9) NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT,
    "affiliateId" TEXT,
    "orderId" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL,
    "orderAmount" DECIMAL(18,9) NOT NULL,
    "ezziAmount" DECIMAL(18,9) NOT NULL,
    "ratePercent" DECIMAL(5,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "txSignature" TEXT,
    "isFraud" BOOLEAN NOT NULL DEFAULT false,
    "fraudReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralClick" (
    "id" TEXT NOT NULL,
    "refCode" TEXT NOT NULL,
    "influencerId" TEXT,
    "affiliateId" TEXT,
    "ipHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "convertedAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT,
    "affiliateId" TEXT,
    "walletAddress" TEXT NOT NULL,
    "ezziAmount" DECIMAL(18,9) NOT NULL,
    "method" "PayoutMethod" NOT NULL DEFAULT 'EZZI_COIN',
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "txSignature" TEXT,
    "adminNote" TEXT,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "productFocus" TEXT NOT NULL,
    "bonusEzzi" INTEGER NOT NULL DEFAULT 0,
    "targetSales" INTEGER NOT NULL DEFAULT 100,
    "currentSales" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_username_idx" ON "Admin"("username");

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_tier_idx" ON "User"("tier");

-- CreateIndex
CREATE INDEX "User_country_idx" ON "User"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_address_idx" ON "Wallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "WaitlistEntry_email_idx" ON "WaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "WaitlistEntry_createdAt_idx" ON "WaitlistEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Warrior_name_key" ON "Warrior"("name");

-- CreateIndex
CREATE INDEX "Warrior_zone_idx" ON "Warrior"("zone");

-- CreateIndex
CREATE INDEX "Warrior_rarity_idx" ON "Warrior"("rarity");

-- CreateIndex
CREATE UNIQUE INDEX "NFT_tokenId_key" ON "NFT"("tokenId");

-- CreateIndex
CREATE INDEX "NFT_warriorId_idx" ON "NFT"("warriorId");

-- CreateIndex
CREATE INDEX "NFT_ownerId_idx" ON "NFT"("ownerId");

-- CreateIndex
CREATE INDEX "NFT_isStaked_idx" ON "NFT"("isStaked");

-- CreateIndex
CREATE INDEX "NFT_isFlagged_idx" ON "NFT"("isFlagged");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListing_nftId_key" ON "MarketplaceListing"("nftId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_sellerId_idx" ON "MarketplaceListing"("sellerId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_idx" ON "MarketplaceListing"("status");

-- CreateIndex
CREATE INDEX "MarketplaceListing_price_idx" ON "MarketplaceListing"("price");

-- CreateIndex
CREATE INDEX "MiningSession_userId_idx" ON "MiningSession"("userId");

-- CreateIndex
CREATE INDEX "MiningSession_status_idx" ON "MiningSession"("status");

-- CreateIndex
CREATE INDEX "MiningSession_startedAt_idx" ON "MiningSession"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CapsuleTier_name_key" ON "CapsuleTier"("name");

-- CreateIndex
CREATE INDEX "CapsuleOpening_userId_idx" ON "CapsuleOpening"("userId");

-- CreateIndex
CREATE INDEX "CapsuleOpening_capsuleTierId_idx" ON "CapsuleOpening"("capsuleTierId");

-- CreateIndex
CREATE INDEX "CapsuleOpening_resultType_idx" ON "CapsuleOpening"("resultType");

-- CreateIndex
CREATE UNIQUE INDEX "UserBalance_userId_key" ON "UserBalance"("userId");

-- CreateIndex
CREATE INDEX "UserBalance_userId_idx" ON "UserBalance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedTx_txHash_key" ON "ProcessedTx"("txHash");

-- CreateIndex
CREATE INDEX "ProcessedTx_txHash_idx" ON "ProcessedTx"("txHash");

-- CreateIndex
CREATE INDEX "ProcessedTx_type_idx" ON "ProcessedTx"("type");

-- CreateIndex
CREATE INDEX "ProcessedTx_status_idx" ON "ProcessedTx"("status");

-- CreateIndex
CREATE INDEX "ProcessedTx_userId_idx" ON "ProcessedTx"("userId");

-- CreateIndex
CREATE INDEX "ProcessedTx_processedAt_idx" ON "ProcessedTx"("processedAt");

-- CreateIndex
CREATE INDEX "LiveEvent_type_idx" ON "LiveEvent"("type");

-- CreateIndex
CREATE INDEX "LiveEvent_createdAt_idx" ON "LiveEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PresalePurchase_txHash_key" ON "PresalePurchase"("txHash");

-- CreateIndex
CREATE INDEX "PresalePurchase_userId_idx" ON "PresalePurchase"("userId");

-- CreateIndex
CREATE INDEX "PresalePurchase_phase_idx" ON "PresalePurchase"("phase");

-- CreateIndex
CREATE INDEX "PresalePurchase_status_idx" ON "PresalePurchase"("status");

-- CreateIndex
CREATE INDEX "PresalePurchase_createdAt_idx" ON "PresalePurchase"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerApplication_refCode_key" ON "PartnerApplication"("refCode");

-- CreateIndex
CREATE INDEX "PartnerApplication_status_idx" ON "PartnerApplication"("status");

-- CreateIndex
CREATE INDEX "PartnerApplication_type_idx" ON "PartnerApplication"("type");

-- CreateIndex
CREATE INDEX "PartnerApplication_refCode_idx" ON "PartnerApplication"("refCode");

-- CreateIndex
CREATE UNIQUE INDEX "Influencer_applicationId_key" ON "Influencer"("applicationId");

-- CreateIndex
CREATE INDEX "Influencer_twitterHandle_idx" ON "Influencer"("twitterHandle");

-- CreateIndex
CREATE INDEX "Influencer_tier_idx" ON "Influencer"("tier");

-- CreateIndex
CREATE INDEX "Influencer_totalSales_idx" ON "Influencer"("totalSales");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_applicationId_key" ON "Affiliate"("applicationId");

-- CreateIndex
CREATE INDEX "Affiliate_tier_idx" ON "Affiliate"("tier");

-- CreateIndex
CREATE INDEX "Affiliate_totalSales_idx" ON "Affiliate"("totalSales");

-- CreateIndex
CREATE INDEX "Commission_influencerId_idx" ON "Commission"("influencerId");

-- CreateIndex
CREATE INDEX "Commission_affiliateId_idx" ON "Commission"("affiliateId");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE INDEX "Commission_orderId_idx" ON "Commission"("orderId");

-- CreateIndex
CREATE INDEX "ReferralClick_refCode_idx" ON "ReferralClick"("refCode");

-- CreateIndex
CREATE INDEX "ReferralClick_createdAt_idx" ON "ReferralClick"("createdAt");

-- CreateIndex
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFT" ADD CONSTRAINT "NFT_warriorId_fkey" FOREIGN KEY ("warriorId") REFERENCES "Warrior"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFT" ADD CONSTRAINT "NFT_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiningSession" ADD CONSTRAINT "MiningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiningSession" ADD CONSTRAINT "MiningSession_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapsuleOpening" ADD CONSTRAINT "CapsuleOpening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapsuleOpening" ADD CONSTRAINT "CapsuleOpening_capsuleTierId_fkey" FOREIGN KEY ("capsuleTierId") REFERENCES "CapsuleTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBalance" ADD CONSTRAINT "UserBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresalePurchase" ADD CONSTRAINT "PresalePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PartnerApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_activeCampaignId_fkey" FOREIGN KEY ("activeCampaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PartnerApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

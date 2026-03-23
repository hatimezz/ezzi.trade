-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'solana',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Warrior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "totalSupply" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "attack" INTEGER NOT NULL DEFAULT 0,
    "defense" INTEGER NOT NULL DEFAULT 0,
    "speed" INTEGER NOT NULL DEFAULT 0,
    "magic" INTEGER NOT NULL DEFAULT 0,
    "miningRate" REAL NOT NULL DEFAULT 1,
    "lore" TEXT,
    "ability" TEXT,
    "abilityDesc" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NFT" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warriorId" TEXT NOT NULL,
    "tokenId" TEXT,
    "editionNumber" INTEGER NOT NULL DEFAULT 1,
    "ownerId" TEXT,
    "durability" INTEGER NOT NULL DEFAULT 100,
    "saleCount" INTEGER NOT NULL DEFAULT 0,
    "isStaked" BOOLEAN NOT NULL DEFAULT false,
    "metadataUri" TEXT,
    "mintedAt" DATETIME,
    "mintedBy" TEXT,
    CONSTRAINT "NFT_warriorId_fkey" FOREIGN KEY ("warriorId") REFERENCES "Warrior" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NFT_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nftId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "priceUsd" REAL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "soldAt" DATETIME,
    "buyerId" TEXT,
    CONSTRAINT "MarketplaceListing_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MarketplaceListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MiningSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "earnedAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MiningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MiningSession_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CapsuleTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "price" REAL NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CapsuleOpening" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "capsuleTierId" TEXT NOT NULL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultType" TEXT NOT NULL,
    "resultId" TEXT,
    "amount" REAL,
    "rarity" TEXT,
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CapsuleOpening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CapsuleOpening_capsuleTierId_fkey" FOREIGN KEY ("capsuleTierId") REFERENCES "CapsuleTier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ezziBalance" REAL NOT NULL DEFAULT 0,
    "totalMined" REAL NOT NULL DEFAULT 0,
    "totalEarned" REAL NOT NULL DEFAULT 0,
    "totalSpent" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessedTx" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "txHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" REAL NOT NULL,
    "token" TEXT NOT NULL DEFAULT 'SOL',
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" TEXT,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

// ============================================
// EZZI WORLD - SHARED TYPES
// ============================================

export enum Zone {
  NEON_CITY = 'NEON_CITY',
  DESERT_STORM = 'DESERT_STORM',
  DEEP_OCEAN = 'DEEP_OCEAN',
  VOLCANO = 'VOLCANO',
  TUNDRA = 'TUNDRA',
  THE_VOID = 'THE_VOID',
  SPECIAL = 'SPECIAL',
}

export enum Rarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum CapsuleTier {
  CORE = 'CORE',
  SURGE = 'SURGE',
  VOID = 'VOID',
  CELESTIAL = 'CELESTIAL',
  GENESIS = 'GENESIS',
}

export enum TxType {
  PAYMENT = 'payment',
  WITHDRAWAL = 'withdrawal',
  REWARD = 'reward',
  CAPSULE_PURCHASE = 'capsule_purchase',
  NFT_PURCHASE = 'nft_purchase',
  NFT_SALE = 'nft_sale',
  PRESALE_PURCHASE = 'presale_purchase',
}

export enum TxStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

// ============================================
// WARRIOR TYPES
// ============================================

export interface WarriorStats {
  attack: number;
  defense: number;
  speed: number;
  magic: number;
  miningRate: number; // Multiplier (1x, 2x, etc.)
}

export interface Warrior {
  id: string;
  name: string;
  displayName: string;
  zone: Zone;
  rarity: Rarity;
  basePrice: number; // in SOL
  totalSupply: number;
  imageUrl: string;
  stats: WarriorStats;
  lore?: string;
  ability?: string;
  abilityDesc?: string;
}

// ============================================
// NFT TYPES
// ============================================

export interface NFT {
  id: string;
  warriorId: string;
  warrior: Warrior;
  tokenId?: string;
  editionNumber: number;
  ownerId?: string;
  durability: number; // 0-100%
  saleCount: number;
  isStaked: boolean;
  metadataUri?: string;
  mintedAt?: Date;
  mintedBy?: string;
}

// ============================================
// MARKETPLACE TYPES
// ============================================

export interface MarketplaceListing {
  id: string;
  nftId: string;
  nft: NFT;
  sellerId: string;
  price: number; // in SOL
  priceUsd?: number;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  soldAt?: Date;
  buyerId?: string;
}

export interface NFTPurchaseRequest {
  nftId: string;
  buyerAddress: string;
  txHash: string;
}

export interface NFTListRequest {
  nftId: string;
  price: number; // in SOL
}

// ============================================
// MINING TYPES
// ============================================

export interface MiningSession {
  id: string;
  userId: string;
  nftId: string;
  nft: NFT;
  zone: Zone;
  startedAt: Date;
  endedAt?: Date;
  earnedAmount: number;
  status: 'active' | 'paused' | 'completed';
}

export interface StartMiningRequest {
  nftId: string;
  zone: Zone;
}

export interface MiningRate {
  baseRate: number;
  rarityMultiplier: number;
  zoneMultiplier: number;
  durabilityMultiplier: number;
  totalRate: number;
}

// ============================================
// CAPSULE TYPES
// ============================================

export interface CapsuleTierInfo {
  id: string;
  name: CapsuleTier;
  displayName: string;
  price: number;
  totalSupply: number;
  remaining: number;
  rarityRates: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
    ezzi: number;
  };
  cssClass: string;
  animation: string;
}

export interface CapsuleOpening {
  id: string;
  userId: string;
  capsuleTierId: string;
  openedAt: Date;
  resultType: 'nft' | 'ezzi';
  resultId?: string;
  amount?: number;
  rarity?: Rarity;
  txHash?: string;
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBalance {
  id: string;
  userId: string;
  ezziBalance: number;
  totalMined: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  chain: string;
  isPrimary: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface NFTFilter {
  rarity?: Rarity;
  zone?: Zone;
  minPrice?: number;
  maxPrice?: number;
  ownerId?: string;
  isListed?: boolean;
}

// ============================================
// LIVE FEED TYPES
// ============================================

export interface LiveEvent {
  id: string;
  type: 'nft_purchase' | 'capsule_open' | 'mining_claim' | 'new_user';
  message: string;
  walletAddress: string;
  avatarUrl?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================
// STATS TYPES
// ============================================

export interface PlatformStats {
  totalWarriors: number;
  totalCapsulesOpened: number;
  totalEzziMined: number;
  totalUsers: number;
  totalCountries: number;
}

export interface ZoneStats {
  zone: Zone;
  minersCount: number;
  totalMined: number;
  topMiner?: string;
}

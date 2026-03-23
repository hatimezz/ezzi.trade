import { z } from 'zod';

// Zone enum validation
const ZoneEnum = z.enum([
  'NEON_CITY',
  'DESERT_STORM',
  'DEEP_OCEAN',
  'VOLCANO',
  'TUNDRA',
  'THE_VOID',
  'SPECIAL',
]);

// Rarity enum validation
const RarityEnum = z.enum(['common', 'rare', 'epic', 'legendary', 'mythic']);

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// NFT schemas
export const ListNFTSchema = z.object({
  nftId: z.string().cuid(),
  price: z.number().positive().max(10000),
});

export const BuyNFTSchema = z.object({
  listingId: z.string().cuid(),
  txHash: z.string().min(32),
});

// Mining schemas
export const StartMiningSchema = z.object({
  nftId: z.string().cuid(),
  zone: ZoneEnum,
});

export const EndMiningSchema = z.object({
  sessionId: z.string().cuid(),
});

// Capsule schemas
export const OpenCapsuleSchema = z.object({
  capsuleTierId: z.string().cuid(),
});

// Marketplace filter schemas
export const MarketplaceFilterSchema = z.object({
  rarity: RarityEnum.optional(),
  zone: ZoneEnum.optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
});

// Wallet connection schema
export const ConnectWalletSchema = z.object({
  address: z.string().min(32).max(44),
  chain: z.enum(['solana', 'ethereum']).default('solana'),
  signature: z.string().min(64),
  message: z.string(),
});

// Types
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ListNFTInput = z.infer<typeof ListNFTSchema>;
export type BuyNFTInput = z.infer<typeof BuyNFTSchema>;
export type StartMiningInput = z.infer<typeof StartMiningSchema>;
export type OpenCapsuleInput = z.infer<typeof OpenCapsuleSchema>;

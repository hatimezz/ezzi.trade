// ============================================
// 8 GENESIS WARRIORS
// ============================================

import { Warrior, Zone, Rarity } from './types';

export const GENESIS_WARRIORS: Warrior[] = [
  {
    id: 'kronos',
    name: 'kronos',
    displayName: 'KRONOS — The Timekeeper',
    zone: Zone.THE_VOID,
    rarity: Rarity.MYTHIC,
    basePrice: 250,
    totalSupply: 23,
    imageUrl: '/nft/kronos.png',
    attack: 95,
    defense: 70,
    speed: 88,
    magic: 99,
    miningRate: 10,
    lore: 'He discovered EZZI energy 1000 years ago and chose to become it.',
    ability: 'Time Fracture',
    abilityDesc: 'Doubles all earnings for 24h every 7 days',
  },
  {
    id: 'kira',
    name: 'kira',
    displayName: 'KIRA — The Ember Nova',
    zone: Zone.VOLCANO,
    rarity: Rarity.EPIC,
    basePrice: 65,
    totalSupply: 115,
    imageUrl: '/nft/kira.png',
    attack: 88,
    defense: 65,
    speed: 92,
    magic: 75,
    miningRate: 3,
    lore: 'Born in the ruins of Volcano City, she wears its fire as armor.',
    ability: 'Pyroclast',
    abilityDesc: 'Zone 4 mining rate +50% for 12h',
  },
  {
    id: 'atlas',
    name: 'atlas',
    displayName: 'ATLAS — The Neon Phantom',
    zone: Zone.NEON_CITY,
    rarity: Rarity.RARE,
    basePrice: 39,
    totalSupply: 345,
    imageUrl: '/nft/atlas.png',
    attack: 72,
    defense: 80,
    speed: 85,
    magic: 60,
    miningRate: 1.5,
    lore: 'He runs the Neon City underground — no one sees him unless he allows it.',
    ability: 'Ghost Protocol',
    abilityDesc: 'Invisible in Guild Wars for 2 rounds',
  },
  {
    id: 'cosmos',
    name: 'cosmos',
    displayName: 'COSMOS — The Void Walker',
    zone: Zone.THE_VOID,
    rarity: Rarity.LEGENDARY,
    basePrice: 120,
    totalSupply: 46,
    imageUrl: '/nft/cosmos.png',
    attack: 80,
    defense: 85,
    speed: 70,
    magic: 97,
    miningRate: 8,
    lore: 'He is not from this civilization. He arrived with the EZZI signal.',
    ability: 'Constellation Pull',
    abilityDesc: 'Draws 3% from all Zone 6 miners for 48h',
  },
  {
    id: 'sylvan',
    name: 'sylvan',
    displayName: 'SYLVAN — The Bloom Knight',
    zone: Zone.DESERT_STORM,
    rarity: Rarity.EPIC,
    basePrice: 65,
    totalSupply: 115,
    imageUrl: '/nft/sylvan.png',
    attack: 75,
    defense: 90,
    speed: 65,
    magic: 85,
    miningRate: 2,
    lore: 'He found the ancient EZZI lotus in the ruins of the Sand Kingdoms.',
    ability: 'Lotus Shield',
    abilityDesc: 'Reduces all damage taken by 40% for 3 battles',
  },
  {
    id: 'seraph',
    name: 'seraph',
    displayName: 'SERAPH — The Crystal Wing',
    zone: Zone.TUNDRA,
    rarity: Rarity.LEGENDARY,
    basePrice: 120,
    totalSupply: 46,
    imageUrl: '/nft/seraph.png',
    attack: 78,
    defense: 95,
    speed: 78,
    magic: 88,
    miningRate: 4,
    lore: 'Guardian of the Frozen Citadel. His wing is a fragment of the EZZI crystal.',
    ability: 'Crystal Aegis',
    abilityDesc: 'All Squad members +25% DEF for Guild Wars',
  },
  {
    id: 'solaris',
    name: 'solaris',
    displayName: 'SOLARIS — The Solar Sovereign',
    zone: Zone.SPECIAL,
    rarity: Rarity.MYTHIC,
    basePrice: 250,
    totalSupply: 23,
    imageUrl: '/nft/solaris.png',
    attack: 90,
    defense: 98,
    speed: 75,
    magic: 95,
    miningRate: 10,
    lore: 'The original guardian of the EZZI Sun Temple. He awakens when summoned.',
    ability: 'Solar Dominion',
    abilityDesc: '+100% mining across ALL zones for 6h (once/week)',
  },
  {
    id: 'ignite',
    name: 'ignite',
    displayName: 'IGNITE — The Circuit Racer',
    zone: Zone.VOLCANO,
    rarity: Rarity.RARE,
    basePrice: 39,
    totalSupply: 345,
    imageUrl: '/nft/ignite.png',
    attack: 85,
    defense: 60,
    speed: 98,
    magic: 55,
    miningRate: 2,
    lore: 'Fastest miner in Volcano City. He finished a 10-hour quest in 40 minutes.',
    ability: 'Afterburn',
    abilityDesc: 'Wins PvP ties automatically, +10% speed stat stacking',
  },
];

// ============================================
// CAPSULE TIERS
// ============================================

import { CapsuleTier } from './types';

export const CAPSULE_TIERS: CapsuleTier[] = [
  {
    id: 'core',
    name: 'CORE',
    displayName: 'Core Capsule',
    price: 23,
    totalSupply: 10000,
    remaining: 10000,
    commonRate: 55,
    rareRate: 20,
    epicRate: 10,
    legendaryRate: 3,
    mythicRate: 0.5,
    ezziRate: 11.5,
    cssClass: 'capsule-core',
    animation: 'rotate-slow',
  },
  {
    id: 'surge',
    name: 'SURGE',
    displayName: 'Surge Capsule',
    price: 45,
    totalSupply: 6000,
    remaining: 6000,
    commonRate: 25,
    rareRate: 35,
    epicRate: 20,
    legendaryRate: 8,
    mythicRate: 2,
    ezziRate: 10,
    cssClass: 'capsule-surge',
    animation: 'rotate-fast',
  },
  {
    id: 'void',
    name: 'VOID',
    displayName: 'Void Capsule',
    price: 89,
    totalSupply: 4000,
    remaining: 4000,
    commonRate: 10,
    rareRate: 25,
    epicRate: 30,
    legendaryRate: 20,
    mythicRate: 8,
    ezziRate: 7,
    cssClass: 'capsule-void',
    animation: 'glitch',
  },
  {
    id: 'celestial',
    name: 'CELESTIAL',
    displayName: 'Celestial Capsule',
    price: 149,
    totalSupply: 2000,
    remaining: 2000,
    commonRate: 0,
    rareRate: 20,
    epicRate: 35,
    legendaryRate: 30,
    mythicRate: 15,
    ezziRate: 0,
    cssClass: 'capsule-celestial',
    animation: 'pulse-gold',
  },
  {
    id: 'genesis',
    name: 'GENESIS',
    displayName: 'Genesis Capsule',
    price: 299,
    totalSupply: 1000,
    remaining: 1000,
    commonRate: 0,
    rareRate: 0,
    epicRate: 20,
    legendaryRate: 40,
    mythicRate: 35,
    ezziRate: 5,
    cssClass: 'capsule-genesis',
    animation: 'prismatic',
  },
];

// ============================================
// GAME CONSTANTS
// ============================================

export const GAME_CONSTANTS = {
  // Mining
  BASE_MINING_RATE: 0.1, // EZZI per hour
  DURABILITY_DECAY_PER_MINE: 1, // -1% per mining session
  REPAIR_COST_PER_PERCENT: 0.5, // EZZI cost to repair 1%

  // Price Increase
  PRICE_INCREASE_PERCENT: 2, // 2% per sale

  // Staking
  MINING_BOOST_PER_ZONE_MATCH: 0.25, // +25% if warrior zone matches mining zone

  // Capsules
  EZZI_DROP_MIN: { core: 500, surge: 2000, void: 5000, celestial: 10000, genesis: 20000 },
  EZZI_DROP_MAX: { core: 2000, surge: 5000, void: 15000, celestial: 30000, genesis: 50000 },
} as const;

// ============================================
// SOCIAL LINKS
// ============================================

export const SOCIAL_LINKS = {
  discord: 'https://discord.com/invite/ZHtjbtpFXG',
  twitter: 'https://x.com/Ezzitrade',
  telegram: 'https://t.me/ezziworld',
} as const;

// ============================================
// CAPSULE TIERS
// ============================================

import { CapsuleTierInfo } from './types';

export const CAPSULE_TIERS: CapsuleTierInfo[] = [
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
  BASE_MINING_RATE: 0.1,
  DURABILITY_DECAY_PER_MINE: 1,
  REPAIR_COST_PER_PERCENT: 0.5,
  PRICE_INCREASE_PERCENT: 2,
  MINING_BOOST_PER_ZONE_MATCH: 0.25,
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

// ============================================
// EZZI WORLD - WARRIOR CONSTANTS
// 8 Genesis Warriors with 2,300 total supply
// ============================================

import { Zone, Rarity, Warrior } from './types';

export const GENESIS_WARRIORS: Warrior[] = [
  {
    id: 'warrior-kronos',
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
    id: 'warrior-kira',
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
    id: 'warrior-atlas',
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
    id: 'warrior-cosmos',
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
    id: 'warrior-sylvan',
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
    id: 'warrior-seraph',
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
    id: 'warrior-solaris',
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
    id: 'warrior-ignite',
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
// HELPER FUNCTIONS
// ============================================

export function getWarriorByName(name: string): Warrior | undefined {
  return GENESIS_WARRIORS.find(w => w.name === name.toLowerCase());
}

export function getWarriorById(id: string): Warrior | undefined {
  return GENESIS_WARRIORS.find(w => w.id === id);
}

export function getWarriorsByZone(zone: Zone): Warrior[] {
  return GENESIS_WARRIORS.filter(w => w.zone === zone);
}

export function getWarriorsByRarity(rarity: Rarity): Warrior[] {
  return GENESIS_WARRIORS.filter(w => w.rarity === rarity);
}

export function getAllWarriors(): Warrior[] {
  return [...GENESIS_WARRIORS];
}

// ============================================
// RARITY DISTRIBUTION
// ============================================

export const RARITY_DISTRIBUTION = {
  [Rarity.MYTHIC]: { count: 46, percentage: 2 },    // 23 each: Kronos, Solaris
  [Rarity.LEGENDARY]: { count: 92, percentage: 4 },  // 46 each: Cosmos, Seraph
  [Rarity.EPIC]: { count: 230, percentage: 10 },    // 115 each: Kira, Sylvan
  [Rarity.RARE]: { count: 690, percentage: 30 },    // 345 each: Atlas, Ignite
  [Rarity.COMMON]: { count: 1242, percentage: 54 }, // Generated variants
} as const;

export const TOTAL_NFT_SUPPLY = 2300;

// Zone multipliers for mining
export const ZONE_MULTIPLIERS: Record<Zone, number> = {
  [Zone.NEON_CITY]: 1.0,
  [Zone.DESERT_STORM]: 1.2,
  [Zone.DEEP_OCEAN]: 1.4,
  [Zone.VOLCANO]: 1.6,
  [Zone.TUNDRA]: 1.8,
  [Zone.THE_VOID]: 2.0,
  [Zone.SPECIAL]: 2.5,
};

// Zone colors for UI
export const ZONE_COLORS: Record<Zone, string> = {
  [Zone.NEON_CITY]: '#00ff9f',
  [Zone.DESERT_STORM]: '#ff8c00',
  [Zone.DEEP_OCEAN]: '#0080ff',
  [Zone.VOLCANO]: '#ff3300',
  [Zone.TUNDRA]: '#a8d8ff',
  [Zone.THE_VOID]: '#cc00ff',
  [Zone.SPECIAL]: '#ffd700',
};

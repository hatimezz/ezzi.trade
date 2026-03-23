import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Zone and Rarity as strings for SQLite
const Zone = {
  NEON_CITY: 'NEON_CITY',
  DESERT_STORM: 'DESERT_STORM',
  DEEP_OCEAN: 'DEEP_OCEAN',
  VOLCANO: 'VOLCANO',
  TUNDRA: 'TUNDRA',
  THE_VOID: 'THE_VOID',
  SPECIAL: 'SPECIAL',
} as const;

const Rarity = {
  common: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
  mythic: 'mythic',
} as const;

// Warrior data (embedded so seed works without built shared package)
const GENESIS_WARRIORS = [
  {
    id: 'warrior-kronos',
    name: 'kronos',
    displayName: 'KRONOS — The Timekeeper',
    zone: Zone.THE_VOID,
    rarity: Rarity.mythic,
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
    rarity: Rarity.epic,
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
    rarity: Rarity.rare,
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
    rarity: Rarity.legendary,
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
    rarity: Rarity.epic,
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
    rarity: Rarity.legendary,
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
    rarity: Rarity.mythic,
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
    rarity: Rarity.rare,
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

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.capsuleOpening.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.miningSession.deleteMany();
  await prisma.nFT.deleteMany();
  await prisma.warrior.deleteMany();
  await prisma.capsuleTier.deleteMany();
  await prisma.processedTx.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userBalance.deleteMany();
  await prisma.user.deleteMany();

  // Seed Warriors
  console.log('Seeding warriors...');
  for (const warrior of GENESIS_WARRIORS) {
    await prisma.warrior.create({
      data: {
        id: warrior.id,
        name: warrior.name,
        displayName: warrior.displayName,
        zone: warrior.zone,
        rarity: warrior.rarity,
        basePrice: warrior.basePrice,
        totalSupply: warrior.totalSupply,
        imageUrl: warrior.imageUrl,
        attack: warrior.attack,
        defense: warrior.defense,
        speed: warrior.speed,
        magic: warrior.magic,
        miningRate: warrior.miningRate,
        lore: warrior.lore,
        ability: warrior.ability,
        abilityDesc: warrior.abilityDesc,
      },
    });
  }
  console.log(`✅ Seeded ${GENESIS_WARRIORS.length} warriors`);

  // Seed Capsule Tiers
  console.log('Seeding capsule tiers...');
  const capsuleTiers = [
    {
      name: 'CORE',
      displayName: 'Core Capsule',
      price: 23,
      totalSupply: 10000,
      remaining: 10000,
      commonRate: 55,
      rareRate: 20,
      epicRate: 10,
      legendaryRate: 3,
      mythicRate: 0,
      ezziRate: 12,
      cssClass: 'capsule-core',
      animation: 'rotate',
    },
    {
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
      animation: 'pulse',
    },
    {
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
      animation: 'glow',
    },
    {
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

  for (const tier of capsuleTiers) {
    await prisma.capsuleTier.create({
      data: {
        name: tier.name,
        displayName: tier.displayName,
        price: tier.price,
        totalSupply: tier.totalSupply,
        remaining: tier.remaining,
        commonRate: tier.commonRate,
        rareRate: tier.rareRate,
        epicRate: tier.epicRate,
        legendaryRate: tier.legendaryRate,
        mythicRate: tier.mythicRate,
        ezziRate: tier.ezziRate,
        cssClass: tier.cssClass,
        animation: tier.animation,
      },
    });
  }
  console.log(`✅ Seeded ${capsuleTiers.length} capsule tiers`);

  // Create admin user
  console.log('Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ezzi.trade',
      username: 'admin',
      displayName: 'EZZI Admin',
      isAdmin: true,
    },
  });

  await prisma.userBalance.create({
    data: {
      userId: admin.id,
      ezziBalance: 0,
      totalMined: 0,
      totalEarned: 0,
      totalSpent: 0,
    },
  });

  console.log('✅ Created admin user');

  console.log('\n🎉 Database seed completed successfully!');
  console.log(`   - ${GENESIS_WARRIORS.length} warriors`);
  console.log(`   - ${capsuleTiers.length} capsule tiers`);
  console.log(`   - 1 admin user`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

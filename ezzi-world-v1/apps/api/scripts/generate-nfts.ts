/**
 * NFT Generation System for EZZI World
 * Generates 2,300 unique NFTs from 8 base warriors
 */

import { PrismaClient, Rarity, Zone } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Configuration
const TOTAL_SUPPLY = 2300;
const BATCH_SIZE = 100;

// Rarity distribution
const RARITY_DISTRIBUTION = {
  mythic: { count: 46, percentage: 2 },     // 23 each: Kronos, Solaris
  legendary: { count: 92, percentage: 4 }, // 46 each: Cosmos, Seraph
  epic: { count: 230, percentage: 10 },   // 115 each: Kira, Sylvan
  rare: { count: 690, percentage: 30 },    // 345 each: Atlas, Ignite
  common: { count: 1242, percentage: 54 },  // 155 each: variants
};

// Base warriors (8 genesis)
const BASE_WARRIORS = [
  {
    id: 'warrior-kronos',
    name: 'kronos',
    displayName: 'KRONOS — The Timekeeper',
    zone: Zone.THE_VOID,
    rarity: Rarity.mythic,
    image: 'kronos.png',
  },
  {
    id: 'warrior-kira',
    name: 'kira',
    displayName: 'KIRA — The Ember Nova',
    zone: Zone.VOLCANO,
    rarity: Rarity.epic,
    image: 'kira.png',
  },
  {
    id: 'warrior-atlas',
    name: 'atlas',
    displayName: 'ATLAS — The Neon Phantom',
    zone: Zone.NEON_CITY,
    rarity: Rarity.rare,
    image: 'atlas.png',
  },
  {
    id: 'warrior-cosmos',
    name: 'cosmos',
    displayName: 'COSMOS — The Void Walker',
    zone: Zone.THE_VOID,
    rarity: Rarity.legendary,
    image: 'cosmos.png',
  },
  {
    id: 'warrior-sylvan',
    name: 'sylvan',
    displayName: 'SYLVAN — The Bloom Knight',
    zone: Zone.DESERT_STORM,
    rarity: Rarity.epic,
    image: 'sylvan.png',
  },
  {
    id: 'warrior-seraph',
    name: 'seraph',
    displayName: 'SERAPH — The Crystal Wing',
    zone: Zone.TUNDRA,
    rarity: Rarity.legendary,
    image: 'seraph.png',
  },
  {
    id: 'warrior-solaris',
    name: 'solaris',
    displayName: 'SOLARIS — The Solar Sovereign',
    zone: Zone.SPECIAL,
    rarity: Rarity.mythic,
    image: 'solaris.png',
  },
  {
    id: 'warrior-ignite',
    name: 'ignite',
    displayName: 'IGNITE — The Circuit Racer',
    zone: Zone.VOLCANO,
    rarity: Rarity.rare,
    image: 'ignite.png',
  },
];

// Generation traits
const TRAITS = {
  backgrounds: [
    { name: 'void', file: 'bg_void.png', zones: [Zone.THE_VOID] },
    { name: 'neon', file: 'bg_neon.png', zones: [Zone.NEON_CITY] },
    { name: 'desert', file: 'bg_desert.png', zones: [Zone.DESERT_STORM] },
    { name: 'ocean', file: 'bg_ocean.png', zones: [Zone.DEEP_OCEAN] },
    { name: 'volcano', file: 'bg_volcano.png', zones: [Zone.VOLCANO] },
    { name: 'tundra', file: 'bg_tundra.png', zones: [Zone.TUNDRA] },
    { name: 'special', file: 'bg_special.png', zones: [Zone.SPECIAL] },
  ],
  effects: [
    { name: 'none', rarity: ['common'] },
    { name: 'glow_cyan', rarity: ['rare'] },
    { name: 'glow_purple', rarity: ['epic'] },
    { name: 'glow_gold', rarity: ['legendary'] },
    { name: 'particles', rarity: ['mythic'] },
    { name: 'prismatic', rarity: ['mythic'] },
  ],
  accessories: [
    { name: 'none', probability: 0.4 },
    { name: 'crown', probability: 0.1, rarity: ['legendary', 'mythic'] },
    { name: 'aura', probability: 0.15, rarity: ['epic', 'legendary', 'mythic'] },
    { name: 'wings', probability: 0.1, rarity: ['epic', 'legendary', 'mythic'] },
    { name: 'halo', probability: 0.15, rarity: ['rare', 'epic', 'legendary', 'mythic'] },
    { name: 'mask', probability: 0.1, rarity: ['rare', 'epic'] },
  ],
};

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  edition: number;
  attributes: Array<{ trait_type: string; value: string | number }>;
}

async function generateNFTs() {
  console.log('🎨 Starting NFT Generation...\n');

  const outputDir = path.join(__dirname, '../../generated-nfts');
  const metadataDir = path.join(outputDir, 'metadata');
  const imagesDir = path.join(outputDir, 'images');

  // Create directories
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(metadataDir)) fs.mkdirSync(metadataDir, { recursive: true });
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  // Generate metadata for all 2,300 NFTs
  let generated = 0;
  const nfts: any[] = [];

  // Generate base warriors first (8)
  for (const warrior of BASE_WARRIORS) {
    const metadata: NFTMetadata = {
      name: warrior.displayName,
      description: generateDescription(warrior),
      image: `${warrior.name}.png`,
      edition: generated + 1,
      attributes: [
        { trait_type: 'Warrior', value: warrior.displayName },
        { trait_type: 'Zone', value: warrior.zone },
        { trait_type: 'Rarity', value: warrior.rarity },
        { trait_type: 'Generation', value: 'Genesis' },
        ...generateStats(warrior.rarity),
      ],
    };

    // Save metadata
    fs.writeFileSync(
      path.join(metadataDir, `${warrior.name}.json`),
      JSON.stringify(metadata, null, 2)
    );

    nfts.push({
      warriorId: warrior.id,
      editionNumber: generated + 1,
      metadata: JSON.stringify(metadata),
      rarity: warrior.rarity,
      zone: warrior.zone,
    });

    generated++;

    if (generated % 100 === 0) {
      console.log(`✅ Generated ${generated}/${TOTAL_SUPPLY} NFTs`);
    }
  }

  // Generate common variants (1,242)
  const commonCount = RARITY_DISTRIBUTION.common.count;
  for (let i = 0; i < commonCount; i++) {
    const baseWarrior = BASE_WARRIORS[i % BASE_WARRIORS.length];
    const variantNumber = Math.floor(i / BASE_WARRIORS.length) + 1;

    const metadata: NFTMetadata = {
      name: `${baseWarrior.displayName} (Common #${variantNumber})`,
      description: generateCommonDescription(baseWarrior, variantNumber),
      image: `${baseWarrior.name}_common_${variantNumber}.png`,
      edition: generated + 1,
      attributes: [
        { trait_type: 'Warrior', value: baseWarrior.displayName },
        { trait_type: 'Zone', value: baseWarrior.zone },
        { trait_type: 'Rarity', value: 'common' },
        { trait_type: 'Generation', value: 'Common' },
        { trait_type: 'Variant', value: variantNumber },
        ...generateStats('common'),
      ],
    };

    fs.writeFileSync(
      path.join(metadataDir, `${baseWarrior.name}_common_${variantNumber}.json`),
      JSON.stringify(metadata, null, 2)
    );

    nfts.push({
      warriorId: baseWarrior.id,
      editionNumber: generated + 1,
      metadata: JSON.stringify(metadata),
      rarity: 'common',
      zone: baseWarrior.zone,
    });

    generated++;

    if (generated % 100 === 0) {
      console.log(`✅ Generated ${generated}/${TOTAL_SUPPLY} NFTs`);
    }
  }

  // Generate rare variants
  const rarePerWarrior = 86; // 690 / 8 ≈ 86
  for (const warrior of BASE_WARRIORS) {
    for (let i = 0; i < rarePerWarrior; i++) {
      const metadata: NFTMetadata = {
        name: `${warrior.displayName} (Rare #${i + 1})`,
        description: generateRareDescription(warrior, i + 1),
        image: `${warrior.name}_rare_${i + 1}.png`,
        edition: generated + 1,
        attributes: [
          { trait_type: 'Warrior', value: warrior.displayName },
          { trait_type: 'Zone', value: warrior.zone },
          { trait_type: 'Rarity', value: 'rare' },
          { trait_type: 'Generation', value: 'Rare' },
          ...generateStats('rare'),
        ],
      };

      fs.writeFileSync(
        path.join(metadataDir, `${warrior.name}_rare_${i + 1}.json`),
        JSON.stringify(metadata, null, 2)
      );

      nfts.push({
        warriorId: warrior.id,
        editionNumber: generated + 1,
        metadata: JSON.stringify(metadata),
        rarity: 'rare',
        zone: warrior.zone,
      });

      generated++;
    }
  }

  // Save batch file for database insertion
  fs.writeFileSync(
    path.join(outputDir, 'nft-batch.json'),
    JSON.stringify(nfts, null, 2)
  );

  console.log(`\n🎉 NFT Generation Complete!`);
  console.log(`📁 Metadata saved to: ${metadataDir}`);
  console.log(`📊 Total NFTs: ${generated}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Upload images to IPFS/Arweave`);
  console.log(`   2. Update metadata with IPFS hashes`);
  console.log(`   3. Run: npx tsx scripts/import-nfts.ts`);

  return nfts;
}

function generateDescription(warrior: any): string {
  const descriptions: Record<string, string> = {
    'warrior-kronos': 'The Timekeeper who discovered EZZI energy 1000 years ago.',
    'warrior-kira': 'Born in the ruins of Volcano City, she wears its fire as armor.',
    'warrior-atlas': 'He runs the Neon City underground — no one sees him unless he allows it.',
    'warrior-cosmos': 'He is not from this civilization. He arrived with the EZZI signal.',
    'warrior-sylvan': 'He found the ancient EZZI lotus in the ruins of the Sand Kingdoms.',
    'warrior-seraph': 'Guardian of the Frozen Citadel. His wing is a fragment of the EZZI crystal.',
    'warrior-solaris': 'The original guardian of the EZZI Sun Temple. He awakens when summoned.',
    'warrior-ignite': 'Fastest miner in Volcano City. He finished a 10-hour quest in 40 minutes.',
  };
  return descriptions[warrior.id] || `A legendary warrior from ${warrior.zone}.`;
}

function generateCommonDescription(warrior: any, variant: number): string {
  return `A common variant of ${warrior.displayName}. Variant #${variant} of the Genesis collection.`;
}

function generateRareDescription(warrior: any, variant: number): string {
  return `A rare variant of ${warrior.displayName} with enhanced abilities. Variant #${variant}.`;
}

function generateStats(rarity: string): Array<{ trait_type: string; value: number }> {
  const baseStats: Record<string, { attack: number; defense: number; speed: number; magic: number; mining: number }> = {
    common: { attack: 50, defense: 50, speed: 50, magic: 50, mining: 1 },
    rare: { attack: 65, defense: 65, speed: 65, magic: 65, mining: 1.5 },
    epic: { attack: 75, defense: 75, speed: 75, magic: 75, mining: 3 },
    legendary: { attack: 85, defense: 85, speed: 85, magic: 85, mining: 8 },
    mythic: { attack: 95, defense: 95, speed: 95, magic: 95, mining: 10 },
  };

  const stats = baseStats[rarity] || baseStats.common;
  return [
    { trait_type: 'ATK', value: stats.attack },
    { trait_type: 'DEF', value: stats.defense },
    { trait_type: 'SPD', value: stats.speed },
    { trait_type: 'MGK', value: stats.magic },
    { trait_type: 'Mining Rate', value: stats.mining },
  ];
}

async function importNFTsToDatabase() {
  console.log('📥 Importing NFTs to database...\n');

  const outputDir = path.join(__dirname, '../../generated-nfts');
  const batchFile = path.join(outputDir, 'nft-batch.json');

  if (!fs.existsSync(batchFile)) {
    console.error('❌ NFT batch file not found. Run generate-nfts.ts first.');
    return;
  }

  const nfts = JSON.parse(fs.readFileSync(batchFile, 'utf-8'));

  // Clear existing NFTs
  await prisma.nFT.deleteMany();
  console.log('🗑️  Cleared existing NFTs');

  // Insert in batches
  for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
    const batch = nfts.slice(i, i + BATCH_SIZE);

    await prisma.nFT.createMany({
      data: batch.map((nft: any) => ({
        warriorId: nft.warriorId,
        editionNumber: nft.editionNumber,
        durability: 100,
        saleCount: 0,
        isStaked: false,
        metadataUri: `https://nft.ezzi.trade/${nft.warriorId}_${nft.editionNumber}.json`,
      })),
      skipDuplicates: true,
    });

    console.log(`✅ Imported ${Math.min(i + BATCH_SIZE, nfts.length)}/${nfts.length} NFTs`);
  }

  console.log('\n🎉 NFT Import Complete!');
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'generate') {
    generateNFTs()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === 'import') {
    importNFTsToDatabase()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/generate-nfts.ts generate  - Generate NFT metadata');
    console.log('  npx tsx scripts/generate-nfts.ts import     - Import to database');
    process.exit(0);
  }
}

export { generateNFTs, importNFTsToDatabase };

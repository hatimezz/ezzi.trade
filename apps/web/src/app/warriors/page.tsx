'use client';

import { motion } from 'framer-motion';
import { Users, Sword, Shield, Zap, Sparkles } from 'lucide-react';
import { GENESIS_WARRIORS, Rarity } from '@ezzi/shared';
import Link from 'next/link';

const rarityStyles: Record<Rarity, string> = {
  [Rarity.COMMON]: 'border-gray-500/30',
  [Rarity.RARE]: 'border-cyan-500/50',
  [Rarity.EPIC]: 'border-purple-500/50',
  [Rarity.LEGENDARY]: 'border-amber-500/50',
  [Rarity.MYTHIC]: 'border-pink-500/50',
};

const rarityBadge: Record<Rarity, string> = {
  [Rarity.COMMON]: 'bg-gray-500/20 text-gray-300',
  [Rarity.RARE]: 'bg-cyan-500/20 text-cyan-300',
  [Rarity.EPIC]: 'bg-purple-500/20 text-purple-300',
  [Rarity.LEGENDARY]: 'bg-amber-500/20 text-amber-300',
  [Rarity.MYTHIC]: 'bg-pink-500/20 text-pink-300',
};

export const runtime = 'nodejs';

export default function WarriorsPage() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-8 h-8 text-[#00d4ff]" />
            <h1 className="text-4xl md:text-5xl font-bold font-['Rajdhani'] uppercase">
              Genesis Warriors
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            2,300 unique warriors across 8 original designs and 5 rarity tiers.
          </p>
        </motion.div>

        {/* Rarity Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 p-6 bg-[#0a0a1a] rounded-2xl border border-white/10"
        >
          <h2 className="text-lg font-bold mb-4">Rarity Distribution</h2>
          <div className="flex flex-wrap gap-4">
            {[
              { name: 'Mythic', count: 46, percent: '2%' },
              { name: 'Legendary', count: 92, percent: '4%' },
              { name: 'Epic', count: 230, percent: '10%' },
              { name: 'Rare', count: 690, percent: '30%' },
              { name: 'Common', count: 1242, percent: '54%' },
            ].map((rarity) => (
              <div key={rarity.name} className="flex items-center space-x-2">
                <span className="font-bold">{rarity.name}</span>
                <span className="text-gray-400">{rarity.count} ({rarity.percent})</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Warriors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GENESIS_WARRIORS.map((warrior, index) => (
            <motion.div
              key={warrior.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/warriors/${warrior.name}`}>
                <div className={`group relative bg-[#0a0a1a] rounded-2xl overflow-hidden border-2 ${rarityStyles[warrior.rarity]} transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent z-10" />
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d1a]">
                      <span className="text-6xl">🎮</span>
                    </div>

                    <div className={`absolute top-3 right-3 z-20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${rarityBadge[warrior.rarity]}`}>
                      {warrior.rarity}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate">{warrior.displayName}</h3>
                    <p className="text-sm text-gray-400 mb-3">{warrior.zone}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1 text-gray-300">
                        <Sword className="w-3 h-3 text-red-400" />
                        <span>ATK {warrior.attack}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-300">
                        <Shield className="w-3 h-3 text-blue-400" />
                        <span>DEF {warrior.defense}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-300">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span>SPD {warrior.speed}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-300">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>MGK {warrior.magic}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-sm text-gray-400">{warrior.totalSupply} supply</span>
                      <span className="font-bold text-[#ffd700]">${warrior.basePrice}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

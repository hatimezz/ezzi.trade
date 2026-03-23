'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { GENESIS_WARRIORS, Rarity, getRarityColor } from '@ezzi/shared';
import { Sword, Shield, Zap, Sparkles } from 'lucide-react';

const rarityGlow: Record<Rarity, string> = {
  [Rarity.COMMON]: 'border-gray-500/30',
  [Rarity.RARE]: 'border-cyan-500/50 shadow-[0_0_30px_rgba(0,212,255,0.2)]',
  [Rarity.EPIC]: 'border-purple-500/50 shadow-[0_0_30px_rgba(180,77,255,0.2)]',
  [Rarity.LEGENDARY]: 'border-amber-500/50 shadow-[0_0_30px_rgba(255,215,0,0.3)]',
  [Rarity.MYTHIC]: 'border-pink-500/50 shadow-[0_0_40px_rgba(255,0,255,0.4)]',
};

const rarityBadge: Record<Rarity, string> = {
  [Rarity.COMMON]: 'bg-gray-500/20 text-gray-300',
  [Rarity.RARE]: 'bg-cyan-500/20 text-cyan-300',
  [Rarity.EPIC]: 'bg-purple-500/20 text-purple-300',
  [Rarity.LEGENDARY]: 'bg-amber-500/20 text-amber-300',
  [Rarity.MYTHIC]: 'bg-pink-500/20 text-pink-300',
};

export function WarriorShowcase() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {GENESIS_WARRIORS.map((warrior, index) => (
        <motion.div
          key={warrior.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Link href={`/warriors/${warrior.name}`}>
            <div
              className={`group relative bg-[#0a0a1a] rounded-2xl overflow-hidden border-2 ${rarityGlow[warrior.rarity]} transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d1a]">
                  <span className="text-6xl">🎮</span>
                </div>

                {/* Rarity Badge */}
                <div className={`absolute top-3 right-3 z-20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${rarityBadge[warrior.rarity]}`}>
                  {warrior.rarity}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 relative z-20">
                <h3 className="font-bold text-lg mb-1 truncate">{warrior.displayName}</h3>
                <p className="text-sm text-gray-400 mb-3">{warrior.zone}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Sword className="w-3 h-3 text-red-400" />
                    <span>ATK {warrior.stats.attack}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span>DEF {warrior.stats.defense}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span>SPD {warrior.stats.speed}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>MGK {warrior.stats.magic}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm text-gray-400">{warrior.totalSupply} supply</span>
                  <span className="font-bold text-[#ffd700]">${warrior.basePrice}</span>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#00d4ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

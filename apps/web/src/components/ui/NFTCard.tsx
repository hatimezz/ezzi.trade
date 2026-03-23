'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface NFTCardProps {
  name: string;
  image: string;
  rarity: Rarity;
  zone?: string;
  power?: number;
  price?: string;
  onClick?: () => void;
  className?: string;
}

const rarityGlow: Record<Rarity, string> = {
  common: 'hover:shadow-[0_0_30px_rgba(138,155,176,0.15)]',
  rare: 'hover:shadow-[0_0_30px_rgba(77,159,255,0.2)]',
  epic: 'hover:shadow-[0_0_30px_rgba(180,77,255,0.2)]',
  legendary: 'hover:shadow-[0_0_40px_rgba(255,215,0,0.25)]',
  mythic: 'hover:shadow-[0_0_50px_rgba(255,0,255,0.3)]',
};

function NFTCard({ name, image, rarity, zone, power, price, onClick, className }: NFTCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'card-glass cursor-pointer overflow-hidden group',
        rarityGlow[rarity],
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3">
          <Badge rarity={rarity}>{rarity}</Badge>
        </div>
        {zone && (
          <div className="absolute top-3 right-3">
            <Badge variant="ezzi">{zone}</Badge>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-display font-bold text-white text-lg truncate">{name}</h3>
        <div className="flex items-center justify-between">
          {power !== undefined && (
            <span className="font-mono text-sm text-[var(--ezzi)]">
              {power} PWR
            </span>
          )}
          {price && (
            <span className="font-mono text-sm text-[var(--gold)]">
              {price}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export { NFTCard };
export type { NFTCardProps, Rarity };

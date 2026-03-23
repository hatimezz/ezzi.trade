'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

type CapsuleTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'void';

interface CapsuleCardProps {
  name: string;
  tier: CapsuleTier;
  image: string;
  price: string;
  itemCount?: number;
  guaranteed?: string;
  onClick?: () => void;
  className?: string;
}

const tierStyles: Record<CapsuleTier, { border: string; glow: string; badge: 'default' | 'ezzi' | 'gold' }> = {
  bronze: {
    border: 'border-[rgba(205,127,50,0.25)]',
    glow: 'hover:shadow-[0_0_30px_rgba(205,127,50,0.2)]',
    badge: 'default',
  },
  silver: {
    border: 'border-[rgba(192,192,192,0.25)]',
    glow: 'hover:shadow-[0_0_30px_rgba(192,192,192,0.2)]',
    badge: 'default',
  },
  gold: {
    border: 'border-[rgba(255,215,0,0.25)]',
    glow: 'hover:shadow-[0_0_40px_rgba(255,215,0,0.25)]',
    badge: 'gold',
  },
  diamond: {
    border: 'border-[rgba(0,212,255,0.3)]',
    glow: 'hover:shadow-[0_0_40px_rgba(0,212,255,0.25)]',
    badge: 'ezzi',
  },
  void: {
    border: 'border-[rgba(204,0,255,0.3)]',
    glow: 'hover:shadow-[0_0_50px_rgba(204,0,255,0.3)]',
    badge: 'ezzi',
  },
};

function CapsuleCard({ name, tier, image, price, itemCount, guaranteed, onClick, className }: CapsuleCardProps) {
  const style = tierStyles[tier];

  return (
    <motion.div
      whileHover={{ y: -6, rotateY: 3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'card-glass cursor-pointer overflow-hidden group',
        style.border,
        style.glow,
        className
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden flex items-center justify-center bg-gradient-to-b from-white/[0.02] to-transparent">
        <motion.img
          src={image}
          alt={name}
          className="w-3/4 h-3/4 object-contain drop-shadow-2xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute top-3 right-3">
          <Badge variant={style.badge}>{tier}</Badge>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-display font-bold text-white text-lg">{name}</h3>
        {itemCount !== undefined && (
          <p className="text-sm text-[var(--text-secondary)]">
            Contains {itemCount} items
          </p>
        )}
        {guaranteed && (
          <p className="text-xs text-[var(--gold)] font-display uppercase tracking-wide">
            Guaranteed: {guaranteed}
          </p>
        )}
        <div className="pt-2 border-t border-white/5">
          <span className="font-mono text-lg font-bold text-[var(--gold)]">{price}</span>
        </div>
      </div>
    </motion.div>
  );
}

export { CapsuleCard };
export type { CapsuleCardProps, CapsuleTier };

'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'ezzi' | 'gold' | 'danger' | 'success';
type RarityTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  rarity?: RarityTier;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white/80 border-white/15',
  ezzi: 'bg-[rgba(0,212,255,0.12)] text-[var(--ezzi)] border-[rgba(0,212,255,0.25)]',
  gold: 'bg-[rgba(255,215,0,0.12)] text-[var(--gold)] border-[rgba(255,215,0,0.25)]',
  danger: 'bg-[rgba(255,51,102,0.12)] text-[#ff3366] border-[rgba(255,51,102,0.25)]',
  success: 'bg-[rgba(0,255,159,0.12)] text-[#00ff9f] border-[rgba(0,255,159,0.25)]',
};

function Badge({ children, variant = 'default', rarity, className }: BadgeProps) {
  if (rarity) {
    return (
      <span className={cn('rarity-badge', `rarity-${rarity}`, className)}>
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full font-display font-semibold text-xs uppercase tracking-wider border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant, RarityTier };

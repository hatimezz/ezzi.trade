'use client';

import { Modal } from './Modal';
import { Badge } from './Badge';
import { StatBlock } from './StatBlock';
import { cn } from '@/lib/utils';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface WarriorStats {
  attack: number;
  defense: number;
  speed: number;
  stamina: number;
}

interface WarriorDetailModalProps {
  open: boolean;
  onClose: () => void;
  warrior: {
    name: string;
    image: string;
    rarity: Rarity;
    zone: string;
    level: number;
    power: number;
    stats: WarriorStats;
    description?: string;
  } | null;
  className?: string;
}

function WarriorDetailModal({ open, onClose, warrior, className }: WarriorDetailModalProps) {
  if (!warrior) return null;

  return (
    <Modal open={open} onClose={onClose} size="lg" className={className}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-full md:w-1/2 aspect-square rounded-xl overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent">
          <img
            src={warrior.image}
            alt={warrior.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <Badge rarity={warrior.rarity}>{warrior.rarity}</Badge>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">{warrior.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="ezzi">{warrior.zone}</Badge>
              <span className="font-mono text-sm text-[var(--text-secondary)]">
                LVL {warrior.level}
              </span>
            </div>
          </div>

          {warrior.description && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {warrior.description}
            </p>
          )}

          <div className={cn('grid grid-cols-2 gap-4 p-4 rounded-xl', 'bg-white/[0.03] border border-white/[0.06]')}>
            <StatBlock label="Attack" value={warrior.stats.attack} accent="ezzi" />
            <StatBlock label="Defense" value={warrior.stats.defense} accent="ezzi" />
            <StatBlock label="Speed" value={warrior.stats.speed} accent="gold" />
            <StatBlock label="Stamina" value={warrior.stats.stamina} accent="gold" />
          </div>

          <div className="pt-2">
            <StatBlock label="Total Power" value={warrior.power} accent="ezzi" />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export { WarriorDetailModal };
export type { WarriorDetailModalProps, WarriorStats };

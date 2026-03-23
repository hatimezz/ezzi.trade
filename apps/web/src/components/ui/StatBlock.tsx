'use client';

import { cn } from '@/lib/utils';

type StatAccent = 'default' | 'ezzi' | 'gold';

interface StatBlockProps {
  label: string;
  value: string | number;
  accent?: StatAccent;
  className?: string;
}

const accentClasses: Record<StatAccent, string> = {
  default: '',
  ezzi: 'stat-ezzi',
  gold: 'stat-gold',
};

function StatBlock({ label, value, accent = 'default', className }: StatBlockProps) {
  return (
    <div className={cn('stat-block', className)}>
      <span className="stat-label">{label}</span>
      <span className={cn('stat-value', accentClasses[accent])}>{value}</span>
    </div>
  );
}

export { StatBlock };
export type { StatBlockProps, StatAccent };

'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AdminKPICardProps {
  label: string;
  value: string;
  subValue?: string;
  change?: string;
  trend?: 'up' | 'down' | 'flat';
  icon: LucideIcon;
  color?: 'cyan' | 'orange' | 'gold' | 'green' | 'red' | 'purple';
}

const COLORS: Record<string, { hex: string; bg: string }> = {
  cyan:   { hex: '#00d4ff', bg: 'rgba(0,212,255,0.10)' },
  orange: { hex: '#ff6b35', bg: 'rgba(255,107,53,0.10)' },
  gold:   { hex: '#ffd700', bg: 'rgba(255,215,0,0.10)' },
  green:  { hex: '#00ff9f', bg: 'rgba(0,255,159,0.10)' },
  red:    { hex: '#ff3366', bg: 'rgba(255,51,102,0.10)' },
  purple: { hex: '#cc00ff', bg: 'rgba(204,0,255,0.10)' },
};

const TREND_ICONS = {
  up:   TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const TREND_COLORS = {
  up:   'text-[#00ff9f]',
  down: 'text-[#ff3366]',
  flat: 'text-gray-500',
};

export function AdminKPICard({
  label,
  value,
  subValue,
  change,
  trend = 'flat',
  icon: Icon,
  color = 'cyan',
}: AdminKPICardProps) {
  const c = COLORS[color];
  const TrendIcon = TREND_ICONS[trend];

  return (
    <div className="admin-stat-card relative overflow-hidden group">
      {/* accent top bar uses the color */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${c.hex}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
          <Icon className="w-5 h-5" style={{ color: c.hex }} />
        </div>
        {change && trend && (
          <div className={`flex items-center gap-1 text-xs font-mono font-bold ${TREND_COLORS[trend]}`}>
            <TrendIcon className="w-3 h-3" />
            {change}
          </div>
        )}
      </div>

      <p className="text-3xl font-bold font-mono text-white leading-none">{value}</p>
      {subValue && (
        <p className="text-xs font-mono mt-1" style={{ color: c.hex }}>{subValue}</p>
      )}
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-2 font-['Rajdhani']">
        {label}
      </p>
    </div>
  );
}

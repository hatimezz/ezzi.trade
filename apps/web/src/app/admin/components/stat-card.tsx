'use client';

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  accent?: 'ezzi' | 'gold' | 'danger' | 'success';
}

const ACCENT_MAP = {
  ezzi: '',
  gold: 'accent-gold',
  danger: 'accent-danger',
  success: 'accent-success',
} as const;

const COLOR_MAP = {
  ezzi: '#00d4ff',
  gold: '#ffd700',
  danger: '#ff3366',
  success: '#00ff9f',
} as const;

export function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  accent = 'ezzi',
}: StatCardProps) {
  const changeColor =
    changeType === 'positive'
      ? 'text-[#00ff9f]'
      : changeType === 'negative'
        ? 'text-[#ff3366]'
        : 'text-gray-500';

  return (
    <div className={`admin-stat-card ${ACCENT_MAP[accent]}`}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${COLOR_MAP[accent]}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: COLOR_MAP[accent] }} />
        </div>
        {change && (
          <span className={`text-xs font-mono font-bold ${changeColor}`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold font-mono text-white">{value}</p>
      <p className="text-xs text-gray-500 font-['Rajdhani'] font-semibold uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  );
}

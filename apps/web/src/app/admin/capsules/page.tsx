'use client';

import { Box, TrendingUp, Package, Flame } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminChart } from '../components/admin-chart';
import { AdminTable } from '../components/admin-table';
import type { AdminTableColumn } from '../components/admin-table';

export const runtime = 'nodejs';

interface CapsuleTier extends Record<string, unknown> {
  id: string;
  tier: string;
  price: string;
  total: number;
  sold: number;
  remaining: number;
  revenue: string;
  status: 'live' | 'sold_out' | 'paused';
}

const TIERS: CapsuleTier[] = [
  { id: '1', tier: 'Bronze',  price: '0.05 SOL', total: 5000,  sold: 4230,  remaining: 770,  revenue: '211.5 SOL', status: 'live' },
  { id: '2', tier: 'Silver',  price: '0.15 SOL', total: 4000,  sold: 2950,  remaining: 1050, revenue: '442.5 SOL', status: 'live' },
  { id: '3', tier: 'Gold',    price: '0.35 SOL', total: 3000,  sold: 1820,  remaining: 1180, revenue: '637.0 SOL', status: 'live' },
  { id: '4', tier: 'Cyber',   price: '0.75 SOL', total: 2000,  sold: 1240,  remaining: 760,  revenue: '930.0 SOL', status: 'live' },
  { id: '5', tier: 'Shadow',  price: '1.5 SOL',  total: 1000,  sold: 680,   remaining: 320,  revenue: '1,020 SOL', status: 'live' },
  { id: '6', tier: 'Void',    price: '5.0 SOL',  total: 500,   sold: 318,   remaining: 182,  revenue: '1,590 SOL', status: 'live' },
  { id: '7', tier: 'Genesis', price: '25.0 SOL', total: 100,   sold: 100,   remaining: 0,    revenue: '2,500 SOL', status: 'sold_out' },
];

const openedOverTime = [
  { day: 'Mon', opened: 420 },
  { day: 'Tue', opened: 610 },
  { day: 'Wed', opened: 380 },
  { day: 'Thu', opened: 740 },
  { day: 'Fri', opened: 920 },
  { day: 'Sat', opened: 1150 },
  { day: 'Sun', opened: 870 },
];

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  live:     { color: '#00ff9f', bg: 'rgba(0,255,159,0.12)' },
  sold_out: { color: '#ff6b35', bg: 'rgba(255,107,53,0.12)' },
  paused:   { color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
};

const columns: AdminTableColumn<CapsuleTier>[] = [
  { key: 'tier',      label: 'Tier',        sortable: true, render: (v) => <span className="font-bold text-white">{String(v)}</span> },
  { key: 'price',     label: 'Price',       sortable: false, render: (v) => <span className="font-mono text-[#00d4ff]">{String(v)}</span> },
  { key: 'total',     label: 'Total',       sortable: true, align: 'right', render: (v) => <span className="font-mono">{Number(v).toLocaleString()}</span> },
  { key: 'sold',      label: 'Sold',        sortable: true, align: 'right', render: (v) => <span className="font-mono text-[#ff6b35]">{Number(v).toLocaleString()}</span> },
  { key: 'remaining', label: 'Remaining',   sortable: true, align: 'right', render: (v) => <span className="font-mono">{Number(v).toLocaleString()}</span> },
  {
    key: 'sold',
    label: 'Fill %',
    align: 'center',
    render: (_v, row) => {
      const pct = Math.round((Number(row.sold) / Number(row.total)) * 100);
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden w-20">
            <div className="h-full rounded-full bg-[#ff6b35]" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-mono text-gray-400">{pct}%</span>
        </div>
      );
    },
  },
  { key: 'revenue', label: 'Revenue', sortable: false, align: 'right', render: (v) => <span className="font-mono text-[#ffd700]">{String(v)}</span> },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (v) => {
      const s = STATUS_STYLES[String(v)];
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: s.color, background: s.bg }}>
          {String(v).replace('_', ' ')}
        </span>
      );
    },
  },
];

const totalSold = TIERS.reduce((a, t) => a + t.sold, 0);
const totalCaps = TIERS.reduce((a, t) => a + t.total, 0);

export default function CapsulesPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="Total Capsules"  value={totalCaps.toLocaleString()}  icon={Box}       color="cyan"   />
        <AdminKPICard label="Total Sold"      value={totalSold.toLocaleString()}  icon={TrendingUp} color="orange" change={`${Math.round((totalSold/totalCaps)*100)}%`} trend="up" />
        <AdminKPICard label="Opened Today"    value="4,090"                        icon={Package}   color="gold"   />
        <AdminKPICard label="On Fire (24h)"   value="1,150"                        icon={Flame}     color="red"    change="+28%" trend="up" />
      </div>

      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Capsules Opened — Last 7 Days
        </h3>
        <AdminChart
          type="bar"
          data={openedOverTime}
          xKey="day"
          series={[{ key: 'opened', color: '#ff6b35', name: 'Opened' }]}
          height={220}
        />
      </div>

      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Capsule Tiers
        </h3>
        <AdminTable columns={columns} data={TIERS} rowKey="id" />
      </div>
    </div>
  );
}

'use client';

import { Rocket, DollarSign, Users, Target } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminChart } from '../components/admin-chart';
import { AdminTable } from '../components/admin-table';
import type { AdminTableColumn } from '../components/admin-table';

export const runtime = 'nodejs';

interface PresaleRound extends Record<string, unknown> {
  id: string;
  round: string;
  allocation: string;
  price: string;
  raised: string;
  participants: number;
  startDate: string;
  endDate: string;
  status: 'completed' | 'active' | 'upcoming';
}

const ROUNDS: PresaleRound[] = [
  { id: '1', round: 'Seed',       allocation: '10,000,000 EZZI', price: '$0.005', raised: '$50,000',   participants: 48,   startDate: '2025-11-01', endDate: '2025-11-30', status: 'completed' },
  { id: '2', round: 'Private',    allocation: '25,000,000 EZZI', price: '$0.008', raised: '$200,000',  participants: 124,  startDate: '2025-12-01', endDate: '2025-12-31', status: 'completed' },
  { id: '3', round: 'Pre-Public', allocation: '50,000,000 EZZI', price: '$0.012', raised: '$340,000',  participants: 812,  startDate: '2026-01-15', endDate: '2026-02-15', status: 'completed' },
  { id: '4', round: 'Public',     allocation: '75,000,000 EZZI', price: '$0.018', raised: '$820,000',  participants: 4820, startDate: '2026-03-01', endDate: '2026-03-31', status: 'active' },
  { id: '5', round: 'Launch',     allocation: '40,000,000 EZZI', price: '$0.025', raised: '—',         participants: 0,    startDate: '2026-04-15', endDate: '2026-04-30', status: 'upcoming' },
];

const dailySalesData = [
  { day: 'Mar 11', raised: 92000,  buyers: 410 },
  { day: 'Mar 12', raised: 105000, buyers: 480 },
  { day: 'Mar 13', raised: 88000,  buyers: 390 },
  { day: 'Mar 14', raised: 142000, buyers: 620 },
  { day: 'Mar 15', raised: 163000, buyers: 710 },
  { day: 'Mar 16', raised: 118000, buyers: 540 },
  { day: 'Mar 17', raised: 112000, buyers: 490 },
];

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  completed: { color: '#8892a0', bg: 'rgba(136,146,160,0.10)' },
  active:    { color: '#00ff9f', bg: 'rgba(0,255,159,0.12)' },
  upcoming:  { color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
};

const columns: AdminTableColumn<PresaleRound>[] = [
  { key: 'round',        label: 'Round',        sortable: true, render: (v) => <span className="font-bold text-white">{String(v)}</span> },
  { key: 'allocation',   label: 'Allocation',   sortable: false, render: (v) => <span className="font-mono text-[#00d4ff] text-xs">{String(v)}</span> },
  { key: 'price',        label: 'Price',        sortable: false, render: (v) => <span className="font-mono text-[#ffd700]">{String(v)}</span> },
  { key: 'raised',       label: 'Raised',       sortable: false, align: 'right', render: (v) => <span className="font-mono text-[#ff6b35]">{String(v)}</span> },
  { key: 'participants', label: 'Participants',  sortable: true, align: 'right', render: (v) => <span className="font-mono">{Number(v).toLocaleString()}</span> },
  { key: 'startDate',    label: 'Start',        sortable: true },
  { key: 'endDate',      label: 'End',          sortable: true },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (v) => {
      const s = STATUS_STYLES[String(v)];
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: s.color, background: s.bg }}>
          {String(v)}
        </span>
      );
    },
  },
];

const GOAL = 1000000;
const raised = 1410000;
const pct = Math.min(Math.round((raised / GOAL) * 100), 100);

export default function PresalePage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="Total Raised"   value="$1.41M"  icon={DollarSign} color="orange" change="+141%" trend="up" />
        <AdminKPICard label="Participants"   value="5,804"   icon={Users}      color="cyan"   change="+4,820" trend="up" />
        <AdminKPICard label="Active Round"   value="Public"  icon={Rocket}     color="green"  />
        <AdminKPICard label="Goal Progress"  value={`${pct}%`} icon={Target}  color="gold"   />
      </div>

      {/* Progress bar */}
      <div className="admin-card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300">
            Public Round Progress
          </h3>
          <span className="text-xs font-mono text-[#ff6b35]">${raised.toLocaleString()} / ${GOAL.toLocaleString()}</span>
        </div>
        <div className="progress-bar h-3 mb-2">
          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ff6b35, #ff8c00)' }} />
        </div>
        <p className="text-xs text-gray-500 font-mono">{pct}% of public round goal reached</p>
      </div>

      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Daily Sales — Public Round
        </h3>
        <AdminChart
          type="area"
          data={dailySalesData}
          xKey="day"
          series={[
            { key: 'raised', color: '#ff6b35', name: 'Raised ($)' },
            { key: 'buyers', color: '#00d4ff', name: 'Buyers' },
          ]}
        />
      </div>

      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          All Rounds
        </h3>
        <AdminTable columns={columns} data={ROUNDS} rowKey="id" />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ClipboardList, Mail, Search, Download, TrendingUp } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminChart } from '../components/admin-chart';
import { AdminTable } from '../components/admin-table';
import type { AdminTableColumn } from '../components/admin-table';

export const runtime = 'nodejs';

type WaitlistTier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

interface WaitlistEntry extends Record<string, unknown> {
  id: string;
  position: number;
  email: string;
  referrals: number;
  tier: WaitlistTier;
  joinedAt: string;
  notified: boolean;
}

const ENTRIES: WaitlistEntry[] = [
  { id: '1', position: 1,  email: 'first@ezzi.world',   referrals: 48, tier: 'Platinum', joinedAt: '2025-10-01', notified: true  },
  { id: '2', position: 2,  email: 'whale@crypto.io',    referrals: 31, tier: 'Platinum', joinedAt: '2025-10-02', notified: true  },
  { id: '3', position: 3,  email: 'og@nftcollect.xyz',  referrals: 22, tier: 'Gold',     joinedAt: '2025-10-05', notified: true  },
  { id: '4', position: 4,  email: 'solana@vibes.net',   referrals: 17, tier: 'Gold',     joinedAt: '2025-10-08', notified: false },
  { id: '5', position: 5,  email: 'gamer@play2earn.io', referrals: 12, tier: 'Gold',     joinedAt: '2025-10-12', notified: false },
  { id: '6', position: 6,  email: 'defi@yield.farm',    referrals: 8,  tier: 'Silver',   joinedAt: '2025-10-15', notified: false },
  { id: '7', position: 7,  email: 'anon@privacy.me',    referrals: 5,  tier: 'Silver',   joinedAt: '2025-10-18', notified: false },
  { id: '8', position: 8,  email: 'user@mail.com',      referrals: 2,  tier: 'Bronze',   joinedAt: '2025-10-22', notified: false },
  { id: '9', position: 9,  email: 'late@joiner.net',    referrals: 1,  tier: 'Bronze',   joinedAt: '2025-11-01', notified: false },
  { id: '10', position: 10, email: 'newest@web3.io',    referrals: 0,  tier: 'Bronze',   joinedAt: '2025-11-15', notified: false },
];

const growthData = [
  { month: 'Oct', signups: 12400 },
  { month: 'Nov', signups: 28900 },
  { month: 'Dec', signups: 41200 },
  { month: 'Jan', signups: 62000 },
  { month: 'Feb', signups: 94000 },
  { month: 'Mar', signups: 203741 },
];

const TIER_STYLES: Record<WaitlistTier, { color: string; bg: string }> = {
  Platinum: { color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
  Gold:     { color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  Silver:   { color: '#8892a0', bg: 'rgba(136,146,160,0.12)' },
  Bronze:   { color: '#ff6b35', bg: 'rgba(255,107,53,0.12)' },
};

const columns: AdminTableColumn<WaitlistEntry>[] = [
  { key: 'position', label: '#',          sortable: true, align: 'center', render: (v) => <span className="font-mono text-gray-400">#{String(v)}</span> },
  { key: 'email',    label: 'Email',      sortable: true, render: (v) => <span className="text-white">{String(v)}</span> },
  {
    key: 'tier',
    label: 'Tier',
    sortable: true,
    render: (v) => {
      const s = TIER_STYLES[v as WaitlistTier];
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: s.color, background: s.bg }}>
          {String(v)}
        </span>
      );
    },
  },
  { key: 'referrals', label: 'Referrals', sortable: true, align: 'center', render: (v) => <span className="font-mono text-[#ff6b35]">{String(v)}</span> },
  { key: 'joinedAt',  label: 'Joined',    sortable: true },
  {
    key: 'notified',
    label: 'Notified',
    align: 'center',
    render: (v) => v
      ? <span className="text-[#00ff9f] text-xs font-bold">Yes</span>
      : <span className="text-gray-600 text-xs">No</span>,
  },
];

export default function WaitlistPage() {
  const [search, setSearch] = useState('');

  const filtered = ENTRIES.filter((e) =>
    e.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="Total Waitlist" value="203,741"  icon={ClipboardList} color="cyan"   change="+1,204 today" trend="up" />
        <AdminKPICard label="Notified"       value="48,200"   icon={Mail}          color="orange" />
        <AdminKPICard label="Referral Users" value="12,480"   icon={TrendingUp}    color="green"  change="+6.1%" trend="up" />
        <AdminKPICard label="Platinum Tier"  value="1,240"    icon={Search}        color="gold"   />
      </div>

      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Waitlist Growth
        </h3>
        <AdminChart
          type="area"
          data={growthData}
          xKey="month"
          series={[{ key: 'signups', color: '#ff6b35', name: 'Signups' }]}
          height={200}
        />
      </div>

      <div className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-48"
            />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost text-xs py-2 px-3 min-h-0 h-9 gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button className="btn text-xs py-2 px-3 min-h-0 h-9 gap-1.5 bg-gradient-to-r from-[#ff6b35] to-[#ff8c00] text-white">
              <Mail className="w-3.5 h-3.5" /> Notify All
            </button>
          </div>
        </div>
        <AdminTable columns={columns} data={filtered} rowKey="id" emptyMessage="No entries match your search." />
        <p className="text-xs text-gray-600 font-mono">Showing top {filtered.length} entries (203,741 total)</p>
      </div>
    </div>
  );
}

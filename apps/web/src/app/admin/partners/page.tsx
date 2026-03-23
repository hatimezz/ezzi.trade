'use client';

import { useState } from 'react';
import { Handshake, Globe, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminTable } from '../components/admin-table';
import type { AdminTableColumn } from '../components/admin-table';

export const runtime = 'nodejs';

type PartnerStatus = 'active' | 'pending' | 'inactive';
type PartnerType = 'Exchange' | 'Launchpad' | 'Media' | 'Gaming' | 'DeFi' | 'Infrastructure';

interface PartnerRow extends Record<string, unknown> {
  id: string;
  name: string;
  type: PartnerType;
  contact: string;
  since: string;
  dealValue: string;
  status: PartnerStatus;
  website: string;
}

const PARTNERS: PartnerRow[] = [
  { id: '1', name: 'Orca DEX',        type: 'Exchange',       contact: 'bd@orca.so',        since: '2025-10-01', dealValue: '$80,000',  status: 'active',   website: 'orca.so' },
  { id: '2', name: 'Magic Eden',      type: 'Launchpad',      contact: 'hd@magiceden.io',   since: '2025-11-15', dealValue: '$120,000', status: 'active',   website: 'magiceden.io' },
  { id: '3', name: 'Solana Daily',    type: 'Media',          contact: 'press@solanadaily', since: '2025-12-01', dealValue: '$25,000',  status: 'active',   website: 'solanadaily.com' },
  { id: '4', name: 'GameFi Labs',     type: 'Gaming',         contact: 'partner@gamefi',    since: '2026-01-10', dealValue: '$60,000',  status: 'active',   website: 'gamefi.io' },
  { id: '5', name: 'Raydium',         type: 'DeFi',           contact: 'bd@raydium.io',     since: '2026-01-22', dealValue: '$90,000',  status: 'active',   website: 'raydium.io' },
  { id: '6', name: 'Helius',          type: 'Infrastructure', contact: 'bd@helius.xyz',     since: '2026-02-05', dealValue: '$40,000',  status: 'active',   website: 'helius.xyz' },
  { id: '7', name: 'CryptoSlate',     type: 'Media',          contact: 'pr@cryptoslate',    since: '2026-02-20', dealValue: '$18,000',  status: 'pending',  website: 'cryptoslate.com' },
  { id: '8', name: 'Jupiter Agg.',    type: 'DeFi',           contact: 'bd@jup.ag',         since: '2026-03-01', dealValue: '$75,000',  status: 'pending',  website: 'jup.ag' },
];

const STATUS_STYLES: Record<PartnerStatus, { color: string; bg: string }> = {
  active:   { color: '#00ff9f', bg: 'rgba(0,255,159,0.12)' },
  pending:  { color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  inactive: { color: '#4a5568', bg: 'rgba(74,85,104,0.12)' },
};

const TYPE_COLORS: Record<PartnerType, string> = {
  Exchange:       '#00d4ff',
  Launchpad:      '#ff6b35',
  Media:          '#b44dff',
  Gaming:         '#00ff9f',
  DeFi:           '#ffd700',
  Infrastructure: '#8892a0',
};

const columns: AdminTableColumn<PartnerRow>[] = [
  { key: 'name',      label: 'Partner',   sortable: true, render: (v) => <span className="font-bold text-white">{String(v)}</span> },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
    render: (v) => (
      <span className="text-xs font-semibold" style={{ color: TYPE_COLORS[v as PartnerType] }}>{String(v)}</span>
    ),
  },
  { key: 'contact',   label: 'Contact',   sortable: false, render: (v) => <span className="text-xs text-gray-400 font-mono">{String(v)}</span> },
  { key: 'website',   label: 'Website',   sortable: false, render: (v) => <span className="text-xs text-[#00d4ff]">{String(v)}</span> },
  { key: 'dealValue', label: 'Deal',      sortable: false, align: 'right', render: (v) => <span className="font-mono text-[#ffd700]">{String(v)}</span> },
  { key: 'since',     label: 'Since',     sortable: true },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (v) => {
      const s = STATUS_STYLES[v as PartnerStatus];
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: s.color, background: s.bg }}>
          {String(v)}
        </span>
      );
    },
  },
];

export default function PartnersPage() {
  const [search, setSearch] = useState('');

  const filtered = PARTNERS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase()),
  );

  const active  = PARTNERS.filter((p) => p.status === 'active').length;
  const pending = PARTNERS.filter((p) => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="Total Partners" value={PARTNERS.length.toString()} icon={Handshake}   color="cyan"   />
        <AdminKPICard label="Active"         value={active.toString()}          icon={CheckCircle} color="green"  />
        <AdminKPICard label="Pending"        value={pending.toString()}         icon={Clock}       color="gold"   />
        <AdminKPICard label="Total Value"    value="$508K"                      icon={Globe}       color="orange" />
      </div>

      <div className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search partners…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#ff6b35]/40 w-60"
          />
          <button className="btn text-xs py-2 px-3 min-h-0 h-9 gap-1.5 bg-gradient-to-r from-[#ff6b35] to-[#ff8c00] text-white">
            <PlusCircle className="w-3.5 h-3.5" /> Add Partner
          </button>
        </div>
        <AdminTable columns={columns} data={filtered} rowKey="id" />
      </div>
    </div>
  );
}

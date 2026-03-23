'use client';

import { useState } from 'react';
import { Search, UserPlus, Download, Ban, CheckCircle } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminTable } from '../components/admin-table';
import type { AdminTableColumn } from '../components/admin-table';
import { Users, Activity, Shield } from 'lucide-react';

export const runtime = 'nodejs';

type UserStatus = 'active' | 'suspended' | 'pending';

interface UserRow extends Record<string, unknown> {
  id: string;
  wallet: string;
  email: string;
  nfts: number;
  ezzi: number;
  joined: string;
  status: UserStatus;
}

const USERS: UserRow[] = [
  { id: '1', wallet: '0x1a2b…3c4d', email: 'satoshi@mail.com',  nfts: 12, ezzi: 45200, joined: '2026-01-02', status: 'active' },
  { id: '2', wallet: '0x5e6f…7a8b', email: 'vitalik@web3.io',   nfts: 8,  ezzi: 29800, joined: '2026-01-14', status: 'active' },
  { id: '3', wallet: '0x9c0d…1e2f', email: 'anon@proton.me',    nfts: 3,  ezzi: 8100,  joined: '2026-01-28', status: 'suspended' },
  { id: '4', wallet: '0x3a4b…5c6d', email: 'gamer@ezzi.world',  nfts: 22, ezzi: 92000, joined: '2026-02-03', status: 'active' },
  { id: '5', wallet: '0x7e8f…9a0b', email: 'miner@hash.net',    nfts: 5,  ezzi: 16500, joined: '2026-02-11', status: 'active' },
  { id: '6', wallet: '0xb1c2…d3e4', email: 'collector@nft.xyz', nfts: 31, ezzi: 120400, joined: '2026-02-18', status: 'active' },
  { id: '7', wallet: '0xf5a6…b7c8', email: 'trader@defi.io',    nfts: 0,  ezzi: 0,     joined: '2026-03-01', status: 'pending' },
  { id: '8', wallet: '0xd9e0…f1a2', email: 'whale@lambo.finance', nfts: 56, ezzi: 380000, joined: '2026-03-05', status: 'active' },
];

const STATUS_STYLES: Record<UserStatus, { color: string; bg: string; label: string }> = {
  active:    { color: '#00ff9f', bg: 'rgba(0,255,159,0.12)',   label: 'Active' },
  suspended: { color: '#ff3366', bg: 'rgba(255,51,102,0.12)',  label: 'Suspended' },
  pending:   { color: '#ffd700', bg: 'rgba(255,215,0,0.12)',   label: 'Pending' },
};

const columns: AdminTableColumn<UserRow>[] = [
  { key: 'wallet', label: 'Wallet',  sortable: true },
  { key: 'email',  label: 'Email',   sortable: true },
  { key: 'nfts',   label: 'NFTs',    sortable: true, align: 'center', render: (v) => <span className="font-mono text-[#00d4ff]">{String(v)}</span> },
  { key: 'ezzi',   label: 'EZZI',    sortable: true, align: 'right',  render: (v) => <span className="font-mono text-[#ffd700]">{Number(v).toLocaleString()}</span> },
  { key: 'joined', label: 'Joined',  sortable: true },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (v) => {
      const s = STATUS_STYLES[v as UserStatus];
      return (
        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase" style={{ color: s.color, background: s.bg }}>
          {s.label}
        </span>
      );
    },
  },
  {
    key: 'id',
    label: 'Actions',
    align: 'center',
    render: (_v, row) => (
      <div className="flex items-center justify-center gap-2">
        {row.status === 'suspended' ? (
          <button className="p-1 rounded text-[#00ff9f] hover:bg-[#00ff9f]/10" aria-label="Unsuspend user" title="Unsuspend">
            <CheckCircle className="w-4 h-4" />
          </button>
        ) : (
          <button className="p-1 rounded text-[#ff3366] hover:bg-[#ff3366]/10" aria-label="Suspend user" title="Suspend">
            <Ban className="w-4 h-4" />
          </button>
        )}
      </div>
    ),
  },
];

export default function UsersPage() {
  const [search, setSearch] = useState('');

  const filtered = USERS.filter(
    (u) =>
      u.wallet.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const active    = USERS.filter((u) => u.status === 'active').length;
  const suspended = USERS.filter((u) => u.status === 'suspended').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="Total Users"  value={USERS.length.toString()}  icon={Users}    color="cyan"   />
        <AdminKPICard label="Active"       value={active.toString()}        icon={Activity} color="green"  />
        <AdminKPICard label="Suspended"    value={suspended.toString()}     icon={Ban}      color="red"    />
        <AdminKPICard label="Verified"     value="6"                        icon={Shield}   color="orange" />
      </div>

      <div className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 min-w-[260px]">
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search wallet or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 flex-1"
            />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost text-xs py-2 px-3 min-h-0 h-9 gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button className="btn text-xs py-2 px-3 min-h-0 h-9 gap-1.5 bg-gradient-to-r from-[#ff6b35] to-[#ff8c00] text-white">
              <UserPlus className="w-3.5 h-3.5" /> Add User
            </button>
          </div>
        </div>

        <AdminTable columns={columns} data={filtered} rowKey="id" emptyMessage="No users match your search." />

        <p className="text-xs text-gray-600 font-mono">
          Showing {filtered.length} of {USERS.length} users
        </p>
      </div>
    </div>
  );
}

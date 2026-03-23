'use client';

import { useState } from 'react';
import { UserCog, Shield, PlusCircle, Edit2, Trash2, Key } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminTable } from '../components/admin-table';
import type { AdminTableColumn } from '../components/admin-table';

export const runtime = 'nodejs';

type AdminRole = 'Super Admin' | 'Admin' | 'Moderator' | 'Analyst' | 'Support';
type AccountStatus = 'active' | 'inactive';

interface AdminAccount extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  lastLogin: string;
  createdAt: string;
  status: AccountStatus;
  twoFA: boolean;
}

const ACCOUNTS: AdminAccount[] = [
  { id: '1', name: 'Root Admin',     email: 'root@ezzi.world',      role: 'Super Admin', lastLogin: '2026-03-17 14:22', createdAt: '2025-09-01', status: 'active',   twoFA: true  },
  { id: '2', name: 'Alice Chen',     email: 'alice@ezzi.world',     role: 'Admin',       lastLogin: '2026-03-17 11:08', createdAt: '2025-10-15', status: 'active',   twoFA: true  },
  { id: '3', name: 'Bob Martinez',   email: 'bob@ezzi.world',       role: 'Moderator',   lastLogin: '2026-03-16 18:45', createdAt: '2025-11-01', status: 'active',   twoFA: true  },
  { id: '4', name: 'Carol Sun',      email: 'carol@ezzi.world',     role: 'Analyst',     lastLogin: '2026-03-15 09:30', createdAt: '2025-12-01', status: 'active',   twoFA: false },
  { id: '5', name: 'David Kim',      email: 'david@ezzi.world',     role: 'Support',     lastLogin: '2026-03-14 16:12', createdAt: '2026-01-10', status: 'active',   twoFA: false },
  { id: '6', name: 'Eve Johnson',    email: 'eve@ezzi.world',       role: 'Support',     lastLogin: '2026-02-28 10:00', createdAt: '2026-02-01', status: 'inactive', twoFA: false },
];

const ROLE_COLORS: Record<AdminRole, { color: string; bg: string }> = {
  'Super Admin': { color: '#ff6b35', bg: 'rgba(255,107,53,0.12)' },
  'Admin':       { color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
  'Moderator':   { color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  'Analyst':     { color: '#b44dff', bg: 'rgba(180,77,255,0.12)' },
  'Support':     { color: '#8892a0', bg: 'rgba(136,146,160,0.12)' },
};

const columns: AdminTableColumn<AdminAccount>[] = [
  { key: 'name',      label: 'Name',       sortable: true, render: (v) => <span className="font-semibold text-white">{String(v)}</span> },
  { key: 'email',     label: 'Email',      sortable: true, render: (v) => <span className="font-mono text-xs text-gray-400">{String(v)}</span> },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    render: (v) => {
      const s = ROLE_COLORS[v as AdminRole];
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: s.color, background: s.bg }}>
          {String(v)}
        </span>
      );
    },
  },
  { key: 'lastLogin', label: 'Last Login',  sortable: true, render: (v) => <span className="text-xs text-gray-400 font-mono">{String(v)}</span> },
  {
    key: 'twoFA',
    label: '2FA',
    align: 'center',
    render: (v) => v
      ? <span className="text-[#00ff9f] text-xs font-bold">ON</span>
      : <span className="text-[#ff3366] text-xs font-bold">OFF</span>,
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (v) => (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
        style={{
          color: v === 'active' ? '#00ff9f' : '#4a5568',
          background: v === 'active' ? 'rgba(0,255,159,0.12)' : 'rgba(74,85,104,0.12)',
        }}
      >
        {String(v)}
      </span>
    ),
  },
  {
    key: 'id',
    label: 'Actions',
    align: 'center',
    render: () => (
      <div className="flex items-center justify-center gap-2">
        <button className="p-1 rounded text-gray-500 hover:text-[#00d4ff] hover:bg-[#00d4ff]/10" aria-label="Edit account">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button className="p-1 rounded text-gray-500 hover:text-[#ffd700] hover:bg-[#ffd700]/10" aria-label="Reset password">
          <Key className="w-3.5 h-3.5" />
        </button>
        <button className="p-1 rounded text-gray-500 hover:text-[#ff3366] hover:bg-[#ff3366]/10" aria-label="Delete account">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
  },
];

export default function AccountsPage() {
  const [showNewForm, setShowNewForm] = useState(false);
  const active = ACCOUNTS.filter((a) => a.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="Total Admins"  value={ACCOUNTS.length.toString()} icon={UserCog} color="cyan" />
        <AdminKPICard label="Active"        value={active.toString()}          icon={Shield}  color="green" />
        <AdminKPICard label="2FA Enabled"   value={ACCOUNTS.filter(a => a.twoFA).length.toString()} icon={Key} color="orange" />
        <AdminKPICard label="Roles"         value="5"                          icon={UserCog} color="gold" />
      </div>

      {showNewForm && (
        <div className="admin-card border border-[#ff6b35]/20">
          <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
            New Admin Account
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Full name" className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-white placeholder-gray-600 outline-none focus:border-[#ff6b35]/40" />
            <input type="email" placeholder="Email address" className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-white placeholder-gray-600 outline-none focus:border-[#ff6b35]/40" />
            <select className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-white outline-none focus:border-[#ff6b35]/40 cursor-pointer">
              <option value="">Select role…</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="analyst">Analyst</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn text-xs py-2 px-4 min-h-0 h-9 bg-gradient-to-r from-[#ff6b35] to-[#ff8c00] text-white">
              Create Account
            </button>
            <button type="button" onClick={() => setShowNewForm(false)} className="btn btn-ghost text-xs py-2 px-4 min-h-0 h-9">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300">
            Admin Accounts
          </h3>
          <button
            type="button"
            onClick={() => setShowNewForm(!showNewForm)}
            className="btn text-xs py-2 px-3 min-h-0 h-9 gap-1.5 bg-gradient-to-r from-[#ff6b35] to-[#ff8c00] text-white"
          >
            <PlusCircle className="w-3.5 h-3.5" /> New Account
          </button>
        </div>
        <AdminTable columns={columns} data={ACCOUNTS} rowKey="id" />
      </div>
    </div>
  );
}

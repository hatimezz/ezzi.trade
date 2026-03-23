'use client';

import { useState } from 'react';
import { ScrollText, Search, AlertCircle, Info, CheckCircle, XCircle, Download } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminTable } from '../components/admin-table';
import type { AdminTableColumn } from '../components/admin-table';

export const runtime = 'nodejs';

type LogLevel = 'info' | 'warning' | 'error' | 'success';
type LogCategory = 'Auth' | 'Users' | 'Finance' | 'NFT' | 'Config' | 'System';

interface AuditEntry extends Record<string, unknown> {
  id: string;
  timestamp: string;
  admin: string;
  category: LogCategory;
  action: string;
  target: string;
  level: LogLevel;
  ip: string;
}

const LOGS: AuditEntry[] = [
  { id: '1',  timestamp: '2026-03-17 14:22:11', admin: 'root@ezzi.world',  category: 'Config',  action: 'Updated platform fee',           target: 'settings.platformFee → 3%',    level: 'info',    ip: '192.168.1.1' },
  { id: '2',  timestamp: '2026-03-17 13:45:08', admin: 'alice@ezzi.world', category: 'Users',   action: 'Suspended user account',         target: '0x9c0d…1e2f',                   level: 'warning', ip: '10.0.0.2' },
  { id: '3',  timestamp: '2026-03-17 12:30:55', admin: 'bob@ezzi.world',   category: 'Finance', action: 'Approved withdrawal request',     target: 'TX#88234 — 500 EZZI',           level: 'success', ip: '10.0.0.3' },
  { id: '4',  timestamp: '2026-03-17 11:15:22', admin: 'alice@ezzi.world', category: 'NFT',     action: 'Minted Genesis capsule batch',    target: 'Batch #7 — 100 capsules',       level: 'success', ip: '10.0.0.2' },
  { id: '5',  timestamp: '2026-03-17 10:08:44', admin: 'root@ezzi.world',  category: 'Auth',    action: 'Admin login from new IP',         target: 'root@ezzi.world',               level: 'warning', ip: '203.0.113.5' },
  { id: '6',  timestamp: '2026-03-16 22:14:09', admin: 'carol@ezzi.world', category: 'System',  action: 'Exported user data CSV',          target: 'users_2026-03-16.csv',          level: 'info',    ip: '10.0.0.4' },
  { id: '7',  timestamp: '2026-03-16 18:55:33', admin: 'bob@ezzi.world',   category: 'Config',  action: 'Toggled maintenance mode OFF',    target: 'settings.maintenanceMode',      level: 'success', ip: '10.0.0.3' },
  { id: '8',  timestamp: '2026-03-16 17:40:12', admin: 'alice@ezzi.world', category: 'Finance', action: 'Failed: duplicate payout denied', target: 'TX#88199',                      level: 'error',   ip: '10.0.0.2' },
  { id: '9',  timestamp: '2026-03-16 16:20:05', admin: 'root@ezzi.world',  category: 'Users',   action: 'Granted partner access',          target: 'Magic Eden BD team',            level: 'info',    ip: '192.168.1.1' },
  { id: '10', timestamp: '2026-03-16 14:05:48', admin: 'david@ezzi.world', category: 'Users',   action: 'Resolved support ticket #4821',   target: 'user 0x3a4b…',                 level: 'success', ip: '10.0.0.5' },
];

const LEVEL_CONFIG: Record<LogLevel, { color: string; bg: string; Icon: React.FC<{ className?: string }> }> = {
  info:    { color: '#8892a0', bg: 'rgba(136,146,160,0.10)', Icon: Info },
  warning: { color: '#ffd700', bg: 'rgba(255,215,0,0.10)',   Icon: AlertCircle },
  error:   { color: '#ff3366', bg: 'rgba(255,51,102,0.10)',  Icon: XCircle },
  success: { color: '#00ff9f', bg: 'rgba(0,255,159,0.10)',   Icon: CheckCircle },
};

const CAT_COLORS: Record<LogCategory, string> = {
  Auth:    '#ff6b35',
  Users:   '#00d4ff',
  Finance: '#ffd700',
  NFT:     '#b44dff',
  Config:  '#8892a0',
  System:  '#00ff9f',
};

const columns: AdminTableColumn<AuditEntry>[] = [
  { key: 'timestamp', label: 'Timestamp', sortable: true, render: (v) => <span className="text-xs font-mono text-gray-400">{String(v)}</span> },
  { key: 'admin',     label: 'Admin',     sortable: true, render: (v) => <span className="text-xs font-mono text-[#ff6b35]">{String(v)}</span> },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    render: (v) => (
      <span className="text-xs font-bold" style={{ color: CAT_COLORS[v as LogCategory] }}>{String(v)}</span>
    ),
  },
  { key: 'action', label: 'Action', sortable: false, render: (v) => <span className="text-sm text-white">{String(v)}</span> },
  { key: 'target', label: 'Target', sortable: false, render: (v) => <span className="text-xs text-gray-500 font-mono">{String(v)}</span> },
  {
    key: 'level',
    label: 'Level',
    sortable: true,
    align: 'center',
    render: (v) => {
      const cfg = LEVEL_CONFIG[v as LogLevel];
      const Icon = cfg.Icon;
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: cfg.color, background: cfg.bg }}>
          <Icon className="w-3 h-3" />
          {String(v)}
        </span>
      );
    },
  },
  { key: 'ip', label: 'IP', sortable: false, render: (v) => <span className="text-xs font-mono text-gray-600">{String(v)}</span> },
];

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [catFilter, setCatFilter] = useState<LogCategory | 'all'>('all');

  const filtered = LOGS.filter((l) => {
    const matchSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.admin.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'all' || l.level === levelFilter;
    const matchCat   = catFilter === 'all' || l.category === catFilter;
    return matchSearch && matchLevel && matchCat;
  });

  const errors   = LOGS.filter((l) => l.level === 'error').length;
  const warnings = LOGS.filter((l) => l.level === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="Total Events" value={LOGS.length.toString()}     icon={ScrollText}  color="cyan"   />
        <AdminKPICard label="Errors"       value={errors.toString()}          icon={XCircle}     color="red"    />
        <AdminKPICard label="Warnings"     value={warnings.toString()}        icon={AlertCircle} color="gold"   />
        <AdminKPICard label="Admins Active" value="5"                         icon={CheckCircle} color="green"  />
      </div>

      <div className="admin-card space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search logs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 flex-1"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-sm text-white outline-none focus:border-[#ff6b35]/40 cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value as LogCategory | 'all')}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-sm text-white outline-none focus:border-[#ff6b35]/40 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Auth">Auth</option>
            <option value="Users">Users</option>
            <option value="Finance">Finance</option>
            <option value="NFT">NFT</option>
            <option value="Config">Config</option>
            <option value="System">System</option>
          </select>

          <button className="btn btn-ghost text-xs py-2 px-3 min-h-0 h-9 gap-1.5 ml-auto">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        <AdminTable
          columns={columns}
          data={filtered}
          rowKey="id"
          emptyMessage="No log entries match your filters."
        />

        <p className="text-xs text-gray-600 font-mono">
          Showing {filtered.length} of {LOGS.length} entries
        </p>
      </div>
    </div>
  );
}

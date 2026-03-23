'use client';

import { useState } from 'react';
import { Bell, Send, Users, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminTable } from '../components/admin-table';
import type { AdminTableColumn } from '../components/admin-table';

export const runtime = 'nodejs';

type NotifType = 'System' | 'Marketing' | 'Event' | 'Alert';
type NotifStatus = 'sent' | 'scheduled' | 'draft' | 'failed';

interface NotifRow extends Record<string, unknown> {
  id: string;
  title: string;
  type: NotifType;
  audience: string;
  sent: number;
  opened: number;
  scheduledAt: string;
  status: NotifStatus;
}

const NOTIFICATIONS: NotifRow[] = [
  { id: '1', title: 'Presale Round 4 is LIVE!',      type: 'Marketing', audience: 'All Users',      sent: 47291, opened: 29800, scheduledAt: '2026-03-01 09:00', status: 'sent' },
  { id: '2', title: 'Void Capsule Drop — 500 left',  type: 'Event',     audience: 'Platinum Tier',  sent: 1240,  opened: 980,   scheduledAt: '2026-03-05 15:00', status: 'sent' },
  { id: '3', title: 'Weekly Mining Rewards Payout',  type: 'System',    audience: 'Active Miners',  sent: 12038, opened: 8420,  scheduledAt: '2026-03-10 12:00', status: 'sent' },
  { id: '4', title: 'Maintenance Window Tonight',    type: 'Alert',     audience: 'All Users',      sent: 0,     opened: 0,     scheduledAt: '2026-03-20 22:00', status: 'scheduled' },
  { id: '5', title: 'Genesis NFT Holder Rewards',    type: 'Event',     audience: 'Genesis Holders', sent: 0,    opened: 0,     scheduledAt: '2026-03-25 10:00', status: 'draft' },
  { id: '6', title: 'April Launch Countdown',        type: 'Marketing', audience: 'Waitlist',       sent: 0,     opened: 0,     scheduledAt: '2026-04-01 08:00', status: 'draft' },
];

const TYPE_COLORS: Record<NotifType, string> = {
  System:    '#8892a0',
  Marketing: '#ff6b35',
  Event:     '#00d4ff',
  Alert:     '#ff3366',
};

const STATUS_STYLES: Record<NotifStatus, { color: string; bg: string }> = {
  sent:      { color: '#00ff9f', bg: 'rgba(0,255,159,0.12)' },
  scheduled: { color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  draft:     { color: '#8892a0', bg: 'rgba(136,146,160,0.12)' },
  failed:    { color: '#ff3366', bg: 'rgba(255,51,102,0.12)' },
};

const columns: AdminTableColumn<NotifRow>[] = [
  { key: 'title',       label: 'Title',      sortable: true, render: (v) => <span className="font-semibold text-white text-xs">{String(v)}</span> },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
    render: (v) => <span className="text-xs font-semibold" style={{ color: TYPE_COLORS[v as NotifType] }}>{String(v)}</span>,
  },
  { key: 'audience',    label: 'Audience',   sortable: false, render: (v) => <span className="text-xs text-gray-400">{String(v)}</span> },
  { key: 'sent',        label: 'Sent',       sortable: true, align: 'right', render: (v) => <span className="font-mono text-xs">{Number(v) > 0 ? Number(v).toLocaleString() : '—'}</span> },
  {
    key: 'opened',
    label: 'Open Rate',
    sortable: false,
    align: 'center',
    render: (_v, row) => {
      if (Number(row.sent) === 0) return <span className="text-gray-600 text-xs">—</span>;
      const rate = Math.round((Number(row.opened) / Number(row.sent)) * 100);
      return <span className="font-mono text-xs text-[#00d4ff]">{rate}%</span>;
    },
  },
  { key: 'scheduledAt', label: 'Scheduled',  sortable: true, render: (v) => <span className="text-xs text-gray-400 font-mono">{String(v)}</span> },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (v) => {
      const s = STATUS_STYLES[v as NotifStatus];
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: s.color, background: s.bg }}>
          {String(v)}
        </span>
      );
    },
  },
  {
    key: 'id',
    label: '',
    align: 'center',
    render: () => (
      <button className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/10" aria-label="Delete notification">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    ),
  },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [notifType, setNotifType] = useState<NotifType>('Marketing');

  const sent = NOTIFICATIONS.filter((n) => n.status === 'sent').length;
  const totalReach = NOTIFICATIONS.filter((n) => n.status === 'sent').reduce((a, n) => a + n.sent, 0);

  function handleCompose(e: React.FormEvent) {
    e.preventDefault();
    setTitle('');
    setMessage('');
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="Total Sent"   value={sent.toString()}                  icon={Send}        color="orange" />
        <AdminKPICard label="Total Reach"  value={totalReach.toLocaleString()}       icon={Users}       color="cyan"   />
        <AdminKPICard label="Avg Open Rate" value="63%"                              icon={CheckCircle} color="green"  change="+4%" trend="up" />
        <AdminKPICard label="Scheduled"    value={NOTIFICATIONS.filter(n => n.status === 'scheduled').length.toString()} icon={Clock} color="gold" />
      </div>

      {/* Compose */}
      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#ff6b35]" /> Compose Notification
        </h3>
        <form onSubmit={handleCompose} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title…"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-white placeholder-gray-600 outline-none focus:border-[#ff6b35]/40"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Type</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as NotifType)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-white outline-none focus:border-[#ff6b35]/40 cursor-pointer"
                >
                  <option value="System">System</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Event">Event</option>
                  <option value="Alert">Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-white outline-none focus:border-[#ff6b35]/40 cursor-pointer"
                >
                  <option value="all">All Users</option>
                  <option value="platinum">Platinum Tier</option>
                  <option value="miners">Active Miners</option>
                  <option value="holders">NFT Holders</option>
                  <option value="waitlist">Waitlist</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification body…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-white placeholder-gray-600 outline-none focus:border-[#ff6b35]/40 resize-none"
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn text-sm py-2.5 px-5 min-h-0 gap-2 bg-gradient-to-r from-[#ff6b35] to-[#ff8c00] text-white">
              <Send className="w-4 h-4" /> Send Now
            </button>
            <button type="button" className="btn btn-ghost text-sm py-2.5 px-5 min-h-0 gap-2">
              <Clock className="w-4 h-4" /> Schedule
            </button>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Notification History
        </h3>
        <AdminTable columns={columns} data={NOTIFICATIONS} rowKey="id" />
      </div>
    </div>
  );
}

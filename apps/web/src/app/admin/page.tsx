'use client';

import { Users, Box, Sword, Rocket, Activity, DollarSign } from 'lucide-react';
import { AdminKPICard } from './components/admin-kpi-card';
import { AdminChart } from './components/admin-chart';
import { AdminTable } from './components/admin-table';
import type { AdminTableColumn } from './components/admin-table';

export const runtime = 'nodejs';

const revenueData = [
  { month: 'Oct', revenue: 28000, sales: 340 },
  { month: 'Nov', revenue: 42000, sales: 510 },
  { month: 'Dec', revenue: 61000, sales: 720 },
  { month: 'Jan', revenue: 55000, sales: 660 },
  { month: 'Feb', revenue: 78000, sales: 890 },
  { month: 'Mar', revenue: 94000, sales: 1120 },
];

const userGrowthData = [
  { week: 'W1', users: 1200, active: 940 },
  { week: 'W2', users: 1850, active: 1420 },
  { week: 'W3', users: 2700, active: 2100 },
  { week: 'W4', users: 3900, active: 3050 },
  { week: 'W5', users: 5400, active: 4200 },
  { week: 'W6', users: 7200, active: 5600 },
];

const capsuleDistData = [
  { tier: 'Bronze', opened: 8400, remaining: 4600 },
  { tier: 'Silver', opened: 5200, remaining: 2800 },
  { tier: 'Gold',   opened: 3100, remaining: 1900 },
  { tier: 'Cyber',  opened: 1400, remaining: 1600 },
  { tier: 'Void',   opened: 320,  remaining: 680 },
];

interface ActivityRow extends Record<string, unknown> {
  id: string;
  user: string;
  action: string;
  amount: string;
  time: string;
  status: 'success' | 'pending' | 'failed';
}

const recentActivity: ActivityRow[] = [
  { id: '1', user: '0x1a2b…3c4d', action: 'Capsule Open', amount: '0.25 SOL', time: '2m ago', status: 'success' },
  { id: '2', user: '0x5e6f…7a8b', action: 'NFT Purchase', amount: '1.8 SOL',  time: '7m ago', status: 'success' },
  { id: '3', user: '0x9c0d…1e2f', action: 'Presale Buy',  amount: '500 EZZI', time: '12m ago', status: 'pending' },
  { id: '4', user: '0x3a4b…5c6d', action: 'Capsule Open', amount: '0.5 SOL',  time: '18m ago', status: 'success' },
  { id: '5', user: '0x7e8f…9a0b', action: 'Withdrawal',   amount: '120 EZZI', time: '25m ago', status: 'failed' },
];

const STATUS_COLORS: Record<string, string> = {
  success: '#00ff9f',
  pending: '#ffd700',
  failed:  '#ff3366',
};

const activityColumns: AdminTableColumn<ActivityRow>[] = [
  { key: 'user',   label: 'Wallet',  sortable: true },
  { key: 'action', label: 'Action',  sortable: true },
  { key: 'amount', label: 'Amount',  sortable: false },
  { key: 'time',   label: 'Time',    sortable: false },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (v) => (
      <span
        className="px-2 py-1 rounded-full text-[10px] font-bold uppercase"
        style={{ color: STATUS_COLORS[String(v)], background: `${STATUS_COLORS[String(v)]}18` }}
      >
        {String(v)}
      </span>
    ),
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminKPICard label="Total Users"     value="47,291"  change="+12.4%" trend="up"   icon={Users}       color="cyan"   />
        <AdminKPICard label="Revenue (SOL)"   value="4,218"   change="+8.7%"  trend="up"   icon={DollarSign}  color="orange" />
        <AdminKPICard label="NFTs Minted"     value="18,340"  change="+5.2%"  trend="up"   icon={Sword}       color="gold"   />
        <AdminKPICard label="Capsules Opened" value="9,420"   change="+3.1%"  trend="up"   icon={Box}         color="purple" />
        <AdminKPICard label="Active Miners"   value="12,038"  change="-0.8%"  trend="down" icon={Activity}    color="green"  />
        <AdminKPICard label="Waitlist"        value="203,741" change="+1,204" trend="up"   icon={Rocket}      color="red"    />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="admin-card">
          <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
            Revenue (6 Months)
          </h3>
          <AdminChart
            type="area"
            data={revenueData}
            xKey="month"
            series={[
              { key: 'revenue', color: '#ff6b35', name: 'Revenue ($)' },
              { key: 'sales',   color: '#00d4ff', name: 'Sales' },
            ]}
          />
        </div>

        <div className="admin-card">
          <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
            User Growth
          </h3>
          <AdminChart
            type="line"
            data={userGrowthData}
            xKey="week"
            series={[
              { key: 'users',  color: '#00d4ff', name: 'Total Users' },
              { key: 'active', color: '#00ff9f', name: 'Active' },
            ]}
          />
        </div>
      </div>

      {/* Capsule distribution bar */}
      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Capsule Distribution by Tier
        </h3>
        <AdminChart
          type="bar"
          data={capsuleDistData}
          xKey="tier"
          stacked
          series={[
            { key: 'opened',    color: '#ff6b35', name: 'Opened' },
            { key: 'remaining', color: '#08082a', name: 'Remaining' },
          ]}
          height={220}
        />
      </div>

      {/* Recent activity */}
      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Recent Activity
        </h3>
        <AdminTable columns={activityColumns} data={recentActivity} rowKey="id" />
      </div>
    </div>
  );
}

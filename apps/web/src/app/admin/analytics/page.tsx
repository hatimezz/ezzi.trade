'use client';

import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminChart, AdminPieChart } from '../components/admin-chart';

export const runtime = 'nodejs';

const dailyActiveData = [
  { date: 'Mar 11', dau: 8200,  new: 620,  churned: 180 },
  { date: 'Mar 12', dau: 8950,  new: 810,  churned: 210 },
  { date: 'Mar 13', dau: 8600,  new: 540,  churned: 320 },
  { date: 'Mar 14', dau: 9400,  new: 920,  churned: 190 },
  { date: 'Mar 15', dau: 10200, new: 1080, churned: 240 },
  { date: 'Mar 16', dau: 11500, new: 1420, churned: 280 },
  { date: 'Mar 17', dau: 12038, new: 1604, churned: 310 },
];

const revenueBreakdown = [
  { source: 'Capsules',    revenue: 94000 },
  { source: 'Marketplace', revenue: 61000 },
  { source: 'Presale',     revenue: 820000 },
  { source: 'Mining Fees', revenue: 18000 },
  { source: 'Partners',    revenue: 40000 },
];

const retentionData = [
  { week: 'W-6', d1: 72, d7: 41, d30: 22 },
  { week: 'W-5', d1: 74, d7: 43, d30: 24 },
  { week: 'W-4', d1: 69, d7: 38, d30: 20 },
  { week: 'W-3', d1: 76, d7: 46, d30: 26 },
  { week: 'W-2', d1: 78, d7: 49, d30: 28 },
  { week: 'W-1', d1: 81, d7: 52, d30: 31 },
];

const regionData = [
  { name: 'Asia Pacific',   value: 38, color: '#00d4ff' },
  { name: 'North America',  value: 28, color: '#ff6b35' },
  { name: 'Europe',         value: 19, color: '#ffd700' },
  { name: 'Latin America',  value: 9,  color: '#00ff9f' },
  { name: 'Other',          value: 6,  color: '#8892a0' },
];

const deviceData = [
  { name: 'Mobile',  value: 62, color: '#ff6b35' },
  { name: 'Desktop', value: 32, color: '#00d4ff' },
  { name: 'Tablet',  value: 6,  color: '#ffd700' },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="DAU"            value="12,038"  icon={Users}      color="cyan"   change="+1,604 today" trend="up" />
        <AdminKPICard label="MAU"            value="47,291"  icon={TrendingUp} color="orange" change="+12.4%" trend="up" />
        <AdminKPICard label="Avg Session"    value="8.4 min" icon={BarChart3}  color="gold"   change="+0.8m" trend="up" />
        <AdminKPICard label="Total Revenue"  value="$1.03M"  icon={DollarSign} color="green"  change="+8.7%" trend="up" />
      </div>

      {/* DAU / New / Churned */}
      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Daily Active Users (7 days)
        </h3>
        <AdminChart
          type="area"
          data={dailyActiveData}
          xKey="date"
          series={[
            { key: 'dau',     color: '#00d4ff', name: 'DAU' },
            { key: 'new',     color: '#00ff9f', name: 'New' },
            { key: 'churned', color: '#ff3366', name: 'Churned' },
          ]}
          height={260}
        />
      </div>

      {/* Revenue Breakdown + Region + Device */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="admin-card xl:col-span-1">
          <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
            Revenue by Source
          </h3>
          <AdminChart
            type="bar"
            data={revenueBreakdown}
            xKey="source"
            series={[{ key: 'revenue', color: '#ff6b35', name: 'Revenue ($)' }]}
            height={220}
          />
        </div>

        <div className="admin-card">
          <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
            Users by Region
          </h3>
          <AdminPieChart data={regionData} height={200} />
          <div className="mt-3 space-y-1.5">
            {regionData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-gray-400">{d.name}</span>
                </div>
                <span className="font-mono" style={{ color: d.color }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
            Device Split
          </h3>
          <AdminPieChart data={deviceData} height={200} />
          <div className="mt-3 space-y-1.5">
            {deviceData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-gray-400">{d.name}</span>
                </div>
                <span className="font-mono" style={{ color: d.color }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Retention */}
      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Retention Rates (D1 / D7 / D30)
        </h3>
        <AdminChart
          type="line"
          data={retentionData}
          xKey="week"
          series={[
            { key: 'd1',  color: '#00d4ff', name: 'D1 %' },
            { key: 'd7',  color: '#ff6b35', name: 'D7 %' },
            { key: 'd30', color: '#00ff9f', name: 'D30 %' },
          ]}
          height={220}
        />
      </div>
    </div>
  );
}

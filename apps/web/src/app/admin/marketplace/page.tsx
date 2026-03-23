'use client';

import { ShoppingCart, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminChart } from '../components/admin-chart';
import { AdminTable } from '../components/admin-table';
import type { AdminTableColumn } from '../components/admin-table';

export const runtime = 'nodejs';

type TxType = 'Sale' | 'Listing' | 'Offer' | 'Transfer';

interface MarketTx extends Record<string, unknown> {
  id: string;
  item: string;
  type: TxType;
  seller: string;
  buyer: string;
  price: string;
  fee: string;
  time: string;
}

const TRANSACTIONS: MarketTx[] = [
  { id: '1', item: 'Zephyr #001',    type: 'Sale',     seller: '0x1a2b…', buyer: '0x5e6f…', price: '45.0 SOL', fee: '1.35 SOL', time: '2m ago' },
  { id: '2', item: 'Kira #042',      type: 'Listing',  seller: '0x9c0d…', buyer: '—',        price: '12.5 SOL', fee: '—',        time: '9m ago' },
  { id: '3', item: 'Blaze #108',     type: 'Sale',     seller: '0x3a4b…', buyer: '0x7e8f…', price: '4.2 SOL',  fee: '0.13 SOL', time: '14m ago' },
  { id: '4', item: 'Nova #215',      type: 'Offer',    seller: '0xb1c2…', buyer: '0xf5a6…', price: '2.0 SOL',  fee: '—',        time: '20m ago' },
  { id: '5', item: 'Frost #330',     type: 'Sale',     seller: '0xd9e0…', buyer: '0x1a2b…', price: '0.45 SOL', fee: '0.014 SOL', time: '33m ago' },
  { id: '6', item: 'Sandstorm #017', type: 'Transfer', seller: '0x5e6f…', buyer: '0x9c0d…', price: '—',        fee: '—',        time: '1h ago' },
];

const volumeData = [
  { day: 'Mon', volume: 180, trades: 42 },
  { day: 'Tue', volume: 240, trades: 58 },
  { day: 'Wed', volume: 195, trades: 47 },
  { day: 'Thu', volume: 310, trades: 74 },
  { day: 'Fri', volume: 420, trades: 102 },
  { day: 'Sat', volume: 380, trades: 88 },
  { day: 'Sun', volume: 290, trades: 68 },
];

const TYPE_COLORS: Record<TxType, { color: string; bg: string }> = {
  Sale:     { color: '#00ff9f', bg: 'rgba(0,255,159,0.10)' },
  Listing:  { color: '#00d4ff', bg: 'rgba(0,212,255,0.10)' },
  Offer:    { color: '#ffd700', bg: 'rgba(255,215,0,0.10)' },
  Transfer: { color: '#8892a0', bg: 'rgba(136,146,160,0.10)' },
};

const columns: AdminTableColumn<MarketTx>[] = [
  { key: 'item',   label: 'Item',   sortable: true, render: (v) => <span className="font-bold text-white">{String(v)}</span> },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
    render: (v) => {
      const s = TYPE_COLORS[v as TxType];
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: s.color, background: s.bg }}>
          {String(v)}
        </span>
      );
    },
  },
  { key: 'seller', label: 'Seller', sortable: false, render: (v) => <span className="font-mono text-[#00d4ff] text-xs">{String(v)}</span> },
  { key: 'buyer',  label: 'Buyer',  sortable: false, render: (v) => <span className="font-mono text-[#00d4ff] text-xs">{String(v)}</span> },
  { key: 'price',  label: 'Price',  sortable: false, align: 'right', render: (v) => <span className="font-mono text-[#ffd700]">{String(v)}</span> },
  { key: 'fee',    label: 'Fee',    sortable: false, align: 'right', render: (v) => <span className="font-mono text-[#ff6b35] text-xs">{String(v)}</span> },
  { key: 'time',   label: 'Time',   sortable: false, render: (v) => <span className="text-gray-500 text-xs">{String(v)}</span> },
];

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="7d Volume"     value="2,015 SOL" icon={DollarSign}   color="orange" change="+22%" trend="up" />
        <AdminKPICard label="Total Trades"  value="479"       icon={ShoppingCart} color="cyan"   change="+18%" trend="up" />
        <AdminKPICard label="Active Listings" value="4,210"   icon={Activity}     color="gold"   />
        <AdminKPICard label="Avg Sale Price" value="4.2 SOL"  icon={TrendingUp}   color="green"  change="+5%" trend="up" />
      </div>

      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Weekly Trading Volume
        </h3>
        <AdminChart
          type="area"
          data={volumeData}
          xKey="day"
          series={[
            { key: 'volume', color: '#ff6b35', name: 'Volume (SOL)' },
            { key: 'trades', color: '#00d4ff', name: 'Trades' },
          ]}
        />
      </div>

      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Recent Transactions
        </h3>
        <AdminTable columns={columns} data={TRANSACTIONS} rowKey="id" />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Sword, Search, Star, TrendingUp, Layers } from 'lucide-react';
import { AdminKPICard } from '../components/admin-kpi-card';
import { AdminPieChart } from '../components/admin-chart';
import { AdminTable } from '../components/admin-table';
import type { AdminTableColumn } from '../components/admin-table';

export const runtime = 'nodejs';

type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

interface NFTRow extends Record<string, unknown> {
  id: string;
  name: string;
  rarity: Rarity;
  zone: string;
  owner: string;
  mintedAt: string;
  floorPrice: string;
  listed: boolean;
}

const RARITY_STYLES: Record<Rarity, { color: string; bg: string }> = {
  Common:    { color: '#8a9bb0', bg: 'rgba(138,155,176,0.12)' },
  Rare:      { color: '#4d9fff', bg: 'rgba(77,159,255,0.12)' },
  Epic:      { color: '#b44dff', bg: 'rgba(180,77,255,0.12)' },
  Legendary: { color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  Mythic:    { color: '#ff00ff', bg: 'rgba(255,0,255,0.12)' },
};

const NFTS: NFTRow[] = [
  { id: '1',  name: 'Zephyr #001',    rarity: 'Mythic',    zone: 'The Void',      owner: '0x1a2b…', mintedAt: '2026-01-10', floorPrice: '45 SOL',  listed: false },
  { id: '2',  name: 'Kira #042',      rarity: 'Legendary', zone: 'Neon City',     owner: '0x5e6f…', mintedAt: '2026-01-11', floorPrice: '12 SOL',  listed: true  },
  { id: '3',  name: 'Blaze #108',     rarity: 'Epic',      zone: 'Volcano',       owner: '0x9c0d…', mintedAt: '2026-01-14', floorPrice: '4.2 SOL', listed: true  },
  { id: '4',  name: 'Nova #215',      rarity: 'Rare',      zone: 'Deep Ocean',    owner: '0x3a4b…', mintedAt: '2026-01-18', floorPrice: '1.8 SOL', listed: false },
  { id: '5',  name: 'Frost #330',     rarity: 'Common',    zone: 'Frozen Tundra', owner: '0x7e8f…', mintedAt: '2026-01-22', floorPrice: '0.4 SOL', listed: true  },
  { id: '6',  name: 'Sandstorm #017', rarity: 'Legendary', zone: 'Desert Storm',  owner: '0xb1c2…', mintedAt: '2026-01-25', floorPrice: '15 SOL',  listed: false },
  { id: '7',  name: 'Void #003',      rarity: 'Mythic',    zone: 'The Void',      owner: '0xf5a6…', mintedAt: '2026-02-01', floorPrice: '88 SOL',  listed: true  },
  { id: '8',  name: 'Circuit #512',   rarity: 'Rare',      zone: 'Neon City',     owner: '0xd9e0…', mintedAt: '2026-02-05', floorPrice: '2.1 SOL', listed: false },
];

const rarityPieData = [
  { name: 'Common',    value: 9200,  color: '#8a9bb0' },
  { name: 'Rare',      value: 5600,  color: '#4d9fff' },
  { name: 'Epic',      value: 2100,  color: '#b44dff' },
  { name: 'Legendary', value: 620,   color: '#ffd700' },
  { name: 'Mythic',    value: 80,    color: '#ff00ff' },
];

const columns: AdminTableColumn<NFTRow>[] = [
  { key: 'name',       label: 'NFT',          sortable: true, render: (v) => <span className="font-bold text-white">{String(v)}</span> },
  {
    key: 'rarity',
    label: 'Rarity',
    sortable: true,
    render: (v) => {
      const s = RARITY_STYLES[v as Rarity];
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: s.color, background: s.bg }}>
          {String(v)}
        </span>
      );
    },
  },
  { key: 'zone',       label: 'Zone',         sortable: true, render: (v) => <span className="text-gray-400">{String(v)}</span> },
  { key: 'owner',      label: 'Owner',        sortable: false, render: (v) => <span className="font-mono text-[#00d4ff]">{String(v)}</span> },
  { key: 'floorPrice', label: 'Floor Price',  sortable: false, align: 'right', render: (v) => <span className="font-mono text-[#ffd700]">{String(v)}</span> },
  {
    key: 'listed',
    label: 'Listed',
    align: 'center',
    render: (v) => v
      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-[#00ff9f] bg-[#00ff9f]/10">Yes</span>
      : <span className="text-gray-600 text-xs">—</span>,
  },
  { key: 'mintedAt',   label: 'Minted',       sortable: true },
];

export default function NFTsPage() {
  const [search, setSearch] = useState('');

  const filtered = NFTS.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.rarity.toLowerCase().includes(search.toLowerCase()) ||
      n.zone.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminKPICard label="Total Minted"  value="17,600"  icon={Sword}      color="cyan"   change="+340 today" trend="up" />
        <AdminKPICard label="Listed"        value="4,210"   icon={Layers}     color="orange" />
        <AdminKPICard label="Mythic Supply" value="80"      icon={Star}       color="purple" />
        <AdminKPICard label="Floor (SOL)"   value="0.4"     icon={TrendingUp} color="gold"   change="+12%" trend="up" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="admin-card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300">
              NFT Registry
            </h3>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search NFTs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-36"
              />
            </div>
          </div>
          <AdminTable columns={columns} data={filtered} rowKey="id" />
        </div>

        <div className="admin-card">
          <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
            Rarity Distribution
          </h3>
          <AdminPieChart data={rarityPieData} height={240} />
          <div className="mt-4 space-y-2">
            {rarityPieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-gray-400">{d.name}</span>
                </div>
                <span className="font-mono" style={{ color: d.color }}>{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

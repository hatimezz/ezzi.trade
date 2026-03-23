'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword,
  Package,
  TrendingUp,
  Wallet,
  LogOut,
  Sparkles,
  Zap,
  ChevronRight,
  Gem,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useWallet } from '@/hooks/use-wallet';

export const runtime = 'nodejs';

type Tab = 'warriors' | 'capsules' | 'stats';

interface UserData {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  wallets: Array<{
    id: string;
    address: string;
    chain: string;
    isPrimary: boolean;
  }>;
  balance: {
    ezziBalance: number;
    totalMined: number;
    totalEarned: number;
    totalSpent: number;
  } | null;
  stats: {
    nftCount: number;
    capsuleCount: number;
  };
}

interface NFT {
  id: string;
  warrior: {
    id: string;
    name: string;
    displayName: string;
    rarity: string;
    zone: string;
    imageUrl: string;
    attack: number;
    defense: number;
    speed: number;
    magic: number;
  };
  durability: number;
  isStaked: boolean;
  editionNumber: number;
}

interface CapsuleOpening {
  id: string;
  capsuleTier: {
    name: string;
    displayName: string;
  };
  openedAt: string;
  resultType: string;
  rarity: string | null;
  amount: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { connected: walletConnected, publicKey, disconnect: disconnectWallet } = useWallet();

  const [activeTab, setActiveTab] = useState<Tab>('warriors');
  const [user, setUser] = useState<UserData | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [capsules, setCapsules] = useState<CapsuleOpening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [userRes, nftsRes, capsulesRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/users/nfts'),
        api.get('/users/capsules'),
      ]);

      if (userRes.data.success) {
        setUser(userRes.data.data.user);
      }
      if (nftsRes.data.success) {
        setNfts(nftsRes.data.data);
      }
      if (capsulesRes.data.success) {
        setCapsules(capsulesRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // Redirect to login if unauthorized
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post('/auth/logout');
      if (walletConnected) {
        await disconnectWallet();
      }
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-[#8a9bb0]',
      rare: 'text-[#4d9fff]',
      epic: 'text-[#b44dff]',
      legendary: 'text-[#ffd700]',
      mythic: 'text-[#ff00ff]',
    };
    return colors[rarity.toLowerCase()] || 'text-[#8a9bb0]';
  };

  const getRarityBg = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-[#8a9bb0]/10 border-[#8a9bb0]/30',
      rare: 'bg-[#4d9fff]/10 border-[#4d9fff]/30',
      epic: 'bg-[#b44dff]/10 border-[#b44dff]/30',
      legendary: 'bg-[#ffd700]/10 border-[#ffd700]/30',
      mythic: 'bg-[#ff00ff]/10 border-[#ff00ff]/30',
    };
    return colors[rarity.toLowerCase()] || 'bg-[#8a9bb0]/10 border-[#8a9bb0]/30';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8892a0]">Loading your arsenal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page-base relative">
      {/* Background Effects */}
      <div className="bg-grid" />
      <div className="bg-scanlines" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d4ff]/3 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0088aa] flex items-center justify-center text-2xl font-bold">
                {(user.displayName || user.username || 'W')[0].toUpperCase()}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">
                  {user.displayName || user.username}
                </h1>
                <div className="flex items-center gap-3 text-sm text-[#8892a0]">
                  <span>@{user.username}</span>
                  {user.isAdmin && (
                    <span className="px-2 py-0.5 bg-[#ffd700]/10 text-[#ffd700] rounded text-xs font-medium">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="flex flex-wrap gap-4">
              <StatCard
                icon={Gem}
                label="EZZI Balance"
                value={user.balance?.ezziBalance.toLocaleString() || '0'}
                color="text-[#00d4ff]"
              />
              <StatCard
                icon={Sword}
                label="Warriors"
                value={user.stats.nftCount.toString()}
                color="text-[#ffd700]"
              />
              <StatCard
                icon={Package}
                label="Capsules"
                value={user.stats.capsuleCount.toString()}
                color="text-[#b44dff]"
              />
              <StatCard
                icon={TrendingUp}
                label="Total Mined"
                value={user.balance?.totalMined.toLocaleString() || '0'}
                color="text-[#00ff9f]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {walletConnected && publicKey && (
                <div className="px-4 py-2 bg-[#0d0d1a] border border-white/10 rounded-lg flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#00d4ff]" />
                  <span className="text-sm font-mono">{truncateAddress(publicKey)}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="btn btn-ghost p-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <TabButton
            active={activeTab === 'warriors'}
            onClick={() => setActiveTab('warriors')}
            icon={Sword}
            label="My Warriors"
            count={user.stats.nftCount}
          />
          <TabButton
            active={activeTab === 'capsules'}
            onClick={() => setActiveTab('capsules')}
            icon={Package}
            label="My Capsules"
            count={user.stats.capsuleCount}
          />
          <TabButton
            active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
            icon={TrendingUp}
            label="Statistics"
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'warriors' && (
            <motion.div
              key="warriors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WarriorsTab nfts={nfts} getRarityColor={getRarityColor} getRarityBg={getRarityBg} />
            </motion.div>
          )}
          {activeTab === 'capsules' && (
            <motion.div
              key="capsules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CapsulesTab capsules={capsules} getRarityColor={getRarityColor} />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StatsTab user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0d0d1a]/50 border border-white/5 rounded-lg">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <p className="text-xs text-[#8892a0]">{label}</p>
        <p className={`font-mono font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
        active
          ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30'
          : 'bg-[#0d0d1a]/50 text-[#8892a0] border border-white/5 hover:border-white/10 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`px-2 py-0.5 rounded-full text-xs ${
            active ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'bg-white/10 text-[#8892a0]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function WarriorsTab({
  nfts,
  getRarityColor,
  getRarityBg,
}: {
  nfts: NFT[];
  getRarityColor: (rarity: string) => string;
  getRarityBg: (rarity: string) => string;
}) {
  if (nfts.length === 0) {
    return (
      <div className="card-glass p-12 text-center">
        <Sword className="w-16 h-16 text-[#4a5568] mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold mb-2">No Warriors Yet</h3>
        <p className="text-[#8892a0] mb-6">
          Start your collection by opening capsules or visiting the marketplace
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/capsules" className="btn btn-primary">
            Open Capsules
          </Link>
          <Link href="/marketplace" className="btn btn-secondary">
            Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {nfts.map((nft) => (
        <motion.div
          key={nft.id}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-glass overflow-hidden group"
        >
          {/* NFT Image */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={nft.warrior.imageUrl}
              alt={nft.warrior.displayName}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute top-3 left-3">
              <span
                className={`px-2 py-1 rounded text-xs font-bold uppercase ${getRarityBg(
                  nft.warrior.rarity
                )} ${getRarityColor(nft.warrior.rarity)}`}
              >
                {nft.warrior.rarity}
              </span>
            </div>
            {nft.isStaked && (
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 rounded text-xs font-bold bg-[#00ff9f]/10 text-[#00ff9f] border border-[#00ff9f]/30">
                  STAKED
                </span>
              </div>
            )}
          </div>

          {/* NFT Info */}
          <div className="p-4">
            <h3 className="font-display font-bold text-lg mb-1">{nft.warrior.displayName}</h3>
            <p className="text-sm text-[#8892a0] mb-3">
              Edition #{nft.editionNumber} • {nft.warrior.zone.replace('_', ' ')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <StatBadge icon={Zap} value={nft.warrior.attack} label="ATK" />
              <StatBadge icon={Gem} value={nft.warrior.defense} label="DEF" />
              <StatBadge icon={Sparkles} value={nft.warrior.speed} label="SPD" />
              <StatBadge icon={TrendingUp} value={nft.warrior.magic} label="MAG" />
            </div>

            {/* Durability Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8892a0]">Durability</span>
                <span className={nft.durability > 30 ? 'text-[#00ff9f]' : 'text-red-400'}>
                  {nft.durability}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    nft.durability > 30 ? 'bg-[#00ff9f]' : 'bg-red-500'
                  }`}
                  style={{ width: `${nft.durability}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                href={`/warriors/${nft.id}`}
                className="flex-1 btn btn-secondary text-sm py-2"
              >
                Details
              </Link>
              <Link
                href={`/marketplace/sell/${nft.id}`}
                className="flex-1 btn btn-gold text-sm py-2"
              >
                Sell
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StatBadge({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  return (
    <div className="text-center p-2 bg-white/5 rounded">
      <Icon className="w-3 h-3 text-[#00d4ff] mx-auto mb-1" />
      <p className="font-mono font-bold text-sm">{value}</p>
      <p className="text-[10px] text-[#8892a0] uppercase">{label}</p>
    </div>
  );
}

function CapsulesTab({
  capsules,
  getRarityColor,
}: {
  capsules: CapsuleOpening[];
  getRarityColor: (rarity: string) => string;
}) {
  if (capsules.length === 0) {
    return (
      <div className="card-glass p-12 text-center">
        <Package className="w-16 h-16 text-[#4a5568] mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold mb-2">No Capsules Opened</h3>
        <p className="text-[#8892a0] mb-6">Open your first capsule to start collecting warriors</p>
        <Link href="/capsules" className="btn btn-primary">
          Open Capsules
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {capsules.map((capsule) => (
        <motion.div
          key={capsule.id}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-glass p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#b44dff] to-[#6600aa] flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h4 className="font-display font-bold">{capsule.capsuleTier.displayName}</h4>
            <p className="text-sm text-[#8892a0]">
              Opened {new Date(capsule.openedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-right">
            {capsule.resultType === 'nft' && capsule.rarity && (
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold uppercase ${getRarityColor(
                  capsule.rarity
                )}`}
              >
                <Sparkles className="w-4 h-4" />
                {capsule.rarity}
              </span>
            )}
            {capsule.resultType === 'ezzi' && capsule.amount && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold text-[#00d4ff]">
                <Gem className="w-4 h-4" />
                {capsule.amount.toLocaleString()} EZZI
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StatsTab({ user }: { user: UserData }) {
  const stats = [
    {
      label: 'Total Warriors',
      value: user.stats.nftCount,
      icon: Sword,
      color: 'text-[#ffd700]',
      bg: 'bg-[#ffd700]/10',
    },
    {
      label: 'Capsules Opened',
      value: user.stats.capsuleCount,
      icon: Package,
      color: 'text-[#b44dff]',
      bg: 'bg-[#b44dff]/10',
    },
    {
      label: 'EZZI Mined',
      value: Math.floor(user.balance?.totalMined || 0).toLocaleString(),
      icon: TrendingUp,
      color: 'text-[#00ff9f]',
      bg: 'bg-[#00ff9f]/10',
    },
    {
      label: 'EZZI Earned',
      value: Math.floor(user.balance?.totalEarned || 0).toLocaleString(),
      icon: Gem,
      color: 'text-[#00d4ff]',
      bg: 'bg-[#00d4ff]/10',
    },
    {
      label: 'EZZI Spent',
      value: Math.floor(user.balance?.totalSpent || 0).toLocaleString(),
      icon: Wallet,
      color: 'text-[#ff8c00]',
      bg: 'bg-[#ff8c00]/10',
    },
    {
      label: 'Current Balance',
      value: Math.floor(user.balance?.ezziBalance || 0).toLocaleString(),
      icon: Gem,
      color: 'text-[#00d4ff]',
      bg: 'bg-[#00d4ff]/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-glass p-6"
          >
            <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-[#8892a0] text-sm mb-1">{stat.label}</p>
            <p className={`font-mono text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card-glass p-6">
        <h3 className="font-display font-bold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/capsules"
            className="flex items-center gap-3 p-4 bg-[#0d0d1a] border border-white/10 rounded-lg hover:border-[#00d4ff]/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded bg-[#b44dff]/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#b44dff]" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Open Capsules</p>
              <p className="text-sm text-[#8892a0]">Get new warriors</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#4a5568] group-hover:text-[#00d4ff] transition-colors" />
          </Link>

          <Link
            href="/marketplace"
            className="flex items-center gap-3 p-4 bg-[#0d0d1a] border border-white/10 rounded-lg hover:border-[#00d4ff]/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded bg-[#ffd700]/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#ffd700]" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Marketplace</p>
              <p className="text-sm text-[#8892a0]">Buy & sell NFTs</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#4a5568] group-hover:text-[#00d4ff] transition-colors" />
          </Link>

          <Link
            href="/mining"
            className="flex items-center gap-3 p-4 bg-[#0d0d1a] border border-white/10 rounded-lg hover:border-[#00d4ff]/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded bg-[#00ff9f]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#00ff9f]" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Start Mining</p>
              <p className="text-sm text-[#8892a0]">Earn EZZI</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#4a5568] group-hover:text-[#00d4ff] transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Wallet, Trophy, Gift, Clock } from 'lucide-react';

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
        };
        platform: string;
        version: string;
        sendData: (data: string) => void;
      };
    };
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ezzi-world-api.fly.dev/api';

const tabs = [
  { id: 'mine', label: 'Mine', icon: Zap },
  { id: 'ranks', label: 'Ranks', icon: Trophy },
  { id: 'squad', label: 'Squad', icon: Users },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
];

export default function TelegramApp() {
  const [activeTab, setActiveTab] = useState('mine');
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Telegram WebApp
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      // Set user from Telegram
      if (tg.initDataUnsafe.user) {
        setUser(tg.initDataUnsafe.user);
        authenticateUser(tg.initDataUnsafe.user);
      }

      // Set theme colors
      document.body.style.backgroundColor = '#02020a';
    }
  }, []);

  // Authenticate with backend
  const authenticateUser = async (tgUser: any) => {
    try {
      const response = await fetch(`${API_URL}/telegram/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: tgUser.id.toString(),
          username: tgUser.username,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          photoUrl: tgUser.photo_url,
        }),
      });

      if (!response.ok) throw new Error('Auth failed');

      const data = await response.json();
      if (data.success) {
        setBalance(data.data.balance || 0);
      }
    } catch (err) {
      setError('Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#02020a]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Zap className="w-8 h-8 text-[#00d4ff]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#02020a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#02020a]/95 backdrop-blur border-b border-white/5">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#00d4ff]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <div>
              <h1 className="font-bold">EZZI World</h1>
              <p className="text-xs text-gray-400">{user?.first_name || 'Warrior'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Balance</p>
            <p className="text-lg font-bold text-[#00d4ff]">{Math.floor(balance).toLocaleString()}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'mine' && (
            <MineTab key="mine" balance={balance} setBalance={setBalance} />
          )}
          {activeTab === 'ranks' && <RanksTab key="ranks" />}
          {activeTab === 'squad' && <SquadTab key="squad" />}
          {activeTab === 'wallet' && <WalletTab key="wallet" balance={balance} />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a1a] border-t border-white/10 z-50">
        <div className="flex justify-around p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-[#00d4ff]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function MineTab({ balance, setBalance }: { balance: number; setBalance: (b: number) => void }) {
  const [mining, setMining] = useState(false);
  const [lastClaim, setLastClaim] = useState<number | null>(null);

  const handleMine = async () => {
    if (mining) return;

    setMining(true);

    try {
      const response = await fetch(`${API_URL}/telegram/mine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: window.Telegram?.WebApp.initDataUnsafe.user?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(balance + data.data.amount);
        setLastClaim(Date.now());

        // Haptic feedback
        if (window.Telegram?.WebApp.platform === 'ios') {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      }
    } catch (error) {
      console.error('Mining failed:', error);
    } finally {
      setMining(false);
    }
  };

  const timeUntilNext = lastClaim ? Math.max(0, 60000 - (Date.now() - lastClaim)) : 0;
  const canMine = timeUntilNext === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Mining Button */}
      <div className="bg-gradient-to-br from-[#00d4ff]/20 to-[#02020a] rounded-2xl p-6 border border-[#00d4ff]/30">
        <div className="text-center">
          <div className="relative w-40 h-40 mx-auto mb-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleMine}
              disabled={!canMine || mining}
              className={`w-full h-full rounded-full flex items-center justify-center transition-all ${
                canMine
                  ? 'bg-[#00d4ff] shadow-[0_0_40px_rgba(0,212,255,0.5)]'
                  : 'bg-gray-700'
              }`}
            >
              {mining ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Zap className="w-16 h-16 text-[#02020a]" />
                </motion.div>
              ) : (
                <Zap className="w-16 h-16 text-[#02020a]" />
              )}
            </motion.button>
          </div>

          <p className="text-2xl font-bold mb-2">
            {canMine ? 'Tap to Mine!' : 'Wait...'}
          </p>

          {!canMine && timeUntilNext > 0 && (
            <p className="text-sm text-gray-400">
              Next mine in {Math.ceil(timeUntilNext / 1000)}s
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0a0a1a] rounded-xl p-4 border border-white/10">
          <Zap className="w-6 h-6 text-[#00d4ff] mb-2" />
          <p className="text-2xl font-bold">24.5</p>
          <p className="text-xs text-gray-400">EZZI/hour</p>
        </div>
        <div className="bg-[#0a0a1a] rounded-xl p-4 border border-white/10">
          <Clock className="w-6 h-6 text-[#00d4ff] mb-2" />
          <p className="text-2xl font-bold">12h</p>
          <p className="text-xs text-gray-400">Total Mined</p>
        </div>
      </div>

      {/* Daily Bonus */}
      <div className="bg-gradient-to-r from-[#ffd700]/20 to-[#ff8c00]/20 rounded-xl p-4 border border-[#ffd700]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gift className="w-8 h-8 text-[#ffd700]" />
            <div>
              <p className="font-bold">Daily Bonus</p>
              <p className="text-sm text-gray-400">Claim 500 EZZI</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-[#ffd700] text-[#02020a] rounded-lg font-bold text-sm">
            Claim
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function RanksTab() {
  const [leaders, setLeaders] = useState([
    { rank: 1, name: 'CryptoKing', balance: '2.5M', avatar: '👑' },
    { rank: 2, name: 'EZZIHunter', balance: '1.8M', avatar: '⚔️' },
    { rank: 3, name: 'VoidWalker', balance: '1.2M', avatar: '🌌' },
    { rank: 4, name: 'NeonRider', balance: '980K', avatar: '🏍️' },
    { rank: 5, name: 'DesertFox', balance: '850K', avatar: '🦊' },
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold mb-4">Top Miners</h2>

      {leaders.map((leader, index) => (
        <motion.div
          key={leader.rank}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center space-x-4 p-4 bg-[#0a0a1a] rounded-xl border border-white/10"
        >
          <div className="text-2xl w-8">
            {leader.rank === 1 && '🥇'}
            {leader.rank === 2 && '🥈'}
            {leader.rank === 3 && '🥉'}
            {leader.rank > 3 && leader.rank}
          </div>
          <div className="text-3xl">{leader.avatar}</div>
          <div className="flex-1">
            <p className="font-bold">{leader.name}</p>
            <p className="text-sm text-gray-400">{leader.balance} EZZI</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function SquadTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="bg-[#0a0a1a] rounded-2xl p-6 border border-white/10">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚡</div>
          <h2 className="text-xl font-bold">EZZI Miners</h2>
          <p className="text-gray-400">12 members · Rank #47</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-400">Total Mined</p>
            <p className="text-2xl font-bold">2.4M</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Squad Bonus</p>
            <p className="text-2xl font-bold text-[#00d4ff]">+15%</p>
          </div>
        </div>

        <button className="w-full py-3 bg-[#00d4ff] text-[#02020a] rounded-xl font-bold">
          Invite Friends
        </button>
      </div>
    </motion.div>
  );
}

function WalletTab({ balance }: { balance: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="bg-gradient-to-br from-[#00d4ff]/20 to-[#02020a] rounded-2xl p-6 border border-[#00d4ff]/30">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400 mb-1">Total Balance</p>
          <p className="text-4xl font-bold font-['Space_Mono']">{Math.floor(balance).toLocaleString()}</p>
          <p className="text-sm text-gray-400">$EZZI</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="py-3 bg-[#00d4ff] text-[#02020a] rounded-xl font-bold">
            Deposit
          </button>
          <button className="py-3 bg-white/10 border border-white/20 rounded-xl font-bold">
            Withdraw
          </button>
        </div>
      </div>

      <h3 className="font-bold">Recent Transactions</h3>
      <div className="space-y-2">
        {[
          { type: 'mined', amount: '+245', time: '2h ago' },
          { type: 'spent', amount: '-100', time: '5h ago' },
          { type: 'mined', amount: '+189', time: '1d ago' },
        ].map((tx, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-[#0a0a1a] rounded-xl border border-white/10"
          >
            <div>
              <p className="font-medium capitalize">{tx.type}</p>
              <p className="text-xs text-gray-400">{tx.time}</p>
            </div>
            <span className={`font-bold ${tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {tx.amount}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

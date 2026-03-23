'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWallet } from '@/hooks/use-wallet';
import { useSocket } from '@/hooks/use-socket';
import {
  Flame,
  Zap,
  Crown,
  Timer,
  TrendingUp,
  Users,
  Wallet,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

// ============================================
// CONSTANTS
// ============================================

const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const RPC_ENDPOINTS: Record<string, string> = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
};
const solanaConnection = new Connection(
  RPC_ENDPOINTS[NETWORK] || RPC_ENDPOINTS.devnet,
  'confirmed',
);
const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || '11111111111111111111111111111111';

const PHASE_META = [
  { phase: 1, icon: Zap, gradient: 'from-[#00d4ff]/20 to-[#00d4ff]/5', border: 'border-[#00d4ff]/30', glow: '#00d4ff' },
  { phase: 2, icon: Flame, gradient: 'from-[#ffd700]/20 to-[#ffd700]/5', border: 'border-[#ffd700]/30', glow: '#ffd700' },
  { phase: 3, icon: Crown, gradient: 'from-[#ff00ff]/20 to-[#ff00ff]/5', border: 'border-[#ff00ff]/30', glow: '#ff00ff' },
];

const TIER_META = [
  { name: 'Spark', range: '$50 – $499', icon: Zap, color: '#00d4ff', desc: 'Early supporter badge + 5% bonus EZZI' },
  { name: 'Flame', range: '$500 – $4,999', icon: Flame, color: '#ffd700', desc: 'Exclusive NFT airdrop + 10% bonus EZZI' },
  { name: 'Genesis', range: '$5,000+', icon: Crown, color: '#ff00ff', desc: 'Founding legend status + 20% bonus + governance' },
];

// ============================================
// TYPES
// ============================================

interface PresalePhase {
  phase: number;
  price: number;
  maxTokens: number;
  label: string;
  tokensSold: number;
  usdRaised: number;
  buyers: number;
  soldOut: boolean;
  percentFilled: number;
}

interface PresaleData {
  active: boolean;
  currentPhase: number;
  phases: PresalePhase[];
  raised: number;
  target: number;
  endDate: string | null;
  solPriceUsd: number;
  burnedTokens: number;
  totalTokensSold: number;
  totalUsdRaised: number;
  totalBuyers: number;
}

interface LeaderboardEntry {
  wallet: string;
  totalUsd: number;
  totalEzzi: number;
  purchases: number;
  tier: string;
  tierColor: string;
}

interface BurnEvent {
  burnedTokens: number;
  totalRaised: number;
  buyer: string;
  ezziAmount: number;
  phase: number;
  timestamp: string;
}

// ============================================
// SUB-COMPONENTS
// ============================================

function FlipUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-1">
        {display.split('').map((digit, idx) => (
          <div
            key={`${label}-pos-${idx}`}
            className="relative w-10 h-14 sm:w-14 sm:h-20 rounded-lg border border-white/10 overflow-hidden"
            style={{ perspective: '300px', background: 'linear-gradient(180deg, #0d0d1a 0%, #06060f 100%)' }}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`${label}-${idx}-${digit}`}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 flex items-center justify-center text-xl sm:text-3xl font-bold text-[#00d4ff]"
                style={{
                  backfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d',
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {digit}
              </motion.span>
            </AnimatePresence>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 z-10" />
          </div>
        ))}
      </div>
      <span
        className="text-[10px] text-gray-500 mt-2 uppercase tracking-[0.2em]"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {label}
      </span>
    </div>
  );
}

function FlipCountdown({ targetDate }: { targetDate: string | null }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!targetDate) return undefined;
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff / 3_600_000) % 24),
        m: Math.floor((diff / 60_000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!targetDate) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold uppercase tracking-widest text-[#00d4ff]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          Presale Active — No Deadline
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      <FlipUnit value={time.d} label="Days" />
      <span className="text-xl sm:text-2xl text-[#00d4ff]/40 font-bold -mt-5">:</span>
      <FlipUnit value={time.h} label="Hours" />
      <span className="text-xl sm:text-2xl text-[#00d4ff]/40 font-bold -mt-5">:</span>
      <FlipUnit value={time.m} label="Mins" />
      <span className="text-xl sm:text-2xl text-[#00d4ff]/40 font-bold -mt-5">:</span>
      <FlipUnit value={time.s} label="Secs" />
    </div>
  );
}

function AnimatedNumber({ value, prefix, suffix }: { value: number; prefix?: string; suffix?: string }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 50, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    motionVal.set(value);
  }, [motionVal, value]);

  useEffect(() => {
    const unsub = spring.on('change', (v: number) => setDisplay(Math.floor(v)));
    return unsub;
  }, [spring]);

  return (
    <span style={{ fontFamily: "'Space Mono', monospace" }}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

function PhaseCard({
  phase,
  currentPhase,
}: {
  phase: PresalePhase;
  currentPhase: number;
}) {
  const meta = PHASE_META.find((m) => m.phase === phase.phase) ?? PHASE_META[0];
  const Icon = meta.icon;
  const isActive = phase.phase === currentPhase && !phase.soldOut;
  const isPast = phase.phase < currentPhase || phase.soldOut;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: phase.phase * 0.1 }}
      className={`relative rounded-2xl border p-6 transition-all ${
        isActive
          ? `${meta.border} bg-gradient-to-b ${meta.gradient}`
          : isPast
          ? 'border-white/5 bg-[#06060f]/50 opacity-60'
          : 'border-white/10 bg-[#0a0a1a]'
      }`}
      style={isActive ? { boxShadow: `0 0 40px ${meta.glow}15, 0 0 80px ${meta.glow}08` } : undefined}
    >
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#00d4ff] text-[#02020a]">
          Active
        </div>
      )}
      {isPast && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-gray-400">
          {phase.soldOut ? 'Sold Out' : 'Completed'}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4 mt-2">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${meta.glow}20` }}>
          <Icon className="w-5 h-5" style={{ color: meta.glow }} />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Phase {phase.phase}</p>
          <p className="font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{phase.label}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold" style={{ color: meta.glow, fontFamily: "'Space Mono', monospace" }}>
          ${phase.price.toFixed(3)}
        </p>
        <p className="text-xs text-gray-500 mt-1">per EZZI</p>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{Math.floor(phase.tokensSold).toLocaleString()} sold</span>
          <span>{phase.maxTokens.toLocaleString()} max</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${phase.percentFilled}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${meta.glow}80, ${meta.glow})` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">{phase.percentFilled.toFixed(1)}% filled</p>
      </div>

      <div className="flex justify-between text-xs text-gray-400 border-t border-white/5 pt-3">
        <span>{phase.buyers} buyers</span>
        <span>${Math.floor(phase.usdRaised).toLocaleString()} raised</span>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function PresalePage() {
  const queryClient = useQueryClient();
  const { connected, publicKey, connect, isPhantomInstalled, isLoading: walletLoading } = useWallet();
  const { socket } = useSocket();

  // State
  const [usdAmount, setUsdAmount] = useState('');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [liveBurned, setLiveBurned] = useState(0);
  const [burnFeed, setBurnFeed] = useState<BurnEvent[]>([]);
  const burnInitialized = useRef(false);

  // Queries
  const { data: presale, isLoading: presaleLoading } = useQuery<PresaleData>({
    queryKey: ['presale-status'],
    queryFn: async () => {
      const res = await api.get('/presale');
      return res.data.data;
    },
    refetchInterval: 10_000,
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ['presale-leaderboard'],
    queryFn: async () => {
      const res = await api.get('/presale/leaderboard');
      return res.data.data;
    },
    refetchInterval: 30_000,
  });

  // Sync burn counter from API
  useEffect(() => {
    if (presale && !burnInitialized.current) {
      setLiveBurned(presale.burnedTokens);
      burnInitialized.current = true;
    }
  }, [presale]);

  // WebSocket burn counter
  useEffect(() => {
    if (!socket) return undefined;
    const handler = (data: BurnEvent) => {
      setLiveBurned((prev) => prev + data.burnedTokens);
      setBurnFeed((prev) => [data, ...prev].slice(0, 5));
    };
    socket.on('presale-burn', handler);
    return () => {
      socket.off('presale-burn', handler);
    };
  }, [socket]);

  // Derived values
  const numericUsd = parseFloat(usdAmount) || 0;
  const solPriceUsd = presale?.solPriceUsd ?? 100;
  const currentPhaseConfig = presale?.phases.find((p) => p.phase === presale.currentPhase);
  const pricePerEzzi = currentPhaseConfig?.price ?? 0.012;
  const solNeeded = numericUsd / solPriceUsd;
  const ezziReceived = numericUsd / pricePerEzzi;
  const raisedPercent = presale ? Math.min((presale.raised / presale.target) * 100, 100) : 0;

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (payload: { walletAddress: string; txHash: string; solAmount: number; refCode?: string }) => {
      const res = await api.post('/presale/purchase', payload);
      return res.data.data;
    },
    onSuccess: (data: { ezziAmount: number; tier: string | null }) => {
      setPurchaseSuccess(`Purchased ${Math.floor(data.ezziAmount).toLocaleString()} EZZI${data.tier ? ` — ${data.tier} Believer` : ''}`);
      setPurchaseError(null);
      setUsdAmount('');
      queryClient.invalidateQueries({ queryKey: ['presale-status'] });
      queryClient.invalidateQueries({ queryKey: ['presale-leaderboard'] });
    },
    onError: (err: Error) => {
      setPurchaseError(err.message || 'Purchase failed');
      setPurchaseSuccess(null);
    },
  });

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    if (!publicKey || !presale?.active || numericUsd <= 0) return;

    setPurchaseError(null);
    setPurchaseSuccess(null);

    try {
      const buyerPubkey = new PublicKey(publicKey);
      const treasuryPubkey = new PublicKey(TREASURY_WALLET);
      const lamports = Math.floor(solNeeded * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: buyerPubkey,
          toPubkey: treasuryPubkey,
          lamports,
        }),
      );

      const { blockhash } = await solanaConnection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = buyerPubkey;

      const phantom = window.phantom?.solana;
      if (!phantom) {
        setPurchaseError('Phantom wallet not found');
        return;
      }

      const signed = await (phantom as unknown as { signTransaction(tx: Transaction): Promise<Transaction> }).signTransaction(transaction);
      const signature = await solanaConnection.sendRawTransaction(signed.serialize());
      await solanaConnection.confirmTransaction(signature, 'confirmed');

      await purchaseMutation.mutateAsync({
        walletAddress: publicKey,
        txHash: signature,
        solAmount: solNeeded,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      if (!purchaseMutation.isError) {
        setPurchaseError(message);
      }
    }
  }, [publicKey, presale?.active, numericUsd, solNeeded, purchaseMutation]);

  // Loading state
  if (presaleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* ===== HERO ===== */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00d4ff]/8 via-[#02020a] to-[#02020a]" />
        <div className="absolute inset-0 opacity-[0.02]">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-[#00d4ff] rounded-full"
              style={{ left: `${8 + i * 8}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.4, 1] }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 mb-6"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-[#00d4ff] font-medium">
              Phase {presale?.currentPhase ?? 1} Live
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tight mb-4"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            EZZI COIN{' '}
            <span className="text-[#00d4ff]">PRESALE</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10"
          >
            Secure your EZZI before public launch. 3 phases, rising prices.
            <br className="hidden sm:block" />
            Early believers get the best rate — first come, first served.
          </motion.p>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400 uppercase tracking-widest">
                {presale?.endDate ? 'Phase ends in' : 'Time remaining'}
              </span>
            </div>
            <FlipCountdown targetDate={presale?.endDate ?? null} />
          </motion.div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="px-4 -mt-4 mb-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { label: 'Total Raised', value: presale?.totalUsdRaised ?? 0, prefix: '$', icon: TrendingUp, color: '#00d4ff' },
              { label: 'Tokens Burned', value: liveBurned, suffix: ' EZZI', icon: Flame, color: '#ff3300' },
              { label: 'Total Buyers', value: presale?.totalBuyers ?? 0, icon: Users, color: '#ffd700' },
              { label: 'Target', value: presale?.target ?? 100000, prefix: '$', icon: TrendingUp, color: '#00ff9f' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#0a0a1a] rounded-xl border border-white/5 p-4 text-center"
              >
                <stat.icon className="w-4 h-4 mx-auto mb-2" style={{ color: stat.color }} />
                <p className="text-lg md:text-xl font-bold text-white">
                  <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Progress bar */}
          <div className="mt-4 bg-[#0a0a1a] rounded-xl border border-white/5 p-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>${Math.floor(presale?.raised ?? 0).toLocaleString()} raised</span>
              <span>{raisedPercent.toFixed(1)}%</span>
              <span>${Math.floor(presale?.target ?? 100000).toLocaleString()} target</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${raisedPercent}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] via-[#ffd700] to-[#ff00ff]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== PHASE CARDS ===== */}
      <section className="px-4 mb-16">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold uppercase tracking-tight text-center mb-8"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            Presale <span className="text-[#00d4ff]">Phases</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(presale?.phases ?? []).map((phase) => (
              <PhaseCard key={phase.phase} phase={phase} currentPhase={presale?.currentPhase ?? 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== BUY SECTION ===== */}
      <section className="px-4 mb-16">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#00d4ff]/20 bg-gradient-to-b from-[#00d4ff]/5 to-transparent p-6 md:p-8"
            style={{ boxShadow: '0 0 60px rgba(0,212,255,0.06)' }}
          >
            <h3
              className="text-2xl font-bold uppercase text-center mb-6"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              Buy <span className="text-[#00d4ff]">EZZI</span>
            </h3>

            {/* Amount input */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="100"
                  value={usdAmount}
                  onChange={(e) => {
                    setUsdAmount(e.target.value);
                    setPurchaseError(null);
                    setPurchaseSuccess(null);
                  }}
                  className="w-full pl-8 pr-4 py-3 bg-[#06060f] border border-white/10 rounded-lg text-white text-lg focus:border-[#00d4ff]/50 focus:outline-none transition-colors"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 mb-6">
              {['50', '100', '500', '1000', '5000'].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setUsdAmount(amt);
                    setPurchaseError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    usdAmount === amt
                      ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30'
                      : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Calculation preview */}
            {numericUsd > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#06060f] rounded-lg border border-white/5 p-4 mb-6 space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">You pay</span>
                  <span className="text-white font-bold" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {solNeeded.toFixed(4)} SOL
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price per EZZI</span>
                  <span className="text-white" style={{ fontFamily: "'Space Mono', monospace" }}>
                    ${pricePerEzzi.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                  <span className="text-gray-400">You receive</span>
                  <span className="text-[#00d4ff] font-bold text-lg" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {Math.floor(ezziReceived).toLocaleString()} EZZI
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">SOL price</span>
                  <span className="text-gray-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                    ${solPriceUsd.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Error / Success */}
            <AnimatePresence mode="wait">
              {purchaseError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{purchaseError}</p>
                </motion.div>
              )}
              {purchaseSuccess && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                >
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                  <p className="text-sm text-green-400">{purchaseSuccess}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buy button */}
            {!connected ? (
              <button
                onClick={connect}
                disabled={walletLoading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-bold text-lg uppercase tracking-wide bg-[#00d4ff] text-[#02020a] hover:bg-[#33e0ff] disabled:opacity-50 transition-colors"
              >
                <Wallet className="w-5 h-5" />
                {walletLoading ? 'Connecting...' : isPhantomInstalled ? 'Connect Wallet' : 'Install Phantom'}
              </button>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={purchaseMutation.isPending || numericUsd <= 0 || !presale?.active}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-bold text-lg uppercase tracking-wide bg-gradient-to-r from-[#00d4ff] to-[#00d4ff]/80 text-[#02020a] hover:from-[#33e0ff] hover:to-[#00d4ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {purchaseMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : !presale?.active ? (
                  'Presale Inactive'
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Buy with Phantom
                  </>
                )}
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ===== BURN COUNTER ===== */}
      <section className="px-4 mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-red-500/10 bg-gradient-to-b from-red-500/5 to-transparent p-8"
          >
            <Flame className="w-10 h-10 text-red-500 mx-auto mb-4 animate-pulse" />
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Deflationary Burn Counter</p>
            <p className="text-4xl md:text-5xl font-bold text-red-400">
              <AnimatedNumber value={liveBurned} suffix=" EZZI" />
            </p>
            <p className="text-sm text-gray-500 mt-2">
              2% of every purchase is permanently burned
            </p>

            {/* Live burn feed */}
            {burnFeed.length > 0 && (
              <div className="mt-6 space-y-2">
                <AnimatePresence mode="popLayout">
                  {burnFeed.map((evt, idx) => (
                    <motion.div
                      key={`${evt.timestamp}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-center gap-2 text-xs text-gray-400"
                    >
                      <Flame className="w-3 h-3 text-red-400" />
                      <span>{evt.buyer} burned {Math.floor(evt.burnedTokens).toLocaleString()} EZZI</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ===== BELIEVER TIERS ===== */}
      <section className="px-4 mb-16">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold uppercase tracking-tight text-center mb-3"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            Believer <span className="text-[#ffd700]">Tiers</span>
          </h2>
          <p className="text-gray-400 text-center mb-8 max-w-lg mx-auto">
            The more you commit, the higher your tier. Earn exclusive perks and bonuses.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIER_META.map((tier, idx) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative rounded-2xl border border-white/10 bg-[#0a0a1a] p-6 text-center hover:border-opacity-50 transition-all group"
                  style={{ ['--tier-color' as string]: tier.color }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-shadow group-hover:shadow-lg"
                    style={{ background: `${tier.color}15`, boxShadow: `0 0 30px ${tier.color}10` }}
                  >
                    <Icon className="w-8 h-8" style={{ color: tier.color }} />
                  </div>
                  <h3
                    className="text-2xl font-bold uppercase mb-1"
                    style={{ fontFamily: "'Rajdhani', sans-serif", color: tier.color }}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className="text-sm text-gray-400 mb-4"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {tier.range}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">{tier.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== LEADERBOARD ===== */}
      <section className="px-4 mb-16">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-3xl font-bold uppercase tracking-tight text-center mb-8"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            Top <span className="text-[#00d4ff]">Believers</span>
          </h2>

          <div className="rounded-2xl border border-white/10 bg-[#0a0a1a] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-white/5 text-xs text-gray-500 uppercase tracking-wider">
              <span>Wallet</span>
              <span className="text-center">Tier</span>
              <span className="text-right">EZZI</span>
              <span className="text-right">USD</span>
            </div>

            {/* Rows */}
            {(leaderboard ?? []).length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                No purchases yet — be the first believer.
              </div>
            )}
            {(leaderboard ?? []).slice(0, 10).map((entry, idx) => (
              <motion.div
                key={entry.wallet}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-4 gap-4 px-6 py-3 border-t border-white/5 hover:bg-white/[0.02] transition-colors items-center"
              >
                <span className="text-sm text-gray-300" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {idx < 3 ? ['1st', '2nd', '3rd'][idx] : `${idx + 1}th`}{' '}
                  {entry.wallet}
                </span>
                <span className="text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{ background: `${entry.tierColor}20`, color: entry.tierColor }}
                  >
                    {entry.tier}
                  </span>
                </span>
                <span
                  className="text-right text-sm text-white"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {Math.floor(entry.totalEzzi).toLocaleString()}
                </span>
                <span
                  className="text-right text-sm text-gray-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  ${Math.floor(entry.totalUsd).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

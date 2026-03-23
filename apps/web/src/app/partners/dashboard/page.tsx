'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Wallet,
  TrendingUp,
  MousePointerClick,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Commission {
  id: string;
  orderId: string;
  orderType: string;
  orderAmount: string;
  ezziAmount: string;
  ratePercent: string;
  status: string;
  lockedUntil: Date;
  paidAt: Date | null;
  createdAt: Date;
}

interface Withdrawal {
  id: string;
  walletAddress: string;
  ezziAmount: string;
  method: string;
  status: string;
  requestedAt: Date;
  processedAt: Date | null;
}

interface DashboardData {
  application: {
    id: string;
    type: string;
    status: string;
    refCode: string;
    email: string | null;
    walletAddress: string;
  };
  partner: {
    id: string;
    tier: string | null;
    totalSales: number;
    totalEarned: string;
    pendingEarned: string;
    totalClicks: number;
    isActive: boolean;
    commissions: Commission[];
    withdrawals: Withdrawal[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
  PAID: 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20',
  FRAUD: 'bg-red-500/10 text-red-400 border-red-500/20',
  REQUESTED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function formatEzzi(val: string): string {
  return parseFloat(val).toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function formatDate(val: Date | string): string {
  return new Date(val).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PartnerDashboardPage() {
  const [refCodeInput, setRefCodeInput] = useState('');
  const [refCode, setRefCode] = useState('');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [copied, setCopied] = useState(false);

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawWallet, setWithdrawWallet] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  const loadDashboard = useCallback(async (code: string) => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await api.get<{ success: boolean; data: DashboardData }>(
        `/partners/dashboard?refCode=${encodeURIComponent(code)}`
      );
      setDashboard(res.data.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to load dashboard. Check your ref code.';
      setFetchError(msg);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load if refCode is in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get('ref');
    if (urlRef) {
      setRefCodeInput(urlRef);
      setRefCode(urlRef);
      loadDashboard(urlRef);
    }
  }, [loadDashboard]);

  function handleRefCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = refCodeInput.trim();
    if (!code) return;
    setRefCode(code);
    loadDashboard(code);
  }

  async function handleWithdraw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');
    setWithdrawLoading(true);

    try {
      await api.post('/partners/withdraw', {
        refCode,
        walletAddress: withdrawWallet,
        ezziAmount: parseFloat(withdrawAmount),
      });
      setWithdrawSuccess('Withdrawal request submitted. Processing within 3-5 business days.');
      setWithdrawAmount('');
      loadDashboard(refCode);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Withdrawal failed. Please try again.';
      setWithdrawError(msg);
    } finally {
      setWithdrawLoading(false);
    }
  }

  function copyRefLink() {
    if (!dashboard) return;
    const link = `${window.location.origin}?ref=${dashboard.application.refCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const refLink =
    typeof window !== 'undefined' && dashboard
      ? `${window.location.origin}?ref=${dashboard.application.refCode}`
      : '';

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-[#00d4ff]" />
            <h1 className="text-4xl md:text-5xl font-bold font-['Rajdhani'] uppercase">
              Partner Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Track your commissions, referral clicks, and earnings.
          </p>
        </motion.div>

        {/* Ref code entry */}
        {!dashboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-lg mx-auto"
          >
            <div className="bg-[#0a0a1a] border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold font-['Rajdhani'] uppercase mb-6">
                Enter Your Referral Code
              </h2>
              <form onSubmit={handleRefCodeSubmit} className="space-y-4">
                <input
                  type="text"
                  value={refCodeInput}
                  onChange={(e) => setRefCodeInput(e.target.value)}
                  placeholder="Your referral code (e.g. cm4abc...)"
                  required
                  className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm font-['Space_Mono'] focus:outline-none focus:border-[#00d4ff]/60 transition-colors"
                />
                {fetchError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {fetchError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#00d4ff] text-[#02020a] font-bold rounded-xl hover:bg-[#33e0ff] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Loading...' : 'Access Dashboard'}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Don&apos;t have a code?{' '}
                <a href="/partners" className="text-[#00d4ff] hover:underline">
                  Apply to become a partner
                </a>
              </p>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {loading && dashboard === null && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
          </div>
        )}

        {/* Dashboard content */}
        <AnimatePresence>
          {dashboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Partner info bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0a0a1a] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#00d4ff]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{dashboard.application.type}</p>
                    <p className="font-bold font-['Rajdhani'] uppercase">
                      {dashboard.partner.tier ?? 'STARTER'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      dashboard.application.status === 'APPROVED'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : dashboard.application.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {dashboard.application.status}
                  </span>
                  <button
                    onClick={() => {
                      setDashboard(null);
                      setRefCode('');
                      setRefCodeInput('');
                    }}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    Switch account
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: BarChart3,
                    label: 'Total Sales',
                    value: dashboard.partner.totalSales.toString(),
                    color: 'text-[#00d4ff]',
                  },
                  {
                    icon: TrendingUp,
                    label: 'Total Earned',
                    value: `${formatEzzi(dashboard.partner.totalEarned)} EZZI`,
                    color: 'text-[#ffd700]',
                  },
                  {
                    icon: Wallet,
                    label: 'Pending Payout',
                    value: `${formatEzzi(dashboard.partner.pendingEarned)} EZZI`,
                    color: 'text-green-400',
                  },
                  {
                    icon: MousePointerClick,
                    label: 'Total Clicks',
                    value: dashboard.partner.totalClicks.toLocaleString(),
                    color: 'text-purple-400',
                  },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div
                    key={label}
                    className="bg-[#0a0a1a] border border-white/10 rounded-2xl p-6"
                  >
                    <Icon className={`w-6 h-6 ${color} mb-4`} />
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                      {label}
                    </p>
                    <p className={`text-2xl font-bold font-['Space_Mono'] ${color}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Referral link */}
              <div className="bg-[#0a0a1a] border border-[#00d4ff]/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold font-['Rajdhani'] uppercase mb-4">
                  Your Referral Link
                </h3>
                <div className="flex items-center gap-3 bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3">
                  <span className="flex-1 text-sm text-gray-300 font-['Space_Mono'] break-all">
                    {refLink}
                  </span>
                  <button
                    onClick={copyRefLink}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-lg text-[#00d4ff] text-sm hover:bg-[#00d4ff]/20 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Share this link on social media or your website. You earn 10% on every
                  qualified purchase made within 30 days of the click.
                </p>
              </div>

              {/* Commissions table */}
              <div className="bg-[#0a0a1a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-lg font-bold font-['Rajdhani'] uppercase">
                    Recent Commissions
                  </h3>
                </div>
                {dashboard.partner.commissions.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Clock className="w-10 h-10 mx-auto mb-4 opacity-40" />
                    <p>No commissions yet. Share your referral link to start earning.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                          <th className="px-6 py-3 text-left">Date</th>
                          <th className="px-6 py-3 text-left">Order Type</th>
                          <th className="px-6 py-3 text-right">Order Amt</th>
                          <th className="px-6 py-3 text-right">Commission</th>
                          <th className="px-6 py-3 text-left">Status</th>
                          <th className="px-6 py-3 text-left">Unlocks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {dashboard.partner.commissions.map((c) => (
                          <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 text-gray-300">
                              {formatDate(c.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {c.orderType.replace(/_/g, ' ')}
                            </td>
                            <td className="px-6 py-4 text-right font-['Space_Mono']">
                              {formatEzzi(c.orderAmount)}
                            </td>
                            <td className="px-6 py-4 text-right font-['Space_Mono'] text-[#ffd700]">
                              +{formatEzzi(c.ezziAmount)} EZZI
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                  STATUS_COLORS[c.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 text-xs">
                              {formatDate(c.lockedUntil)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Withdrawal section */}
              <div className="grid lg:grid-cols-2 gap-6">

                {/* Request withdrawal */}
                <div className="bg-[#0a0a1a] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold font-['Rajdhani'] uppercase mb-2">
                    Request Withdrawal
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Available:{' '}
                    <span className="text-[#ffd700] font-semibold">
                      {formatEzzi(dashboard.partner.pendingEarned)} EZZI
                    </span>
                  </p>

                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        EZZI Amount <span className="text-gray-500">(min 100)</span>
                      </label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="100"
                        required
                        min={100}
                        step="0.0001"
                        max={parseFloat(dashboard.partner.pendingEarned)}
                        className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00d4ff]/60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Payout Wallet Address
                      </label>
                      <input
                        type="text"
                        value={withdrawWallet}
                        onChange={(e) => setWithdrawWallet(e.target.value)}
                        placeholder={dashboard.application.walletAddress}
                        required
                        minLength={32}
                        maxLength={44}
                        className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm font-['Space_Mono'] focus:outline-none focus:border-[#00d4ff]/60 transition-colors"
                      />
                    </div>

                    {withdrawError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {withdrawError}
                      </div>
                    )}
                    {withdrawSuccess && (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {withdrawSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        withdrawLoading ||
                        parseFloat(dashboard.partner.pendingEarned) < 100
                      }
                      className="w-full py-3 bg-[#ffd700] text-[#02020a] font-bold rounded-xl hover:bg-[#ffe033] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {withdrawLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                      {withdrawLoading ? 'Processing...' : 'Request Payout'}
                    </button>
                  </form>
                </div>

                {/* Withdrawal history */}
                <div className="bg-[#0a0a1a] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <h3 className="text-lg font-bold font-['Rajdhani'] uppercase">
                      Payout History
                    </h3>
                  </div>
                  {dashboard.partner.withdrawals.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                      <Wallet className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No payouts yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {dashboard.partner.withdrawals.map((w) => (
                        <div
                          key={w.id}
                          className="px-6 py-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-['Space_Mono'] text-[#ffd700] font-semibold">
                              {formatEzzi(w.ezziAmount)} EZZI
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(w.requestedAt)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              STATUS_COLORS[w.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

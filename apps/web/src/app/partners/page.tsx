'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Star, ChevronRight, CheckCircle, AlertCircle, Loader2, Copy } from 'lucide-react';
import { api } from '@/lib/api';

type PartnerType = 'INFLUENCER' | 'AFFILIATE';
type InfluencerTier = 'NANO' | 'MICRO' | 'MID' | 'MACRO';
type Step = 'choose' | 'form' | 'success';

interface ApplicationResult {
  id: string;
  type: PartnerType;
  status: string;
  refCode: string;
  createdAt: string;
}

const NICHES = ['Gaming', 'Crypto', 'NFT', 'DeFi', 'Web3', 'Trading', 'Tech', 'Finance'];

const TIER_GUIDE: { tier: InfluencerTier; label: string; range: string }[] = [
  { tier: 'NANO', label: 'Nano', range: '1K – 10K followers' },
  { tier: 'MICRO', label: 'Micro', range: '10K – 100K followers' },
  { tier: 'MID', label: 'Mid-Tier', range: '100K – 500K followers' },
  { tier: 'MACRO', label: 'Macro', range: '500K+ followers' },
];

export default function PartnersPage() {
  const [step, setStep] = useState<Step>('choose');
  const [partnerType, setPartnerType] = useState<PartnerType>('INFLUENCER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [followersCount, setFollowersCount] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [language, setLanguage] = useState('English');
  const [bestTweetUrl, setBestTweetUrl] = useState('');
  const [whyApply, setWhyApply] = useState('');
  const [estimatedTier, setEstimatedTier] = useState<InfluencerTier>('NANO');
  const [promoteChannel, setPromoteChannel] = useState('');

  function toggleNiche(niche: string) {
    setSelectedNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  }

  function copyRefCode() {
    if (!result) return;
    navigator.clipboard.writeText(result.refCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const basePayload = {
        email: email || undefined,
        walletAddress,
        type: partnerType,
      };

      const payload =
        partnerType === 'INFLUENCER'
          ? {
              ...basePayload,
              twitterHandle,
              followersCount: parseInt(followersCount, 10),
              niches: selectedNiches,
              language,
              bestTweetUrl: bestTweetUrl || undefined,
              whyApply: whyApply || undefined,
              estimatedTier,
            }
          : {
              ...basePayload,
              promoteChannel: promoteChannel || undefined,
            };

      const res = await api.post<{ success: boolean; data: ApplicationResult }>(
        '/partners/apply',
        payload
      );

      setResult(res.data.data);
      setStep('success');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to submit application. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const refLink =
    typeof window !== 'undefined' && result
      ? `${window.location.origin}?ref=${result.refCode}`
      : '';

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Partner Program
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-['Rajdhani'] uppercase mb-4">
            Earn With <span className="text-[#00d4ff]">EZZI</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Join as an Influencer or Affiliate and earn{' '}
            <span className="text-[#ffd700] font-semibold">10% commission</span> on every
            sale you drive. Get paid in EZZI tokens.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-16"
        >
          {[
            { icon: TrendingUp, label: '10% Commission', sub: 'On every referred sale' },
            { icon: Users, label: '30-Day Cookie', sub: 'Long attribution window' },
            { icon: Star, label: 'EZZI Rewards', sub: 'Paid in EZZI tokens' },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="bg-[#0a0a1a] border border-white/10 rounded-2xl p-6 text-center"
            >
              <Icon className="w-8 h-8 text-[#00d4ff] mx-auto mb-3" />
              <p className="font-bold font-['Rajdhani'] text-lg uppercase">{label}</p>
              <p className="text-gray-400 text-sm mt-1">{sub}</p>
            </div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* Step 1: Choose type */}
          {step === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl font-bold font-['Rajdhani'] uppercase text-center mb-8">
                Choose Your Partner Type
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                {/* Influencer card */}
                <button
                  onClick={() => {
                    setPartnerType('INFLUENCER');
                    setStep('form');
                  }}
                  className="group bg-[#0a0a1a] border-2 border-white/10 hover:border-[#00d4ff]/60 rounded-2xl p-8 text-left transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center mb-6 group-hover:bg-[#00d4ff]/20 transition-colors">
                    <TrendingUp className="w-7 h-7 text-[#00d4ff]" />
                  </div>
                  <h3 className="text-2xl font-bold font-['Rajdhani'] uppercase mb-2">
                    Influencer
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Content creators with a social media following. Promote EZZI and earn on
                    every conversion.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#00d4ff] shrink-0" />
                      Twitter / YouTube / TikTok support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#00d4ff] shrink-0" />
                      Tiered bonuses (NANO → MACRO)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#00d4ff] shrink-0" />
                      Campaign collaboration access
                    </li>
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-[#00d4ff] font-semibold text-sm">
                    Apply as Influencer <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Affiliate card */}
                <button
                  onClick={() => {
                    setPartnerType('AFFILIATE');
                    setStep('form');
                  }}
                  className="group bg-[#0a0a1a] border-2 border-white/10 hover:border-[#ffd700]/60 rounded-2xl p-8 text-left transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#ffd700]/10 flex items-center justify-center mb-6 group-hover:bg-[#ffd700]/20 transition-colors">
                    <Users className="w-7 h-7 text-[#ffd700]" />
                  </div>
                  <h3 className="text-2xl font-bold font-['Rajdhani'] uppercase mb-2">
                    Affiliate
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Promote EZZI through your website, newsletter, or community. No follower
                    requirement.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#ffd700] shrink-0" />
                      Open to everyone
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#ffd700] shrink-0" />
                      Tier upgrades (STARTER → DIAMOND)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#ffd700] shrink-0" />
                      Blog, forum, Discord — any channel
                    </li>
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-[#ffd700] font-semibold text-sm">
                    Apply as Affiliate <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Application form */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => setStep('choose')}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  ← Back
                </button>
                <h2 className="text-2xl font-bold font-['Rajdhani'] uppercase">
                  {partnerType === 'INFLUENCER' ? 'Influencer' : 'Affiliate'} Application
                </h2>
              </div>

              <div className="bg-[#0a0a1a] border border-white/10 rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Common fields */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email <span className="text-gray-500">(optional)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00d4ff]/60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Solana Wallet Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="Your Solana wallet address"
                        required
                        minLength={32}
                        maxLength={44}
                        className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00d4ff]/60 transition-colors font-['Space_Mono']"
                      />
                    </div>
                  </div>

                  {/* Influencer-specific fields */}
                  {partnerType === 'INFLUENCER' && (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Twitter / X Handle <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={twitterHandle}
                            onChange={(e) => setTwitterHandle(e.target.value)}
                            placeholder="@yourhandle"
                            required
                            className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00d4ff]/60 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Total Followers <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={followersCount}
                            onChange={(e) => setFollowersCount(e.target.value)}
                            placeholder="e.g. 25000"
                            required
                            min={1}
                            className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00d4ff]/60 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Content Niches <span className="text-red-400">*</span>{' '}
                          <span className="text-gray-500">(select at least 1)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {NICHES.map((niche) => (
                            <button
                              key={niche}
                              type="button"
                              onClick={() => toggleNiche(niche)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedNiches.includes(niche)
                                  ? 'bg-[#00d4ff] text-[#02020a]'
                                  : 'bg-[#0d0d1a] border border-white/20 text-gray-300 hover:border-[#00d4ff]/40'
                              }`}
                            >
                              {niche}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Content Language
                          </label>
                          <input
                            type="text"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            placeholder="English"
                            className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00d4ff]/60 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Estimated Tier
                          </label>
                          <select
                            value={estimatedTier}
                            onChange={(e) => setEstimatedTier(e.target.value as InfluencerTier)}
                            className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00d4ff]/60 transition-colors"
                          >
                            {TIER_GUIDE.map(({ tier, label, range }) => (
                              <option key={tier} value={tier}>
                                {label} ({range})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Best Tweet / Post URL{' '}
                          <span className="text-gray-500">(optional)</span>
                        </label>
                        <input
                          type="url"
                          value={bestTweetUrl}
                          onChange={(e) => setBestTweetUrl(e.target.value)}
                          placeholder="https://twitter.com/..."
                          className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00d4ff]/60 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Why do you want to partner with EZZI?{' '}
                          <span className="text-gray-500">(optional, max 500 chars)</span>
                        </label>
                        <textarea
                          value={whyApply}
                          onChange={(e) => setWhyApply(e.target.value)}
                          maxLength={500}
                          rows={3}
                          placeholder="Tell us about your audience and why you're a great fit..."
                          className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00d4ff]/60 transition-colors resize-none"
                        />
                        <p className="text-right text-xs text-gray-500 mt-1">
                          {whyApply.length}/500
                        </p>
                      </div>
                    </>
                  )}

                  {/* Affiliate-specific fields */}
                  {partnerType === 'AFFILIATE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        How will you promote EZZI?{' '}
                        <span className="text-gray-500">(optional)</span>
                      </label>
                      <textarea
                        value={promoteChannel}
                        onChange={(e) => setPromoteChannel(e.target.value)}
                        maxLength={500}
                        rows={4}
                        placeholder="e.g. My crypto blog gets 10K monthly visitors. I plan to write reviews and add affiliate links to my Web3 resource pages..."
                        className="w-full bg-[#0d0d1a] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00d4ff]/60 transition-colors resize-none"
                      />
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#00d4ff] text-[#02020a] font-bold text-lg rounded-xl hover:bg-[#33e0ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-[#00d4ff]/10 border-2 border-[#00d4ff]/40 flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-10 h-10 text-[#00d4ff]" />
              </div>

              <h2 className="text-4xl font-bold font-['Rajdhani'] uppercase mb-4">
                Application Submitted!
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
                Your application is under review. You&apos;ll be notified once approved.
                Meanwhile, save your referral code below.
              </p>

              <div className="bg-[#0a0a1a] border border-[#00d4ff]/20 rounded-2xl p-8 max-w-lg mx-auto mb-8">
                <p className="text-sm text-gray-400 mb-3">Your Referral Code</p>
                <div className="flex items-center gap-3 bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3 mb-4">
                  <code className="flex-1 font-['Space_Mono'] text-[#ffd700] text-lg">
                    {result.refCode}
                  </code>
                  <button
                    onClick={copyRefCode}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                {copied && (
                  <p className="text-[#00d4ff] text-sm">Copied to clipboard!</p>
                )}

                {refLink && (
                  <>
                    <p className="text-sm text-gray-400 mb-3 mt-6">Your Referral Link</p>
                    <div className="bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3 text-xs text-gray-300 break-all font-['Space_Mono']">
                      {refLink}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Share this link. Anyone who clicks it and makes a purchase earns you
                      10% commission (30-day cookie window).
                    </p>
                  </>
                )}
              </div>

              <a
                href="/partners/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-xl text-[#00d4ff] font-bold hover:bg-[#00d4ff]/20 transition-colors"
              >
                Go to Partner Dashboard <ChevronRight className="w-5 h-5" />
              </a>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

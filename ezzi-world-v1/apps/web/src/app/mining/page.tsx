'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pickaxe, Zap, Clock, Coins, Loader2, Play, Square } from 'lucide-react';
import { useMiningSessions, useMiningHistory, useZones, useStartMining, useEndMining, useUserNFTs, useWallet } from '@/hooks/use-api';

const zoneColors: Record<string, string> = {
  NEON_CITY: '#00ff9f',
  DESERT_STORM: '#ff8c00',
  DEEP_OCEAN: '#0080ff',
  VOLCANO: '#ff3300',
  TUNDRA: '#a8d8ff',
  THE_VOID: '#cc00ff',
  SPECIAL: '#ffd700',
};

export const runtime = 'edge';

export default function MiningPage() {
  const [selectedZone, setSelectedZone] = useState('NEON_CITY');
  const [selectedNft, setSelectedNft] = useState<string | null>(null);

  const { data: sessions, isLoading: sessionsLoading } = useMiningSessions();
  const { data: history, isLoading: historyLoading } = useMiningHistory();
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { data: nfts, isLoading: nftsLoading } = useUserNFTs();

  const startMining = useStartMining();
  const endMining = useEndMining();
  const { connected } = useWallet();

  const handleStart = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }
    if (!selectedNft) {
      alert('Please select an NFT');
      return;
    }

    try {
      await startMining.mutateAsync({ nftId: selectedNft, zone: selectedZone });
      setSelectedNft(null);
    } catch (error) {
      alert('Failed to start mining: ' + (error as Error).message);
    }
  };

  const handleEnd = async (sessionId: string) => {
    try {
      await endMining.mutateAsync({ sessionId });
    } catch (error) {
      alert('Failed to end mining: ' + (error as Error).message);
    }
  };

  const availableNfts = nfts?.filter((nft: any) => !nft.isStaked && nft.durability > 0);

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Pickaxe className="w-8 h-8 text-[#00d4ff]" />
            <h1 className="text-4xl md:text-5xl font-bold font-['Rajdhani'] uppercase">
              Mining Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stake your NFT warriors to mine EZZI coins. Higher rarity and zones = more rewards.
          </p>
        </motion.div>

        {/* Active Mining Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Active Mining</h2>

          {sessionsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" />
            </div>
          ) : sessions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session: any) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-[#00d4ff]/10 to-[#02020a] rounded-2xl p-6 border border-[#00d4ff]/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold">{session.nft?.warrior?.displayName}</p>
                      <p className="text-sm text-gray-400">{session.zone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">Durability</span>
                      <div className="w-20 h-2 bg-white/10 rounded-full mt-1">
                        <div
                          className="h-full bg-[#00d4ff] rounded-full"
                          style={{ width: `${session.nft?.durability}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Mining Rate</p>
                      <p className="text-xl font-bold text-[#00d4ff]">
                        {(10 * session.nft?.warrior?.miningRate * ZONE_MULTIPLIERS[session.zone]).toFixed(1)} EZZI/h
                      </p>
                    </div>
                    <button
                      onClick={() => handleEnd(session.id)}
                      disabled={endMining.isPending}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg font-bold hover:bg-red-500/30 transition-colors"
                    >
                      {endMining.isPending ? 'Claiming...' : 'Claim'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-[#0a0a1a] rounded-2xl border border-white/10">
              <p className="text-gray-400">No active mining sessions. Start mining below!</p>
            </div>
          )}
        </motion.div>

        {/* Start New Mining */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Start New Mining</h2>

          {!connected ? (
            <div className="text-center py-8 bg-[#0a0a1a] rounded-2xl border border-white/10">
              <p className="text-gray-400 mb-4">Connect your wallet to start mining</p>
            </div>
          ) : nftsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" />
            </div>
          ) : availableNfts?.length === 0 ? (
            <div className="text-center py-8 bg-[#0a0a1a] rounded-2xl border border-white/10">
              <p className="text-gray-400">No available NFTs. Buy from marketplace or open capsules!</p>
            </div>
          ) : (
            <div className="bg-[#0a0a1a] rounded-2xl p-6 border border-white/10 space-y-6">
              {/* NFT Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Select NFT</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {availableNfts?.map((nft: any) => (
                    <button
                      key={nft.id}
                      onClick={() => setSelectedNft(nft.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedNft === nft.id
                          ? 'border-[#00d4ff] bg-[#00d4ff]/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <p className="font-bold text-sm truncate">{nft.warrior?.displayName}</p>
                      <p className="text-xs text-gray-400">{nft.warrior?.rarity}</p>
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Durability: {nft.durability}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Select Zone</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {zonesLoading ? (
                    <Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" />
                  ) : (
                    zones?.map((zone: any) => (
                      <button
                        key={zone.zone}
                        onClick={() => setSelectedZone(zone.zone)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedZone === zone.zone
                            ? 'border-[#00d4ff] bg-[#00d4ff]/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full mb-2"
                          style={{ backgroundColor: zone.color }}
                        />
                        <p className="font-bold text-sm">{zone.name}</p>
                        <p className="text-xs text-gray-400">{zone.multiplier}x multiplier</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={handleStart}
                disabled={!selectedNft || startMining.isPending}
                className="w-full py-4 bg-[#00d4ff] text-[#02020a] rounded-xl font-bold text-lg uppercase tracking-wide disabled:opacity-50"
              >
                {startMining.isPending ? 'Starting...' : 'Start Mining'}
              </button>
            </div>
          )}
        </motion.div>

        {/* Mining History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-6">Mining History</h2>

          {historyLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" />
            </div>
          ) : history?.length > 0 ? (
            <div className="space-y-4">
              {history.slice(0, 5).map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-[#0a0a1a] rounded-xl border border-white/10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-[#0d0d1a] flex items-center justify-center">
                      <span className="text-xl">🎮</span>
                    </div>
                    <div>
                      <p className="font-bold">{session.nft?.warrior?.displayName}</p>
                      <p className="text-sm text-gray-400">{session.zone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{new Date(session.startedAt).toLocaleDateString()}</p>
                    <p className="font-bold text-[#00d4ff]">+{session.earnedAmount} EZZI</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-[#0a0a1a] rounded-2xl border border-white/10">
              <p className="text-gray-400">No mining history yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Zone multipliers
const ZONE_MULTIPLIERS: Record<string, number> = {
  NEON_CITY: 1.0,
  DESERT_STORM: 1.2,
  DEEP_OCEAN: 1.4,
  VOLCANO: 1.6,
  TUNDRA: 1.8,
  THE_VOID: 2.0,
  SPECIAL: 2.5,
};

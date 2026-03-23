'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Box, Hexagon, Circle, Star, Loader2, X } from 'lucide-react';
import { useCapsuleTiers, useOpenCapsule, useWallet } from '@/hooks/use-api';

const iconMap = {
  Box,
  Zap,
  Hexagon,
  Circle,
  Star,
};

const colorMap: Record<string, string> = {
  CORE: '#00d4ff',
  SURGE: '#ff8c00',
  VOID: '#cc00ff',
  CELESTIAL: '#ffd700',
  GENESIS: '#ff0040',
};

export const runtime = 'edge';

export default function CapsulesPage() {
  const [selectedCapsule, setSelectedCapsule] = useState<any>(null);
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: capsules, isLoading } = useCapsuleTiers();
  const openCapsule = useOpenCapsule();
  const { connected } = useWallet();

  const handleOpen = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!selectedCapsule) return;

    setOpening(true);

    // Simulate opening animation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const data = await openCapsule.mutateAsync(selectedCapsule.id);
      setResult(data);
      setOpening(false);
    } catch (error) {
      alert('Failed to open capsule: ' + (error as Error).message);
      setOpening(false);
    }
  };

  const closeModal = () => {
    setSelectedCapsule(null);
    setResult(null);
    setOpening(false);
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-['Rajdhani'] uppercase">
            <span className="text-[#ffd700]">23,000</span> Capsules
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Open capsules to discover warriors and EZZI coins.
            Higher tiers mean better odds.
          </p>
        </motion.div>

        {/* Capsules Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {capsules?.map((capsule: any, index: number) => (
              <motion.div
                key={capsule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  onClick={() => setSelectedCapsule(capsule)}
                  className={`group relative bg-[#0a0a1a] rounded-2xl p-6 border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    capsule.name === 'SURGE' ? 'border-[#ff8c00]/50' : 'border-white/10'
                  } ${capsule.name === 'GENESIS' ? 'border-[#ff0040]/50' : ''}`}
                >
                  {/* Badges */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {capsule.name === 'SURGE' && (
                      <span className="px-3 py-1 bg-[#ff8c00] text-[#02020a] text-xs font-bold rounded-full">
                        MOST POPULAR
                      </span>
                    )}
                    {capsule.name === 'GENESIS' && (
                      <span className="px-3 py-1 bg-[#ff0040] text-white text-xs font-bold rounded-full">
                        RAREST
                      </span>
                    )}
                  </div>

                  {/* Visual */}
                  <div className="relative aspect-square flex items-center justify-center mb-6 mt-4">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div
                        className="w-32 h-32 rounded-full border-2 opacity-30"
                        style={{ borderColor: colorMap[capsule.name] || '#00d4ff' }}
                      />
                    </motion.div>

                    <div
                      className="w-16 h-16 relative z-10"
                      style={{ color: colorMap[capsule.name] || '#00d4ff' }}
                    >
                      {capsule.name === 'CORE' && <Box className="w-16 h-16" />}
                      {capsule.name === 'SURGE' && <Zap className="w-16 h-16" />}
                      {capsule.name === 'VOID' && <Hexagon className="w-16 h-16" />}
                      {capsule.name === 'CELESTIAL' && <Circle className="w-16 h-16" />}
                      {capsule.name === 'GENESIS' && <Star className="w-16 h-16" />}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <h3
                      className="text-xl font-bold mb-1"
                      style={{ color: colorMap[capsule.name] || '#00d4ff' }}
                    >
                      {capsule.displayName}
                    </h3>
                    <p className="text-3xl font-bold font-['Space_Mono'] mb-1">
                      ${capsule.price}
                    </p>
                    <p className="text-sm text-gray-400 mb-2">
                      {capsule.remaining.toLocaleString()} / {capsule.totalSupply.toLocaleString()} left
                    </p>

                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(capsule.remaining / capsule.totalSupply) * 100}%`,
                          backgroundColor: colorMap[capsule.name] || '#00d4ff',
                        }}
                      />
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2">{capsule.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {selectedCapsule && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0a0a1a] rounded-2xl p-8 max-w-md w-full border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                {!result ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Open Capsule</h2>
                      <button onClick={closeModal}>
                        <X className="w-6 h-6 text-gray-400 hover:text-white" />
                      </button>
                    </div>

                    <div className="text-center py-8">
                      <div
                        className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${colorMap[selectedCapsule.name]}20`,
                          border: `2px solid ${colorMap[selectedCapsule.name]}`,
                        }}
                      >
                        {opening ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Loader2 className="w-12 h-12" style={{ color: colorMap[selectedCapsule.name] }} />
                          </motion.div>
                        ) : (
                          <span className="text-4xl">📦</span>
                        )}
                      </div>

                      <p className="text-xl font-bold mb-2">{selectedCapsule.displayName}</p>
                      <p className="text-gray-400 mb-6">{opening ? 'Opening...' : `${selectedCapsule.price} SOL`}</p>

                      {!opening && (
                        <button
                          onClick={handleOpen}
                          disabled={openCapsule.isPending}
                          className="w-full py-4 rounded-xl font-bold text-lg"
                          style={{
                            backgroundColor: colorMap[selectedCapsule.name],
                            color: '#02020a',
                          }}
                        >
                          {openCapsule.isPending ? 'Opening...' : 'Open Capsule'}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center py-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-6xl mb-4"
                      >
                        {result.resultType === 'nft' ? '🎉' : '💰'}
                      </motion.div>

                      <h2 className="text-2xl font-bold mb-2">
                        {result.resultType === 'nft' ? 'You got an NFT!' : 'EZZI Coins!'}
                      </h2>

                      {result.resultType === 'nft' && result.rarity && (
                        <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                          result.rarity === 'mythic' ? 'bg-pink-500/20 text-pink-300' :
                          result.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-300' :
                          result.rarity === 'epic' ? 'bg-purple-500/20 text-purple-300' :
                          result.rarity === 'rare' ? 'bg-cyan-500/20 text-cyan-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {result.rarity.toUpperCase()}
                        </div>
                      )}

                      {result.resultType === 'ezzi' && (
                        <p className="text-4xl font-bold text-[#00d4ff] mb-4">
                          +{result.amount?.toLocaleString()} EZZI
                        </p>
                      )}

                      <button
                        onClick={closeModal}
                        className="mt-6 px-8 py-3 bg-[#00d4ff] text-[#02020a] rounded-xl font-bold"
                      >
                        Awesome!
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOpenCapsule } from '@/hooks/use-api';
import { audio } from '@/lib/audio';

const PHASES = {
  DISPLAY: 0,
  ACTIVATION: 1,
  FRACTURE: 2,
  REVEAL: 3,
  RESULT: 4,
};

const rarityConfig: Record<string, {
  color: string;
  glow: string;
  sound: number[];
  shake: number;
}> = {
  common: { color: '#8a9bb0', glow: 'rgba(138, 155, 176, 0.5)', sound: [440], shake: 0 },
  rare: { color: '#4d9fff', glow: 'rgba(77, 159, 255, 0.7)', sound: [440, 554], shake: 100 },
  epic: { color: '#b44dff', glow: 'rgba(180, 77, 255, 0.8)', sound: [440, 554, 659], shake: 200 },
  legendary: { color: '#ffd700', glow: 'rgba(255, 215, 0, 0.9)', sound: [440, 554, 659, 880], shake: 300 },
  mythic: { color: '#ff00ff', glow: 'rgba(255, 0, 255, 1)', sound: [440, 554, 659, 880, 1100], shake: 500 },
};

interface CapsuleOpeningProps {
  capsuleId: string;
  capsuleName: string;
  onComplete: (result: any) => void;
  onClose: () => void;
}

export function CapsuleOpening({ capsuleId, capsuleName, onComplete, onClose }: CapsuleOpeningProps) {
  const [phase, setPhase] = useState(PHASES.DISPLAY);
  const [result, setResult] = useState<any>(null);
  const [shake, setShake] = useState(0);

  const openCapsule = useOpenCapsule();

  // Phase 1: Display (2s) - Capsule floats
  useEffect(() => {
    if (phase === PHASES.DISPLAY) {
      const timer = setTimeout(() => {
        setPhase(PHASES.ACTIVATION);
        audio.playMiningStart(); // Activation sound
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Phase 2: Activation (0.8s) - Vibration
  useEffect(() => {
    if (phase === PHASES.ACTIVATION) {
      // Vibration effect
      const interval = setInterval(() => {
        setShake(Math.random() * 10 - 5);
      }, 50);

      const timer = setTimeout(() => {
        clearInterval(interval);
        setPhase(PHASES.FRACTURE);
      }, 800);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [phase]);

  // Phase 3: Fracture (0.5s) - Explosion + Open API
  useEffect(() => {
    if (phase === PHASES.FRACTURE) {
      // Screen flash
      document.body.style.backgroundColor = '#ffffff';
      setTimeout(() => {
        document.body.style.backgroundColor = '';
      }, 100);

      // Call API
      openCapsule.mutateAsync(capsuleId).then((data) => {
        setResult(data);
        setPhase(PHASES.REVEAL);

        // Play rarity sound
        const rarity = data.rarity || 'common';
        const config = rarityConfig[rarity];

        // Play sound
        config.sound.forEach((freq, i) => {
          setTimeout(() => audio.playCapsuleOpen(rarity), i * 100);
        });

        // Screen shake for rare+
        if (config.shake > 0 && navigator.vibrate) {
          navigator.vibrate(config.shake);
        }
      });
    }
  }, [phase, capsuleId, openCapsule]);

  // Phase 4: Reveal (1.5s) - Result appears
  useEffect(() => {
    if (phase === PHASES.REVEAL && result) {
      const timer = setTimeout(() => {
        setPhase(PHASES.RESULT);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, result]);

  const handleComplete = () => {
    onComplete(result);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
        style={{ transform: `translateX(${shake}px)` }}
      >
        {/* Phase 0-2: Capsule Display */}
        {phase <= PHASES.FRACTURE && (
          <motion.div
            animate={{
              y: phase === PHASES.DISPLAY ? [0, -10, 0] : 0,
              scale: phase === PHASES.FRACTURE ? [1, 1.5, 0] : 1,
              rotate: phase === PHASES.ACTIVATION ? [0, -5, 5, -5, 5, 0] : 0,
            }}
            transition={{
              y: { duration: 2, repeat: phase === PHASES.DISPLAY ? Infinity : 0, ease: 'easeInOut' },
              scale: { duration: 0.5, ease: 'easeIn' },
              rotate: { duration: 0.8 },
            }}
            className="relative"
          >
            {/* Capsule Visual */}
            <div
              className="w-48 h-48 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(0,212,255,0.3), transparent)',
                border: '3px solid rgba(0,212,255,0.5)',
                boxShadow: '0 0 60px rgba(0,212,255,0.5), inset 0 0 60px rgba(0,212,255,0.2)',
              }}
            >
              <span className="text-6xl">📦</span>
            </div>

            {/* Energy lines */}
            {phase === PHASES.ACTIVATION && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-20 h-0.5 bg-[#00d4ff]"
                    style={{
                      top: '50%',
                      left: '50%',
                      transformOrigin: '0 0',
                      transform: `rotate(${i * 45}deg)`,
                    }}
                    animate={{
                      scaleX: [0, 2, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 0.4,
                      repeat: 2,
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Phase label */}
            <p className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-xl font-bold text-[#00d4ff]">
              {phase === PHASES.DISPLAY && 'TAP TO OPEN'}
              {phase === PHASES.ACTIVATION && 'OPENING...'}
              {phase === PHASES.FRACTURE && 'REVEALING...'}
            </p>
          </motion.div>
        )}

        {/* Phase 3-4: Result */}
        {phase >= PHASES.REVEAL && result && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-center"
          >
            {result.resultType === 'nft' ? (
              <NFTResult result={result} />
            ) : (
              <EZZIResult amount={result.amount} />
            )}

            {phase === PHASES.RESULT && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={handleComplete}
                className="mt-8 px-8 py-3 bg-[#00d4ff] text-[#02020a] rounded-xl font-bold"
              >
                Awesome!
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Close button */}
        {phase !== PHASES.FRACTURE && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white"
          >
            ✕
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function NFTResult({ result }: { result: any }) {
  const rarity = result.rarity || 'common';
  const config = rarityConfig[rarity];

  return (
    <div className="relative">
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-2xl blur-3xl"
        style={{ backgroundColor: config.color, opacity: 0.3 }}
      />

      {/* Card */}
      <div
        className="relative w-72 h-96 rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, ${config.color}20, transparent)`,
          border: `2px solid ${config.color}`,
          boxShadow: `0 0 60px ${config.glow}`,
        }}
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-8xl mb-4"
          >
            🎮
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-gray-400 mb-2">You got</p>
            <p className="text-2xl font-bold mb-2" style={{ color: config.color }}>
              {result.nft?.warrior?.displayName || 'Unknown Warrior'}
            </p>
            <span
              className="px-4 py-1 rounded-full text-sm font-bold uppercase"
              style={{
                backgroundColor: `${config.color}30`,
                color: config.color,
                border: `1px solid ${config.color}`,
              }}
            >
              {rarity}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Confetti particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: config.color,
            left: '50%',
            top: '50%',
          }}
          animate={{
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            opacity: [1, 0],
            scale: [1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: Math.random() * 0.3,
          }}
        />
      ))}
    </div>
  );
}

function EZZIResult({ amount }: { amount: number }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-8xl mb-4"
      >
        💰
      </motion.div>

      <p className="text-sm text-gray-400 mb-2">You got</p>
      <p className="text-5xl font-bold text-[#ffd700] mb-2">
        {amount?.toLocaleString()} EZZI
      </p>
      <p className="text-gray-400">coins!</p>
    </div>
  );
}

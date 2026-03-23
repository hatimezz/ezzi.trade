'use client';

import { motion } from 'framer-motion';
import { Zap, Box, Hexagon, Circle, Star } from 'lucide-react';

const capsules = [
  { name: 'CORE', price: 23, color: '#00d4ff', icon: Box, supply: 10000 },
  { name: 'SURGE', price: 45, color: '#ff8c00', icon: Zap, supply: 6000 },
  { name: 'VOID', price: 89, color: '#cc00ff', icon: Hexagon, supply: 4000 },
  { name: 'CELESTIAL', price: 149, color: '#ffd700', icon: Circle, supply: 2000 },
  { name: 'GENESIS', price: 299, color: '#ff0040', icon: Star, supply: 1000 },
];

export function CapsuleShowcase() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {capsules.map((capsule, index) => (
        <motion.div
          key={capsule.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="group relative"
        >
          <div className="relative bg-[#0a0a1a] rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
            {/* Capsule Visual */}
            <div className="relative aspect-square flex items-center justify-center mb-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div
                  className="w-24 h-24 rounded-full border-2 opacity-50"
                  style={{ borderColor: capsule.color }}
                />
              </motion.div>

              <capsule.icon
                className="w-12 h-12 relative z-10"
                style={{ color: capsule.color }}
              />
            </div>

            {/* Info */}
            <div className="text-center">
              <h3 className="font-bold text-lg mb-1" style={{ color: capsule.color }}>
                {capsule.name}
              </h3>
              <p className="text-2xl font-bold font-['Space_Mono'] mb-1">
                ${capsule.price}
              </p>
              <p className="text-sm text-gray-400">
                {capsule.supply.toLocaleString()} available
              </p>
            </div>

            {/* Hover Glow */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${capsule.color}10, transparent 70%)`,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

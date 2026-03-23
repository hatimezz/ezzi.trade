'use client';

import { motion } from 'framer-motion';
import { GENESIS_WARRIORS } from '@ezzi/shared';

const zones = [
  { id: 'NEON_CITY', name: 'Neon City', color: '#00ff9f', multiplier: 1.0 },
  { id: 'DESERT_STORM', name: 'Desert Storm', color: '#ff8c00', multiplier: 1.2 },
  { id: 'DEEP_OCEAN', name: 'Deep Ocean', color: '#0080ff', multiplier: 1.4 },
  { id: 'VOLCANO', name: 'Volcano', color: '#ff3300', multiplier: 1.6 },
  { id: 'TUNDRA', name: 'Frozen Tundra', color: '#a8d8ff', multiplier: 1.8 },
  { id: 'THE_VOID', name: 'The Void', color: '#cc00ff', multiplier: 2.0 },
];

export function Zones() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Rajdhani'] uppercase">
            6 Ancient <span className="text-[#00d4ff]">Civilizations</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Each zone offers unique mining multipliers. Warriors from matching zones get bonus earnings.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone, index) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className="group relative h-64 rounded-2xl overflow-hidden border-2 border-white/10 hover:border-white/30 transition-all cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${zone.color}10, transparent)`,
                }}
              >
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: zone.color }}>
                      {zone.name}
                    </h3>
                    <p className="text-4xl font-bold font-['Space_Mono']">
                      {zone.multiplier}x
                    </p>
                    <p className="text-sm text-gray-400">Mining Multiplier</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      {GENESIS_WARRIORS.filter(w => w.zone === zone.id).length} Warriors
                    </span>
                  </div>
                </div>

                {/* Glow Effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${zone.color}20, transparent 70%)`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

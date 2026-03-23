'use client';

import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';

const phases = [
  {
    quarter: 'Q1 2026',
    title: 'GENESIS',
    status: 'active',
    items: [
      '2,300 Genesis Warriors mint',
      '23,000 Capsules launch',
      'Mining system live',
      'Marketplace trading',
      'Telegram Mini App',
    ],
  },
  {
    quarter: 'Q2 2026',
    title: 'EXPANSION',
    status: 'upcoming',
    items: [
      'Guild Wars system',
      'Battle Arena PvP',
      'Scholarship program',
      'Mobile app launch',
      'Major exchange listings',
    ],
  },
  {
    quarter: 'Q3 2026',
    title: 'EVOLUTION',
    status: 'upcoming',
    items: [
      'AI Companion integration',
      '3D World Map',
      'Tournament system',
      'Cross-chain bridges',
      'VR/AR experiences',
    ],
  },
  {
    quarter: 'Q4 2026',
    title: 'DOMINION',
    status: 'upcoming',
    items: [
      'DAO governance',
      'New warrior generations',
      'Metaverse integration',
      'Esports tournaments',
      'Global expansion',
    ],
  },
];

export function Roadmap() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Rajdhani'] uppercase">
            Roadmap <span className="text-[#00d4ff]">2026</span>
          </h2>
          <p className="text-gray-400 text-lg">Our journey to build the ultimate Web3 gaming platform</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.quarter}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`relative h-full p-6 rounded-2xl border ${
                  phase.status === 'active'
                    ? 'bg-[#00d4ff]/10 border-[#00d4ff]/50'
                    : 'bg-[#0a0a1a] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-sm font-bold uppercase tracking-wider ${
                      phase.status === 'active' ? 'text-[#00d4ff]' : 'text-gray-500'
                    }`}
                  >
                    {phase.quarter}
                  </span>
                  {phase.status === 'active' && (
                    <span className="flex items-center space-x-1 text-xs text-green-400">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span>Live</span>
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold mb-4">{phase.title}</h3>

                <ul className="space-y-3">
                  {phase.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className={`flex items-start space-x-2 text-sm ${
                        phase.status === 'active' ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      {phase.status === 'active' ? (
                        <Check className="w-4 h-4 text-[#00d4ff] mt-0.5 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

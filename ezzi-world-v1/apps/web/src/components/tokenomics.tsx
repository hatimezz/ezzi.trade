'use client';

import { motion } from 'framer-motion';

const allocations = [
  { label: 'Mining Rewards', value: 50, color: '#00d4ff' },
  { label: 'Liquidity', value: 20, color: '#00ff9f' },
  { label: 'Team', value: 15, color: '#ffd700' },
  { label: 'Marketing', value: 10, color: '#ff8c00' },
  { label: 'Reserve', value: 5, color: '#cc00ff' },
];

const burnMechanisms = [
  'Capsule purchases burn 5% of EZZI',
  'NFT marketplace fees burn 2.5%',
  'Zone switching costs burn EZZI',
  'NFT fusion burns base warriors',
  'Premium features require EZZI burn',
  'Weekly leaderboard rewards from burn pool',
];

export function Tokenomics() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[#02020a] to-[#0a0a1a]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Rajdhani'] uppercase">
            <span className="text-[#ffd700]">$EZZI</span> Tokenomics
          </h2>
          <p className="text-gray-400 text-lg">Deflationary by design. Forever.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Token Allocation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold mb-6">Token Allocation</h3>
            {allocations.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-bold" style={{ color: item.color }}>
                    {item.value}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Burn Mechanisms */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#0d0d1a] rounded-2xl p-8 border border-white/10"
          >
            <h3 className="text-2xl font-bold mb-6">Burn Mechanisms 🔥</h3>
            <ul className="space-y-4">
              {burnMechanisms.map((mechanism, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <span className="text-[#ff3300] mt-1">🔥</span>
                  <span>{mechanism}</span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-8 p-4 bg-[#ff3300]/10 rounded-xl border border-[#ff3300]/30">
              <p className="text-sm text-gray-400">Total Supply</p>
              <p className="text-3xl font-bold font-['Space_Mono']">100,000,000 $EZZI</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

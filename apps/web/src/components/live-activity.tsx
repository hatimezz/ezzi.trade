'use client';

import { motion } from 'framer-motion';
import { Zap, ShoppingCart, Gift } from 'lucide-react';

const activities = [
  { type: 'purchase', user: '0x7a3f...k9m2', action: 'bought KRONOS (MYTHIC)', time: '2m ago', icon: ShoppingCart },
  { type: 'open', user: '0xb2e9...p4n7', action: 'pulled SOLARIS from Genesis Capsule', time: '5m ago', icon: Gift },
  { type: 'mining', user: '0x4k1j...v8s3', action: 'mined 2,450 EZZI in The Void', time: '8m ago', icon: Zap },
  { type: 'purchase', user: '0xf3a1...d5r9', action: 'bought 5 Core Capsules', time: '12m ago', icon: ShoppingCart },
  { type: 'open', user: '0x9c2b...w6t1', action: 'pulled EPIC warrior', time: '15m ago', icon: Gift },
  { type: 'mining', user: '0x8e4d...h2j5', action: 'mined 1,200 EZZI in Volcano', time: '18m ago', icon: Zap },
];

export function LiveActivity() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[#0a0a1a] to-[#02020a]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400 font-medium uppercase tracking-wider">Live</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Rajdhani'] uppercase">
            What&apos;s Happening <span className="text-[#00d4ff]">Now</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4 p-4 bg-[#0a0a1a] rounded-xl border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="p-2 rounded-lg bg-[#00d4ff]/10">
                <activity.icon className="w-5 h-5 text-[#00d4ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  <span className="text-[#00d4ff] font-medium">{activity.user}</span>
                  {' '}<span className="text-gray-400">{activity.action}</span>
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

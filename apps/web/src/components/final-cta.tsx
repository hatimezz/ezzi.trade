'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="py-32 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#02020a] via-[#00d4ff]/5 to-[#02020a]" />

      {/* Animated Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[#00d4ff]/20"
            style={{
              width: `${i * 200}px`,
              height: `${i * 200}px`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 font-['Rajdhani'] uppercase">
            Your Warrior
            <br />
            <span className="text-[#00d4ff]">Awaits</span>
          </h2>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join thousands of players building their empires in the ultimate Web3 gaming platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketplace"
              className="group flex items-center space-x-2 px-8 py-4 bg-[#00d4ff] text-[#02020a] rounded-lg font-bold text-lg uppercase tracking-wide hover:bg-[#33e0ff] transition-colors"
            >
              <span>Start Playing Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/capsules"
              className="flex items-center space-x-2 px-8 py-4 bg-transparent border-2 border-[#00d4ff]/50 text-white rounded-lg font-bold text-lg uppercase tracking-wide hover:bg-[#00d4ff]/10 transition-colors"
            >
              <Zap className="w-5 h-5" />
              <span>Open a Capsule</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

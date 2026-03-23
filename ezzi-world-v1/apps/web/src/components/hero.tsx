'use client';

import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00d4ff]/10 via-[#02020a] to-[#02020a]" />
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 text-[200px] font-bold text-white/20 whitespace-nowrap animate-marquee">
          الطاقة تعود
        </div>
      </div>

      {/* Particle Grid */}
      <div className="absolute inset-0 opacity-20">
        {<>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#00d4ff] rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 mb-8"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-[#00d4ff] font-medium">Genesis Collection Live</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold font-['Rajdhani'] uppercase tracking-tight mb-6">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="block"
            >
              ⚡ EZZI
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="block text-[#00d4ff]"
            >
              WORLD
            </motion.span>
          </h1>

          {/* Typewriter Effect */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-400 mb-4 font-['Space_Mono'] tracking-widest"
          >
            MINE · COLLECT · BATTLE · EARN · RULE · RECRUIT
          </motion.p>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto mb-12"
          >
            6 ancient civilizations. 1 deflationary token.
            <br />
            Your warriors mine EZZI COIN while you sleep.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/marketplace"
              className="group flex items-center space-x-2 px-8 py-4 bg-[#00d4ff] text-[#02020a] rounded-lg font-bold text-lg uppercase tracking-wide hover:bg-[#33e0ff] transition-colors"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/capsules"
              className="flex items-center space-x-2 px-8 py-4 bg-transparent border-2 border-[#00d4ff]/50 text-white rounded-lg font-bold text-lg uppercase tracking-wide hover:bg-[#00d4ff]/10 transition-colors"
            >
              <Zap className="w-5 h-5" />
              <span>Open Capsules</span>
            </Link>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="w-px h-20 bg-gradient-to-b from-transparent via-[#00d4ff] to-transparent" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

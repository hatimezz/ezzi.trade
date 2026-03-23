'use client';

import { motion } from 'framer-motion';
import { Wallet, UserPlus, Trophy } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Sign Up Free',
    description: 'Create an account in seconds. No wallet required to start playing.',
  },
  {
    number: '02',
    icon: Wallet,
    title: 'Claim Your Warrior',
    description: 'Buy directly from the marketplace or open a capsule for a chance at rare warriors.',
  },
  {
    number: '03',
    icon: Trophy,
    title: 'Build Your Empire',
    description: 'Mine EZZI, battle other players, and expand your collection.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Rajdhani'] uppercase">
            How It <span className="text-[#00d4ff]">Works</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Start your journey in three simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              <div className="bg-[#0a0a1a] rounded-2xl p-8 border border-white/10 hover:border-[#00d4ff]/30 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 rounded-xl bg-[#00d4ff]/10">
                    <step.icon className="w-8 h-8 text-[#00d4ff]" />
                  </div>
                  <span className="text-4xl font-bold text-white/10 font-['Rajdhani']">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-[#00d4ff]/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

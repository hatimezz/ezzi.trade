'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hero } from '@/components/hero';
import { Stats } from '@/components/stats';
import { WarriorShowcase } from '@/components/warrior-showcase';
import { CapsuleShowcase } from '@/components/capsule-showcase';
import { HowItWorks } from '@/components/how-it-works';
import { LiveActivity } from '@/components/live-activity';
import { Zones } from '@/components/zones';
import { Tokenomics } from '@/components/tokenomics';
import { Roadmap } from '@/components/roadmap';
import { Community } from '@/components/community';
import { FinalCTA } from '@/components/final-cta';

export const runtime = 'edge';

export default function HomePage() {
  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <Hero />

      {/* Stats Bar */}
      <Stats />

      {/* Warrior Showcase */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Rajdhani'] uppercase tracking-wider">
              Meet the <span className="text-[#00d4ff]">Genesis Warriors</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              8 legendary warriors, 2,300 unique NFTs. Each with unique abilities,
              stats, and lore. Collect them all.
            </p>
          </motion.div>
          <WarriorShowcase />
        </div>
      </section>

      {/* Capsule Showcase */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#02020a] to-[#0a0a1a]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Rajdhani'] uppercase tracking-wider">
              23,000 <span className="text-[#ffd700]">Capsules</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Open capsules to discover NFTs and EZZI coins. Higher tiers mean better odds
              of rare and legendary warriors.
            </p>
          </motion.div>
          <CapsuleShowcase />
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Live Activity */}
      <LiveActivity />

      {/* Zones */}
      <Zones />

      {/* Tokenomics */}
      <Tokenomics />

      {/* Roadmap */}
      <Roadmap />

      {/* Community */}
      <Community />

      {/* Final CTA */}
      <FinalCTA />
    </div>
  );
}

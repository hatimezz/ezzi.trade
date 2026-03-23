'use client';

import { motion } from 'framer-motion';
import { Users, Package, Coins, Globe } from 'lucide-react';
import { usePlatformStats } from '@/hooks/use-api';

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  suffix?: string;
  delay?: number;
}

function StatItem({ icon: Icon, label, value, suffix, delay = 0 }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className="flex items-center space-x-4 px-6 py-4"
    >
      <div className="p-3 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/20">
        <Icon className="w-6 h-6 text-[#00d4ff]" />
      </div>
      <div>
        <div className="text-2xl md:text-3xl font-bold font-['Space_Mono']">
          {value}{suffix}
        </div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </motion.div>
  );
}

export function Stats() {
  const { data: stats, isLoading } = usePlatformStats();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <section className="py-8 border-y border-white/5 bg-gradient-to-r from-[#00d4ff]/5 via-transparent to-[#00d4ff]/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem
            icon={Users}
            label="Warriors Recruited"
            value={isLoading ? '---' : (stats?.totalNfts || 0).toLocaleString()}
            delay={0}
          />
          <StatItem
            icon={Package}
            label="Capsules Opened"
            value={isLoading ? '---' : (stats?.totalCapsulesOpened || 0).toLocaleString()}
            delay={100}
          />
          <StatItem
            icon={Coins}
            label="EZZI Mined"
            value={isLoading ? '---' : formatNumber(stats?.totalEzziMined || 0)}
            suffix="+"
            delay={200}
          />
          <StatItem
            icon={Globe}
            label="Active Miners"
            value={isLoading ? '---' : (stats?.activeMiningSessions || 0).toLocaleString()}
            delay={300}
          />
        </div>
      </div>
    </section>
  );
}

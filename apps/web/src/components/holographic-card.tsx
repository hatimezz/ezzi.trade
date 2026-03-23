'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Sword, Shield, Zap, Sparkles } from 'lucide-react';

const rarityConfig: Record<string, { color: string; glow: string; border: string }> = {
  common: {
    color: '#8a9bb0',
    glow: 'rgba(138, 155, 176, 0.3)',
    border: 'rgba(138, 155, 176, 0.5)',
  },
  rare: {
    color: '#4d9fff',
    glow: 'rgba(77, 159, 255, 0.5)',
    border: 'rgba(77, 159, 255, 0.8)',
  },
  epic: {
    color: '#b44dff',
    glow: 'rgba(180, 77, 255, 0.6)',
    border: 'rgba(180, 77, 255, 0.9)',
  },
  legendary: {
    color: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.7)',
    border: 'rgba(255, 215, 0, 1)',
  },
  mythic: {
    color: '#ff00ff',
    glow: 'rgba(255, 0, 255, 0.8)',
    border: 'rgba(255, 0, 255, 1)',
  },
};

interface HolographicCardProps {
  id: string;
  name: string;
  rarity: string;
  zone: string;
  stats: {
    attack: number;
    defense: number;
    speed: number;
    magic: number;
    miningRate: number;
  };
  price?: number;
}

export function HolographicCard({
  id,
  name,
  rarity,
  zone,
  stats,
  price,
}: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const config = rarityConfig[rarity] || rarityConfig.common;

  // 2.5D Tilt Effect
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -15;
      const rotateY = ((x - centerX) / centerX) * 15;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;

      // Shine effect
      const shine = card.querySelector('.card-shine') as HTMLElement;
      if (shine) {
        shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.3) 0%, transparent 60%)`;
      }
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <Link href={`/warriors/${id}`}>
      <div
        ref={cardRef}
        className="group relative cursor-pointer transition-transform duration-300"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="relative w-[280px] h-[380px] rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${config.color}10 0%, transparent 50%), linear-gradient(225deg, ${config.color}05 0%, transparent 50%)`,
            border: `2px solid ${config.border}`,
            boxShadow: `0 0 40px ${config.glow}`,
          }}
        >
          {/* Shine Effect */}
          <div className="card-shine absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Image */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <div
              className="absolute inset-0 z-0"
              style={{
                background: `radial-gradient(circle at 50% 100%, ${config.color}30 0%, transparent 70%)`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center z-1">
              <span className="text-8xl">🎮</span>
            </div>
            <div className="absolute inset-0 z-2" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a1a] to-transparent z-3" />

            {/* Rarity Badge */}
            <div
              className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{
                background: `linear-gradient(135deg, ${config.color}40, ${config.color}20)`,
                border: `1px solid ${config.border}`,
                color: config.color,
                boxShadow: `0 0 20px ${config.glow}`,
              }}
            >
              {rarity}
            </div>
          </div>

          {/* Info */}
          <div className="absolute bottom-0 inset-x-0 p-4 z-20">
            <h3 className="font-bold text-lg mb-1 truncate" style={{ textShadow: `0 0 10px ${config.glow}` }}>
              {name}
            </h3>
            <p className="text-sm text-gray-400 mb-3">{zone}</p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <StatBar icon={Sword} value={stats.attack} label="ATK" color="#ff4444" />
              <StatBar icon={Shield} value={stats.defense} label="DEF" color="#4444ff" />
              <StatBar icon={Zap} value={stats.speed} label="SPD" color="#ffff44" />
              <StatBar icon={Sparkles} value={stats.magic} label="MGK" color="#ff44ff" />
            </div>

            {price ? (
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-sm text-gray-400">Price</span>
                <span className="font-bold text-xl" style={{ color: config.color }}>${price}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-sm text-gray-400">Mining Rate</span>
                <span className="font-bold text-[#00d4ff]">{stats.miningRate}x</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

import { LucideIcon } from 'lucide-react';

function StatBar({ icon: Icon, value, label, color }: { icon: LucideIcon; value: number; label: string; color: string }) {
  return (
    <div className="flex items-center space-x-1 text-xs">
      <Icon className="w-3 h-3" style={{ color }} />
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="text-gray-400">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / 100) * 100}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}

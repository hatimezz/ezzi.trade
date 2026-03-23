'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  Shield,
  Swords,
  Gem,
  Pickaxe,
  Users,
  Globe,
  Flame,
  Clock,
  ChevronRight,
  Rocket,
  Star,
  Crown,
  TrendingUp,
  ShoppingCart,
  Gift,
} from 'lucide-react';

/* ============================================================
   DATA
   ============================================================ */

const HERO_LETTERS = 'EZZI WORLD'.split('');

const FEATURES = [
  {
    icon: Pickaxe,
    title: 'Auto-Mining',
    desc: 'Warriors mine EZZI coin 24/7 — even while you sleep.',
    span: 'col-span-1 row-span-1',
    accent: '#00d4ff',
  },
  {
    icon: Swords,
    title: 'PvP Battles',
    desc: 'Stake warriors in real-time arena fights for EZZI rewards.',
    span: 'col-span-1 row-span-2',
    accent: '#ff3300',
  },
  {
    icon: Gem,
    title: '23,000 Capsules',
    desc: 'Open capsules to discover NFTs and coins. Higher tiers = rarer pulls.',
    span: 'col-span-1 row-span-1',
    accent: '#ffd700',
  },
  {
    icon: Shield,
    title: '2,300 Genesis Warriors',
    desc: '8 legendary warriors across 6 civilizations. Every one unique.',
    span: 'col-span-2 row-span-1',
    accent: '#cc00ff',
  },
  {
    icon: TrendingUp,
    title: 'Deflationary $EZZI',
    desc: 'Burns on every transaction. Supply shrinks, value grows.',
    span: 'col-span-1 row-span-1',
    accent: '#00ff9f',
  },
  {
    icon: Users,
    title: 'Guild Wars',
    desc: 'Form guilds, conquer zones, share mining multipliers.',
    span: 'col-span-1 row-span-1',
    accent: '#0080ff',
  },
];

const ZONES = [
  {
    id: 'neon',
    name: 'Neon City',
    mult: '1.0x',
    color: '#00ff9f',
    bg: 'linear-gradient(135deg, #001a0f 0%, #003320 40%, #00ff9f08 100%)',
    pattern: 'repeating-linear-gradient(90deg, rgba(0,255,159,0.03) 0px, rgba(0,255,159,0.03) 1px, transparent 1px, transparent 60px)',
    desc: 'Neon-lit streets pulse with digital energy. Entry zone for all warriors.',
    effects: ['scanline', 'grid'],
  },
  {
    id: 'desert',
    name: 'Desert Storm',
    mult: '1.2x',
    color: '#ff8c00',
    bg: 'linear-gradient(135deg, #1a0f00 0%, #332200 40%, #ff8c0008 100%)',
    pattern: 'radial-gradient(circle at 30% 70%, rgba(255,140,0,0.06) 0%, transparent 50%)',
    desc: 'Sandstorms reveal ancient treasures. +20% mining bonus.',
    effects: ['sand'],
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    mult: '1.4x',
    color: '#0080ff',
    bg: 'linear-gradient(135deg, #000f1a 0%, #002244 40%, #0080ff08 100%)',
    pattern: 'repeating-linear-gradient(0deg, rgba(0,128,255,0.02) 0px, transparent 2px, transparent 20px)',
    desc: 'Abyssal depths hide the rarest minerals. +40% mining bonus.',
    effects: ['caustic'],
  },
  {
    id: 'volcano',
    name: 'Volcano',
    mult: '1.6x',
    color: '#ff3300',
    bg: 'linear-gradient(135deg, #1a0500 0%, #330a00 40%, #ff330008 100%)',
    pattern: 'radial-gradient(ellipse at 50% 100%, rgba(255,51,0,0.08) 0%, transparent 60%)',
    desc: 'Molten lava forges the strongest warriors. +60% mining bonus.',
    effects: ['lava'],
  },
  {
    id: 'tundra',
    name: 'Frozen Tundra',
    mult: '1.8x',
    color: '#a8d8ff',
    bg: 'linear-gradient(135deg, #0a1520 0%, #152535 40%, #a8d8ff08 100%)',
    pattern: 'repeating-conic-gradient(rgba(168,216,255,0.02) 0deg, transparent 30deg, transparent 60deg)',
    desc: 'Crystallized ice fields amplify energy. +80% mining bonus.',
    effects: ['frost'],
  },
  {
    id: 'void',
    name: 'The Void',
    mult: '2.0x',
    color: '#cc00ff',
    bg: 'linear-gradient(135deg, #0f001a 0%, #200033 40%, #cc00ff08 100%)',
    pattern: 'radial-gradient(circle at 70% 30%, rgba(204,0,255,0.06) 0%, transparent 40%)',
    desc: 'Reality bends. Max mining multiplier. Mythic warriors only.',
    effects: ['glitch', 'vortex'],
  },
];

const TOKENOMICS_DATA = [
  { label: 'Mining Rewards', pct: 50, color: '#00d4ff' },
  { label: 'Liquidity', pct: 20, color: '#00ff9f' },
  { label: 'Team (locked)', pct: 15, color: '#ffd700' },
  { label: 'Marketing', pct: 10, color: '#ff8c00' },
  { label: 'Reserve', pct: 5, color: '#cc00ff' },
];

const ROADMAP_PHASES = [
  {
    q: 'Q1 2026',
    title: 'GENESIS',
    active: true,
    items: ['2,300 Genesis Warriors mint', '23,000 Capsules launch', 'Mining system live', 'Marketplace trading', 'Telegram Mini App'],
  },
  {
    q: 'Q2 2026',
    title: 'EXPANSION',
    active: false,
    items: ['Guild Wars system', 'Battle Arena PvP', 'Scholarship program', 'Mobile app launch', 'CEX listings'],
  },
  {
    q: 'Q3 2026',
    title: 'EVOLUTION',
    active: false,
    items: ['AI Companions', '3D World Map', 'Tournament system', 'Cross-chain bridges', 'VR/AR experiences'],
  },
  {
    q: 'Q4 2026',
    title: 'DOMINION',
    active: false,
    items: ['DAO governance', 'New generations', 'Metaverse integration', 'Esports tournaments', 'Global expansion'],
  },
];

const LIVE_ACTIVITIES = [
  { type: 'purchase', user: '0x7a3f...k9m2', action: 'bought KRONOS (MYTHIC)', time: '2m ago', icon: ShoppingCart },
  { type: 'open', user: '0xb2e9...p4n7', action: 'pulled SOLARIS from Genesis Capsule', time: '5m ago', icon: Gift },
  { type: 'mining', user: '0x4k1j...v8s3', action: 'mined 2,450 EZZI in The Void', time: '8m ago', icon: Zap },
  { type: 'purchase', user: '0xf3a1...d5r9', action: 'bought 5 Core Capsules', time: '12m ago', icon: ShoppingCart },
  { type: 'open', user: '0x9c2b...w6t1', action: 'pulled EPIC warrior', time: '15m ago', icon: Gift },
  { type: 'mining', user: '0x8e4d...h2j5', action: 'mined 1,200 EZZI in Volcano', time: '18m ago', icon: Zap },
];

/* ============================================================
   PRESALE TARGET DATE — June 1 2026
   ============================================================ */
const PRESALE_DATE = new Date('2026-06-01T00:00:00Z').getTime();

/* ============================================================
   HELPER — SVG donut arc
   ============================================================ */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

/* ============================================================
   FLIP COUNTDOWN COMPONENT
   ============================================================ */
function FlipDigit({ value, label }: { value: number; label: string }) {
  const [prevValue, setPrevValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value === prevValue) return;
    setIsFlipping(true);
    const timer = setTimeout(() => {
      setPrevValue(value);
      setIsFlipping(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, prevValue]);

  const displayValue = String(value).padStart(2, '0');
  const prevDisplayValue = String(prevValue).padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-24 md:w-28 md:h-32 perspective-1000">
        {/* Static background */}
        <div className="absolute inset-0 bg-[#0a0a1a] rounded-xl border border-[#ffd700]/20" />

        {/* Top half */}
        <div className="absolute inset-0 overflow-hidden rounded-t-xl">
          <div className="h-1/2 bg-gradient-to-b from-[#131326] to-[#0a0a1a] flex items-end justify-center pb-0">
            <span className="text-4xl md:text-6xl font-bold font-['Space_Mono'] text-[#ffd700]">
              {displayValue}
            </span>
          </div>
        </div>

        {/* Bottom half */}
        <div className="absolute inset-0 overflow-hidden rounded-b-xl">
          <div className="h-full flex items-end justify-center">
            <div className="h-1/2 w-full bg-gradient-to-b from-[#0a0a1a] to-[#131326] flex items-start justify-center pt-0">
              <span className="text-4xl md:text-6xl font-bold font-['Space_Mono'] text-[#ffd700] -mt-[1.4em] md:-mt-[1.3em]">
                {displayValue}
              </span>
            </div>
          </div>
        </div>

        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[#ffd700]/30" />

        {/* Flip animation */}
        <AnimatePresence>
          {isFlipping && (
            <>
              {/* Top flipping down */}
              <motion.div
                initial={{ rotateX: 0 }}
                animate={{ rotateX: -90 }}
                exit={{ rotateX: -90 }}
                transition={{ duration: 0.3, ease: 'easeIn' }}
                style={{ transformOrigin: 'bottom', transformStyle: 'preserve-3d' }}
                className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden rounded-t-xl bg-gradient-to-b from-[#131326] to-[#0a0a1a]"
              >
                <div className="absolute inset-0 flex items-end justify-center pb-0">
                  <span className="text-4xl md:text-6xl font-bold font-['Space_Mono'] text-[#ffd700]">
                    {prevDisplayValue}
                  </span>
                </div>
              </motion.div>

              {/* Bottom flipping up */}
              <motion.div
                initial={{ rotateX: 90 }}
                animate={{ rotateX: 0 }}
                exit={{ rotateX: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: 0.15 }}
                style={{ transformOrigin: 'top', transformStyle: 'preserve-3d' }}
                className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden rounded-b-xl bg-gradient-to-b from-[#0a0a1a] to-[#131326]"
              >
                <div className="absolute inset-0 flex items-start justify-center pt-0">
                  <span className="text-4xl md:text-6xl font-bold font-['Space_Mono'] text-[#ffd700] -mt-[1.4em] md:-mt-[1.3em]">
                    {displayValue}
                  </span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <span className="text-xs md:text-sm text-gray-500 uppercase tracking-wider mt-2 font-['Rajdhani'] font-bold">
        {label}
      </span>
    </div>
  );
}

/* ============================================================
   COUNT UP WITH OVERSHOOT
   ============================================================ */
function CountUpOvershoot({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          const startTime = performance.now();

          function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Overshoot easing: goes past target then settles
            const overshoot = progress < 1
              ? progress * (1.15 - progress * 0.15) // Peak at ~1.08
              : 1;
            const current = Math.floor(end * overshoot);
            setValue(current);
            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              setValue(end);
            }
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref} className="font-mono font-bold tabular-nums">
      {value.toLocaleString()}{suffix}
    </span>
  );
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function HomePage() {
  /* ---- countdown state ---- */
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, PRESALE_DATE - Date.now());
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ---- tokenomics hover ---- */
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  /* ---- easter egg #1: logo 5x click = gold rain ---- */
  const logoClicksRef = useRef(0);
  const [goldRain, setGoldRain] = useState(false);

  const handleLogoClick = useCallback(() => {
    logoClicksRef.current += 1;
    if (logoClicksRef.current >= 5) {
      setGoldRain(true);
      setTimeout(() => setGoldRain(false), 3000);
      logoClicksRef.current = 0;
    }
  }, []);

  /* ---- easter egg #2: Arabic flash on hover ---- */
  const [arabicFlash, setArabicFlash] = useState(false);

  /* ---- easter egg #3: Zone6 triple click = glitch ---- */
  const zone6ClicksRef = useRef(0);
  const [zone6Glitch, setZone6Glitch] = useState(false);

  const handleZone6Click = useCallback(() => {
    zone6ClicksRef.current += 1;
    if (zone6ClicksRef.current >= 3) {
      setZone6Glitch(true);
      setTimeout(() => {
        setZone6Glitch(false);
        zone6ClicksRef.current = 0;
      }, 2000);
    } else {
      setTimeout(() => {
        zone6ClicksRef.current = 0;
      }, 500);
    }
  }, []);

  /* ---- mobile CTA bar visibility ---- */
  const [showMobileCTA, setShowMobileCTA] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowMobileCTA(window.scrollY > 300);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ---- parallax ref ---- */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  /* ---- roadmap horizontal scroll ref ---- */
  const roadmapContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="overflow-hidden relative">
      {/* ============================================================
          EASTER EGG #1: GOLD RAIN
          ============================================================ */}
      <AnimatePresence>
        {goldRain && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] pointer-events-none overflow-hidden"
          >
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={`gold-${i}`}
                initial={{ y: '-10%', x: `${Math.random() * 100}%`, rotate: 0, opacity: 1 }}
                animate={{
                  y: '110vh',
                  rotate: 720 + Math.random() * 720,
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: 'easeIn'
                }}
                className="absolute text-[#ffd700] text-2xl"
              >
                {['$', '✦', '◆', '★', '⚡'][i % 5]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          EASTER EGG #2: ARABIC FLASH
          ============================================================ */}
      <AnimatePresence>
        {arabicFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[250] pointer-events-none flex items-center justify-center bg-[#00d4ff]/10"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="text-6xl md:text-9xl font-bold text-[#00d4ff] font-['Rajdhani']"
            >
              الطاقة تعود
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          EASTER EGG #3: ZONE 6 GLITCH
          ============================================================ */}
      <AnimatePresence>
        {zone6Glitch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, rgba(204,0,255,0.1) 0px, transparent 1px, transparent 2px)',
              animation: 'glitch-flash 0.1s infinite',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-4xl md:text-6xl font-bold text-[#cc00ff] font-['Rajdhani'] uppercase tracking-widest"
                style={{ textShadow: '0 0 40px #cc00ff, 0 0 80px #cc00ff' }}
              >
                REALITY BENDS
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          HERO SECTION — letter animation + clamp title
          ============================================================ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00d4ff]/10 via-[#02020a] to-[#02020a]" />
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`p-${i}`}
              className="absolute w-1 h-1 bg-[#00d4ff] rounded-full"
              style={{ left: `${(i * 5.3) % 100}%`, top: `${(i * 7.1) % 100}%` }}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: (i % 5) * 0.4 }}
            />
          ))}
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          {/* Badge with click handler for easter egg */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={handleLogoClick}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 mb-8 cursor-pointer hover:bg-[#00d4ff]/20 transition-colors"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-[#00d4ff] font-medium">Genesis Collection Live</span>
          </motion.div>

          {/* Clamp title with per-letter animation */}
          <h1
            onMouseEnter={() => setArabicFlash(true)}
            onMouseLeave={() => setArabicFlash(false)}
            className="font-bold font-['Rajdhani'] uppercase tracking-tight mb-6 cursor-pointer select-none flex flex-wrap items-center justify-center"
            style={{ fontSize: 'clamp(5rem, 12vw, 10rem)', lineHeight: 1 }}
          >
            {HERO_LETTERS.map((letter, i) => (
              <motion.span
                key={`l-${i}`}
                initial={{ opacity: 0, y: 40, scale: 0.6, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={letter === ' ' ? 'inline-block w-[0.3em]' : i >= 5 ? 'text-[#00d4ff]' : 'text-white'}
                style={{ display: 'inline-block' }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-base md:text-xl text-gray-400 mb-4 font-['Space_Mono'] tracking-[0.25em] uppercase"
          >
            Mine &middot; Collect &middot; Battle &middot; Earn &middot; Rule &middot; Recruit
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto mb-12"
          >
            6 ancient civilizations. 1 deflationary token.
            <br />
            Your warriors mine EZZI COIN while you sleep.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
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

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="w-px h-20 bg-gradient-to-b from-transparent via-[#00d4ff] to-transparent" />
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================================
          STATS SECTION — count-up with overshoot
          ============================================================ */}
      <section className="py-8 border-y border-white/5 bg-gradient-to-r from-[#00d4ff]/5 via-transparent to-[#00d4ff]/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Warriors Recruited', value: 2300, suffix: '' },
              { icon: Gift, label: 'Capsules Opened', value: 15420, suffix: '' },
              { icon: Zap, label: 'EZZI Mined', value: 2.5, suffix: 'M+' },
              { icon: Globe, label: 'Active Miners', value: 1847, suffix: '' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex items-center space-x-4 px-6 py-4"
              >
                <div className="p-3 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/20">
                  <stat.icon className="w-6 h-6 text-[#00d4ff]" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold font-['Space_Mono'] text-white">
                    <CountUpOvershoot end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          PRESALE COUNTDOWN — HUGE flip animation + live feed
          ============================================================ */}
      <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-b from-[#02020a] via-[#050510] to-[#02020a]">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.08) 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/30 mb-6">
              <Flame className="w-4 h-4 text-[#ffd700]" />
              <span className="text-sm text-[#ffd700] font-bold uppercase tracking-wider">Presale Coming</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold font-['Rajdhani'] uppercase mb-4">
              <span className="text-[#ffd700]">$EZZI</span> Token Presale
            </h2>
            <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
              Early supporters get priority allocation. Countdown to genesis.
            </p>

            {/* Flip Countdown */}
            <div className="flex justify-center gap-3 md:gap-6 mb-16">
              <FlipDigit value={countdown.days} label="Days" />
              <FlipDigit value={countdown.hours} label="Hours" />
              <FlipDigit value={countdown.mins} label="Mins" />
              <FlipDigit value={countdown.secs} label="Secs" />
            </div>

            <p className="text-sm text-gray-500 mb-16 font-['Space_Mono']">
              Total Supply: 100,000,000 $EZZI &middot; Deflationary
            </p>
          </motion.div>

          {/* Live Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-green-400 font-medium uppercase tracking-wider">Live Activity</span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {LIVE_ACTIVITIES.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-[#0a0a1a]/80 rounded-xl border border-white/5 hover:border-[#ffd700]/20 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-[#ffd700]/10">
                    <activity.icon className="w-4 h-4 text-[#ffd700]" />
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
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          BENTO GRID — 6 features
          ============================================================ */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold font-['Rajdhani'] uppercase mb-4">
              Built for <span className="text-[#00d4ff]">Dominance</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Every feature is designed to reward those who play the most.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[200px] gap-4">
            {FEATURES.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className={`${feat.span} group relative rounded-2xl border border-white/10 hover:border-white/20 transition-all overflow-hidden`}
                style={{ background: `linear-gradient(135deg, ${feat.accent}08, ${feat.accent}03, transparent)` }}
              >
                {/* Top edge glow */}
                <div
                  className="absolute top-0 left-0 right-0 h-px opacity-40 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, transparent, ${feat.accent}80, transparent)` }}
                />
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="p-3 rounded-xl inline-flex mb-4" style={{ background: `${feat.accent}15` }}>
                      <feat.icon className="w-6 h-6" style={{ color: feat.accent }} />
                    </div>
                    <h3 className="text-xl font-bold font-['Rajdhani'] uppercase mb-2">{feat.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          6 IMMERSIVE ZONES — CSS only environments
          ============================================================ */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold font-['Rajdhani'] uppercase mb-4">
              6 Ancient <span className="text-[#00d4ff]">Civilizations</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Each zone is a unique environment with its own mining multiplier. Conquer them all.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ZONES.map((zone, idx) => (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={zone.id === 'void' ? handleZone6Click : undefined}
                className={`group relative h-72 rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all cursor-pointer ${
                  zone.id === 'void' ? 'hover:border-[#cc00ff]/50' : ''
                } ${zone6Glitch && zone.id === 'void' ? 'animate-pulse' : ''}`}
                style={{ background: zone.bg }}
              >
                {/* CSS pattern layer */}
                <div className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: zone.pattern }} />

                {/* Zone-specific effects */}
                {zone.effects.includes('scanline') && (
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
                    style={{
                      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,159,0.03) 2px, rgba(0,255,159,0.03) 4px)',
                    }}
                  />
                )}
                {zone.effects.includes('grid') && (
                  <div className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(0,255,159,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,159,0.1) 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                    }}
                  />
                )}
                {zone.effects.includes('sand') && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 50% 100%, rgba(255,140,0,0.1) 0%, transparent 50%)',
                      animation: 'pulse 3s ease-in-out infinite',
                    }}
                  />
                )}
                {zone.effects.includes('caustic') && (
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
                    style={{
                      background: 'repeating-linear-gradient(45deg, rgba(0,128,255,0.05) 0px, transparent 10px, rgba(0,128,255,0.05) 20px)',
                      animation: 'shimmer 3s linear infinite',
                    }}
                  />
                )}
                {zone.effects.includes('lava') && (
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, rgba(255,51,0,0.3), transparent)',
                    }}
                  />
                )}
                {zone.effects.includes('frost') && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 50% 0%, rgba(168,216,255,0.1) 0%, transparent 50%)',
                    }}
                  />
                )}
                {zone.effects.includes('vortex') && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent, rgba(204,0,255,0.1), transparent)',
                      animation: 'spin-slow 10s linear infinite',
                    }}
                  />
                )}

                {/* Animated border glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ boxShadow: `inset 0 0 40px ${zone.color}15, 0 0 60px ${zone.color}10` }}
                />

                {/* Corner accent */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ background: `radial-gradient(circle at 100% 0%, ${zone.color}, transparent 70%)` }}
                />

                {/* Content */}
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-bold font-['Rajdhani'] uppercase" style={{ color: zone.color }}>
                        {zone.name}
                      </h3>
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full uppercase font-['Space_Mono']"
                        style={{ background: `${zone.color}20`, color: zone.color, border: `1px solid ${zone.color}40` }}
                      >
                        {zone.mult}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{zone.desc}</p>
                  </div>

                  {/* Bottom bar */}
                  <div className="flex items-center space-x-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: `${zone.color}15` }}>
                      <div
                        className="h-full rounded-full group-hover:w-full transition-all duration-700"
                        style={{ background: zone.color, width: '0%' }}
                      />
                    </div>
                    <Globe className="w-4 h-4" style={{ color: zone.color, opacity: 0.5 }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          INTERACTIVE TOKENOMICS DONUT
          ============================================================ */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#02020a] to-[#0a0a1a]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold font-['Rajdhani'] uppercase mb-4">
              <span className="text-[#ffd700]">$EZZI</span> Tokenomics
            </h2>
            <p className="text-gray-400 text-lg">Deflationary by design. Forever.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* SVG Donut */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative w-72 h-72 md:w-80 md:h-80">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {(() => {
                    let cumulative = 0;
                    return TOKENOMICS_DATA.map((slice, i) => {
                      const startAngle = cumulative * 3.6;
                      cumulative += slice.pct;
                      const endAngle = cumulative * 3.6;
                      const isHovered = hoveredSlice === i;
                      return (
                        <path
                          key={slice.label}
                          d={describeArc(100, 100, 70, startAngle, endAngle - 0.5)}
                          fill="none"
                          stroke={slice.color}
                          strokeWidth={isHovered ? 28 : 20}
                          strokeLinecap="round"
                          className="transition-all duration-300 cursor-pointer"
                          style={{
                            filter: isHovered ? `drop-shadow(0 0 12px ${slice.color}80)` : 'none',
                            opacity: hoveredSlice !== null && !isHovered ? 0.4 : 1,
                          }}
                          onMouseEnter={() => setHoveredSlice(i)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      );
                    });
                  })()}
                </svg>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {hoveredSlice !== null ? (
                    <>
                      <span className="text-3xl font-bold font-['Space_Mono']" style={{ color: TOKENOMICS_DATA[hoveredSlice].color }}>
                        {TOKENOMICS_DATA[hoveredSlice].pct}%
                      </span>
                      <span className="text-sm text-gray-400 mt-1">{TOKENOMICS_DATA[hoveredSlice].label}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-bold font-['Space_Mono'] text-white">100M</span>
                      <span className="text-xs text-gray-500 mt-1">TOTAL SUPPLY</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Legend + Burn */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
              {/* Legend */}
              <div className="space-y-3">
                {TOKENOMICS_DATA.map((slice, i) => (
                  <div
                    key={slice.label}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-white/15 transition-colors cursor-pointer"
                    style={{ background: hoveredSlice === i ? `${slice.color}10` : 'transparent' }}
                    onMouseEnter={() => setHoveredSlice(i)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: slice.color }} />
                      <span className="text-sm font-medium">{slice.label}</span>
                    </div>
                    <span className="text-sm font-bold font-['Space_Mono']" style={{ color: slice.color }}>
                      {slice.pct}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Burn info */}
              <div className="p-4 bg-[#ff3300]/8 rounded-xl border border-[#ff3300]/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Flame className="w-5 h-5 text-[#ff3300]" />
                  <span className="font-bold font-['Rajdhani'] uppercase text-[#ff3300]">Burn Mechanics</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  5% burn on capsule purchases &middot; 2.5% marketplace fee burn &middot; Zone switching burns &middot;
                  NFT fusion burns base warriors &middot; Supply only goes down.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================
          HORIZONTAL ROADMAP
          ============================================================ */}
      <section className="py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold font-['Rajdhani'] uppercase mb-4">
              Roadmap <span className="text-[#00d4ff]">2026</span>
            </h2>
            <p className="text-gray-400 text-lg">Our journey to build the ultimate Web3 gaming platform</p>
          </motion.div>

          {/* Horizontal scroll container */}
          <div ref={roadmapContainerRef} className="overflow-x-auto no-scrollbar pb-4">
            <div className="flex space-x-6 min-w-max px-4">
              {ROADMAP_PHASES.map((phase, idx) => (
                <motion.div
                  key={phase.q}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  className="relative flex-shrink-0 w-80"
                >
                  {/* Connector line */}
                  {idx < ROADMAP_PHASES.length - 1 && (
                    <div className="absolute top-10 left-full w-6 h-px bg-gradient-to-r from-[#00d4ff]/50 to-transparent z-20" />
                  )}

                  <div
                    className={`relative h-full p-6 rounded-2xl border transition-all ${
                      phase.active
                        ? 'bg-[#00d4ff]/8 border-[#00d4ff]/40 shadow-[0_0_40px_rgba(0,212,255,0.08)]'
                        : 'bg-[#0a0a1a] border-white/10'
                    }`}
                  >
                    {/* Quarter badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-bold uppercase tracking-widest font-['Space_Mono'] ${phase.active ? 'text-[#00d4ff]' : 'text-gray-500'}`}>
                        {phase.q}
                      </span>
                      {phase.active && (
                        <span className="flex items-center space-x-1 text-xs text-green-400">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span>Live</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold font-['Rajdhani'] uppercase mb-4">{phase.title}</h3>

                    <ul className="space-y-3">
                      {phase.items.map((item, i2) => (
                        <li key={i2} className={`flex items-start space-x-2 text-sm ${phase.active ? 'text-gray-300' : 'text-gray-500'}`}>
                          {phase.active ? (
                            <ChevronRight className="w-4 h-4 text-[#00d4ff] mt-0.5 flex-shrink-0" />
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

          {/* Scroll hint */}
          <div className="flex justify-center mt-6 md:hidden">
            <span className="text-xs text-gray-500 flex items-center space-x-1">
              <ChevronRight className="w-3 h-3" />
              <span>Scroll to explore</span>
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================
          COMMUNITY
          ============================================================ */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#0a0a1a] to-[#02020a]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-bold font-['Rajdhani'] uppercase mb-4">
              Join the <span className="text-[#00d4ff]">Community</span>
            </h2>
            <p className="text-gray-400 text-lg">Connect with thousands of warriors worldwide</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Discord', desc: 'Join 5,000+ warriors', url: 'https://discord.com/invite/ZHtjbtpFXG', color: '#5865F2', icon: Users },
              { name: 'Twitter/X', desc: 'Follow @Ezzitrade', url: 'https://x.com/Ezzitrade', color: '#1DA1F2', icon: Globe },
              { name: 'Telegram', desc: 'Join @ezziworld', url: 'https://t.me/ezziworld', color: '#0088cc', icon: Rocket },
            ].map((link, i) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-8 bg-[#0a0a1a] rounded-2xl border border-white/10 hover:border-white/20 transition-all text-center"
                >
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto" style={{ background: `${link.color}20` }}>
                    <link.icon className="w-8 h-8" style={{ color: link.color }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{link.name}</h3>
                  <p className="text-gray-400">{link.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#02020a] via-[#00d4ff]/5 to-[#02020a]" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute rounded-full border border-[#00d4ff]/20"
              style={{ width: `${ring * 200}px`, height: `${ring * 200}px` }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4 + ring, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
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

      {/* ============================================================
          FIXED MOBILE CTA BAR — appears after scroll
          ============================================================ */}
      <AnimatePresence>
        {showMobileCTA && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          >
            <div className="bg-[#02020a]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center space-x-3">
              <Link
                href="/marketplace"
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-[#00d4ff] text-[#02020a] rounded-lg font-bold text-sm uppercase tracking-wide"
              >
                <Star className="w-4 h-4" />
                <span>Marketplace</span>
              </Link>
              <Link
                href="/capsules"
                className="flex-1 flex items-center justify-center space-x-2 py-3 border border-[#ffd700]/50 text-[#ffd700] rounded-lg font-bold text-sm uppercase tracking-wide"
              >
                <Crown className="w-4 h-4" />
                <span>Capsules</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom spacer for mobile CTA bar */}
      <div className="h-16 md:hidden" />
    </div>
  );
}

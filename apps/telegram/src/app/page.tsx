'use client';

/**
 * EZZI WORLD — TELEGRAM MINI APP v2 FINAL
 * 7 Interconnected Mechanics · Ultra AAA Design
 * #1 Solana Gaming App Target
 *
 * Screens:
 *  1. ResonanceForge   — skill-based mining with rotating orb
 *  2. OracleProphecy   — daily prophecy + streak rewards
 *  3. WarGuild         — collective boss raids
 *  4. Sanctum          — personal base building
 *  5. StakingVault     — EZZI staking with APY
 *  6. AncientBazaar    — P2P relic marketplace
 *  7. CosmosMap        — interactive zone map
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

/* ─── Constants ──────────────────────────────────────────────── */
const API = process.env.NEXT_PUBLIC_API_URL || 'https://ezzi-world-api.fly.dev/api';

const WARRIORS = [
  { id:'kronos',   name:'KRONOS',   rarity:'MYTHIC',    speed:1.8, zoneWidth:0.20, icon:'⚡', bonus:'+2x Mining'    },
  { id:'kira',     name:'KIRA',     rarity:'LEGENDARY', speed:2.4, zoneWidth:0.15, icon:'🌸', bonus:'+1.8x Mining'  },
  { id:'atlas',    name:'ATLAS',    rarity:'EPIC',      speed:2.0, zoneWidth:0.18, icon:'🏔', bonus:'+1.6x Mining'  },
  { id:'cosmos',   name:'COSMOS',   rarity:'LEGENDARY', speed:3.0, zoneWidth:0.13, icon:'🌌', bonus:'+1.9x Mining'  },
  { id:'sylvan',   name:'SYLVAN',   rarity:'COMMON',    speed:1.5, zoneWidth:0.25, icon:'🌿', bonus:'+1x Mining'    },
  { id:'seraph',   name:'SERAPH',   rarity:'LEGENDARY', speed:2.8, zoneWidth:0.14, icon:'👼', bonus:'+Zone 50%'     },
  { id:'solaris',  name:'SOLARIS',  rarity:'EPIC',      speed:2.2, zoneWidth:0.22, icon:'☀', bonus:'+Capsule Luck' },
  { id:'ignite',   name:'IGNITE',   rarity:'MYTHIC',    speed:3.5, zoneWidth:0.12, icon:'🔥', bonus:'+15x Max Mult' },
] as const;

const ZONES = [
  { id:'void',    name:'THE VOID',    warriors:863, pct:82, color:'#cc00ff', bonus:'2x',   rank:'👑', description:'Ancient dark dimension. Highest rewards, most dangerous.' },
  { id:'volcano', name:'VOLCANO',     warriors:641, pct:64, color:'#ff3300', bonus:'1.6x', rank:2,   description:'Fire realm. Strong warriors forged in eternal flames.' },
  { id:'neon',    name:'NEON CITY',   warriors:427, pct:48, color:'#00d4ff', bonus:'1x',   rank:3,   description:'Cyber civilization hub. Technology meets ancient power.' },
  { id:'desert',  name:'DESERT',      warriors:289, pct:33, color:'#ff8c00', bonus:'0.8x', rank:4,   description:'Ancient desert kings. Wisdom of the sands.' },
  { id:'ocean',   name:'DEEP OCEAN',  warriors:312, pct:40, color:'#0080ff', bonus:'0.9x', rank:5,   description:'Underwater civilization. Hidden treasures await.' },
  { id:'frozen',  name:'FROZEN PEAK', warriors:198, pct:22, color:'#a8d8ff', bonus:'0.6x', rank:6,   description:'Ice warriors. Slow but unstoppable force.' },
] as const;

const CAPSULES = [
  { id:'core',      name:'CORE',      icon:'🔷', price:23, cls:'cap-core',      rarity:'RARE',      badgeClass:'badge-rare',      rates:'30% Rare · 60% Common'      },
  { id:'surge',     name:'SURGE',     icon:'🔶', price:29, cls:'cap-surge',     rarity:'EPIC',      badgeClass:'badge-epic',      rates:'10% Epic · 30% Rare'        },
  { id:'void',      name:'VOID',      icon:'🔮', price:35, cls:'cap-void',      rarity:'LEGENDARY', badgeClass:'badge-legendary', rates:'2% Legendary · 10% Epic'    },
  { id:'celestial', name:'CELESTIAL', icon:'✨', price:41, cls:'cap-celestial', rarity:'LEGENDARY', badgeClass:'badge-legendary', rates:'5% Legendary · 20% Epic'    },
] as const;

const PROPHÉCIÉS = [
  { arabic:'الطاقة تعود من قلب الفراغ', english:'Power returns from the heart of the Void', warrior:'KRONOS', event:'VOID SURGE in 6h — Mine x3 rewards' },
  { arabic:'النجوم تتحدث لمن يستمع',    english:'Stars speak to those who listen',           warrior:'COSMOS', event:'CELESTIAL PORTAL opens at 00:00 UTC' },
  { arabic:'المعركة القادمة تغير كل شيء',english:'The coming battle changes everything',      warrior:'ATLAS',  event:'WAR GUILD raid in 2h — join now' },
  { arabic:'الكنوز خلف الجدار المنسي',  english:'Treasures hidden behind the forgotten wall', warrior:'SYLVAN', event:'SECRET CHAMBER unlocks tonight' },
] as const;

const RARITY_ICONS: Record<string, string> = {
  MYTHIC:'⚡', LEGENDARY:'💎', EPIC:'🔮', RARE:'🔷', COMMON:'🔹'
};

const RARITY_COLORS: Record<string, string> = {
  MYTHIC:'#ff00c8', LEGENDARY:'#ffd700', EPIC:'#b44dff', RARE:'#4d9fff', COMMON:'#8a9bb0'
};

/* ─── Types ──────────────────────────────────────────────────── */
type ScreenId = 'forge' | 'oracle' | 'guild' | 'sanctum' | 'staking' | 'bazaar' | 'cosmos';

interface TGUser { id:number; first_name:string; username?:string; photo_url?:string; }

/* ─── Haptic ─────────────────────────────────────────────────── */
function haptic(type:'impact'|'success'|'error' = 'impact') {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg?.HapticFeedback) return;
  if (type === 'impact') tg.HapticFeedback.impactOccurred('medium');
  else tg.HapticFeedback.notificationOccurred(type);
}

/* ─── RNG ────────────────────────────────────────────────────── */
function rollRarity(): string {
  const r = Math.random() * 100;
  if (r < 1)  return 'MYTHIC';
  if (r < 3)  return 'LEGENDARY';
  if (r < 13) return 'EPIC';
  if (r < 43) return 'RARE';
  return 'COMMON';
}

/* ─────────────────────────────────────────────────────────────────
   SHARED COMPONENTS
   ───────────────────────────────────────────────────────────────── */

function EzziLogo({ size = 34 }: { size?: number }) {
  return (
    <div style={{ width:size, height:size, borderRadius:9, overflow:'hidden', flexShrink:0 }}>
      <Image src="/logo-ezzi.png" alt="EZZI" width={size} height={size}
        style={{ objectFit:'contain' }} priority />
    </div>
  );
}

function AppHeader({ user, balance }: { user:TGUser|null; balance:number }) {
  return (
    <header className="app-header">
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <EzziLogo size={34} />
        <div>
          <div className="header-title">EZZI WORLD</div>
          <div className="header-subtitle">{user?.first_name?.toUpperCase() || 'WARRIOR'}</div>
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div className="header-balance-label">BALANCE</div>
        <div className="header-balance-value">{Math.floor(balance).toLocaleString()}</div>
      </div>
    </header>
  );
}

const NAV: { id:ScreenId; icon:string; label:string }[] = [
  { id:'forge',   icon:'⚡', label:'FORGE'   },
  { id:'oracle',  icon:'🔮', label:'ORACLE'  },
  { id:'guild',   icon:'⚔',  label:'GUILD'   },
  { id:'sanctum', icon:'🏛', label:'SANCTUM' },
  { id:'staking', icon:'💎', label:'STAKE'   },
  { id:'bazaar',  icon:'🏺', label:'BAZAAR'  },
  { id:'cosmos',  icon:'🌌', label:'COSMOS'  },
];

function BottomNav({ active, onChange }: { active:ScreenId; onChange:(s:ScreenId)=>void }) {
  return (
    <nav className="bottom-nav">
      {NAV.map(n => (
        <button key={n.id} className={`nav-item${active===n.id?' active':''}`}
          onClick={() => { haptic(); onChange(n.id); }}>
          <div className="nav-icon">{n.icon}</div>
          <div className="nav-label">{n.label}</div>
        </button>
      ))}
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 1 — RESONANCE FORGE
   Skill-based mining. Rotating dot on ring. Tap at peak = 10x.
   Each warrior has unique speed + zone width.
   ───────────────────────────────────────────────────────────────── */
function ResonanceForge({ balance, setBalance }: { balance:number; setBalance:React.Dispatch<React.SetStateAction<number>> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef  = useRef(0);
  const afRef     = useRef<number>(0);
  const [warrior]  = useState(WARRIORS[0]); // KRONOS default
  const [streak,   setStreak]   = useState(0);
  const [perfect,  setPerfect]  = useState(0);
  const [mined,    setMined]    = useState(0);
  const [tapRate,  setTapRate]  = useState(0.5);
  const [multPct,  setMultPct]  = useState(50);
  const comboTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  // Passive income
  useEffect(() => {
    const id = setInterval(() => setBalance((b: number) => b + 1.2/10), 100);
    return () => clearInterval(id);
  }, [setBalance]);

  // Canvas draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W=220, H=220, CX=110, CY=110, R=78;
    let wavePhase = 0;

    function draw() {
      afRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      wavePhase += 0.055;
      angleRef.current += warrior.speed;
      if (angleRef.current > 360) angleRef.current -= 360;

      const prec = (Math.sin((angleRef.current - 90) * Math.PI/180) + 1) / 2;
      const isGold = prec > 0.75;

      // Ambient glow
      const ag = ctx.createRadialGradient(CX,CY,R-10,CX,CY,R+22);
      ag.addColorStop(0, isGold ? 'rgba(255,215,0,.18)' : 'rgba(0,212,255,.08)');
      ag.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.arc(CX,CY,R+22,0,Math.PI*2); ctx.fill();

      // Track ring
      ctx.strokeStyle='rgba(255,255,255,.05)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(CX,CY,R,0,Math.PI*2); ctx.stroke();

      // Wave ring
      for (let a = 0; a < 360; a += 4) {
        const rad = a * Math.PI/180;
        const wave = Math.sin(a * Math.PI/180 * 3 + wavePhase) * 0.28 * 10;
        const r1 = R-4+wave, r2 = R+5+wave;
        const intensity = (Math.sin(a * Math.PI/180 * 3 + wavePhase)+1)/2;
        ctx.strokeStyle = isGold
          ? `rgba(255,215,0,${.1+intensity*.5})`
          : `rgba(0,212,255,${.08+intensity*.42})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(CX+Math.cos(rad)*r1, CY+Math.sin(rad)*r1);
        ctx.lineTo(CX+Math.cos(rad)*r2, CY+Math.sin(rad)*r2);
        ctx.stroke();
      }

      // Perfect zone indicator (top arc)
      const zoneHalf = warrior.zoneWidth * Math.PI;
      ctx.strokeStyle = 'rgba(255,215,0,0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(CX, CY, R, -Math.PI/2 - zoneHalf, -Math.PI/2 + zoneHalf);
      ctx.stroke();

      // Peak dot (top)
      ctx.fillStyle='rgba(255,215,0,.95)';
      ctx.beginPath(); ctx.arc(CX, CY-R, 5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,215,0,.25)'; ctx.lineWidth=8;
      ctx.beginPath(); ctx.arc(CX, CY-R, 9, 0, Math.PI*2); ctx.stroke();

      // Moving dot + tail
      const dotColor = prec>0.88?'#ffd700':prec>0.55?'#00d4ff':'#ff4444';
      const dotR = prec>0.88?9:7;
      for (let i=7; i>=1; i--) {
        const ta = ((angleRef.current-90-i*warrior.speed*1.4)*Math.PI/180);
        ctx.fillStyle = dotColor + Math.floor((7-i)/7*150).toString(16).padStart(2,'0');
        ctx.beginPath();
        ctx.arc(CX+Math.cos(ta)*R, CY+Math.sin(ta)*R, dotR*(1-i*.1), 0, Math.PI*2);
        ctx.fill();
      }
      ctx.shadowColor=dotColor; ctx.shadowBlur=prec>0.88?20:10;
      ctx.fillStyle=dotColor;
      ctx.beginPath();
      ctx.arc(CX+Math.cos((angleRef.current-90)*Math.PI/180)*R,
              CY+Math.sin((angleRef.current-90)*Math.PI/180)*R, dotR, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur=0;

      // Orb
      const orbR = prec>0.88?54:50;
      const og = ctx.createRadialGradient(CX-13,CY-13,4,CX,CY,orbR);
      og.addColorStop(0, isGold?'rgba(255,230,100,.9)':'rgba(140,220,255,.85)');
      og.addColorStop(.5,isGold?'rgba(200,160,0,.7)' :'rgba(0,150,200,.7)');
      og.addColorStop(1, isGold?'rgba(100,70,0,.95)' :'rgba(0,40,110,.95)');
      ctx.shadowColor=isGold?'#ffd700':'#00d4ff'; ctx.shadowBlur=isGold?28:14;
      ctx.fillStyle=og; ctx.beginPath(); ctx.arc(CX,CY,orbR,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(CX-14,CY-14,14,0,Math.PI*2); ctx.fill();

      // Orb center text
      ctx.font='bold 10px "Space Mono"'; ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(prec>0.88?'PERFECT!':prec>0.55?'GOOD':'MISS', CX, CY-7);
      const m=prec>0.88?10:prec>0.75?5:prec>0.55?2.5:0.5;
      ctx.font='bold 14px Rajdhani,sans-serif'; ctx.fillStyle='#ffd700';
      ctx.fillText(m+'x', CX, CY+9);

      setMultPct(Math.min(100, prec*115));
    }
    draw();
    return () => cancelAnimationFrame(afRef.current);
  }, [warrior]);

  const handleTap = useCallback(() => {
    const prec = (Math.sin((angleRef.current - 90) * Math.PI/180) + 1) / 2;
    const m = prec>0.88?10:prec>0.75?5:prec>0.55?2.5:0.5;
    const earned = parseFloat((0.5 * m).toFixed(1));
    setBalance((b: number) => b + earned);
    setMined(mn => mn + earned);
    setTapRate(earned);
    haptic(prec>0.88?'success':prec>0.55?'impact':'impact');
    if (prec > 0.88) {
      setStreak(s => s+1);
      setPerfect(p => p+1);
    } else {
      setStreak(0);
    }
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setStreak(0), 1500);
  }, [setBalance]);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{display:'flex',flexDirection:'column',flex:1,paddingBottom:4}}>
      <div className="pulse-banner">
        <div className="pulse-dot"/>
        <span className="pulse-text">RESONANCE EVENT — 10x ACTIVE</span>
        <span className="pulse-timer">14:22</span>
      </div>
      <div className="orb-zone">
        <div style={{position:'absolute',inset:0,pointerEvents:'none'}}
          className="grid-bg-cyan"/>
        <div className="orb-ambient"/>
        {/* Particles */}
        {[{l:'46%',t:'55%',tx:'-14px',ty:'-72px',d:'3.2s',dl:'.4s'},
          {l:'56%',t:'48%',tx:'16px', ty:'-82px',d:'4.1s',dl:'1.3s'},
          {l:'50%',t:'62%',tx:'-6px', ty:'-65px',d:'3.7s',dl:'.9s'}].map((p,i)=>(
          <div key={i} style={{
            position:'absolute',left:p.l,top:p.t,width:3,height:3,borderRadius:'50%',
            background:'var(--ezzi)',opacity:0,animation:`floatUp ${p.d} ${p.dl} ease infinite`,
            ['--tx' as string]:p.tx,['--ty' as string]:p.ty,pointerEvents:'none',
          } as React.CSSProperties}/>
        ))}
        {/* Rings */}
        <div className="orb-ring" style={{width:248,height:248,border:'1px solid rgba(0,212,255,.07)',animationDuration:'15s'}}/>
        <div className="orb-ring" style={{width:198,height:198,border:'1px solid rgba(0,212,255,.13)',animationDuration:'10s',animationDirection:'reverse'}}/>
        <div className="orb-ring" style={{width:154,height:154,border:'1.5px solid rgba(0,212,255,.25)',animationDuration:'5.5s'}}/>
        {/* Canvas */}
        <canvas ref={canvasRef} width={220} height={220}
          style={{cursor:'pointer',borderRadius:'50%',position:'relative',zIndex:2,display:'block'}}
          onClick={handleTap}/>
        {streak>1 && (
          <div style={{
            position:'absolute',top:'38%',left:'50%',transform:'translateX(-50%)',
            background:'rgba(0,212,255,.1)',border:'1px solid rgba(0,212,255,.3)',
            borderRadius:20,padding:'2px 10px',fontSize:9,color:'var(--ezzi)',
            letterSpacing:'.1em',zIndex:3,animation:'comboPop .2s ease',whiteSpace:'nowrap',
          }}>{streak}x COMBO ⚡</div>
        )}
        <div style={{fontSize:9,color:'rgba(0,212,255,.4)',letterSpacing:'.2em',marginTop:10,position:'relative',zIndex:2}}>
          ⚡ TAP WHEN DOT HITS GOLD ZONE
        </div>
      </div>
      {/* Multiplier bar */}
      <div style={{padding:'0 16px',position:'relative',zIndex:2}}>
        <div style={{width:'100%',height:7,background:'rgba(255,255,255,.06)',borderRadius:4,overflow:'hidden',border:'1px solid rgba(255,255,255,.05)',marginBottom:3}}>
          <div style={{height:'100%',width:`${multPct}%`,background:'linear-gradient(90deg,#00d4ff,#ffd700,#ff00c8)',borderRadius:4,transition:'width .1s'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:8,color:'rgba(255,255,255,.3)'}}>
          <span>PRECISION MULTIPLIER</span>
          <span style={{color:'#ffd700',fontWeight:700}}>{(multPct/10).toFixed(1)}x</span>
        </div>
      </div>
      {/* Stats */}
      <div style={{display:'flex',gap:6,padding:'7px 16px 0',position:'relative',zIndex:2}}>
        {[{v:`+${tapRate}`,l:'LAST TAP'},{v:perfect,l:'PERFECT'},{v:streak,l:'STREAK'},{v:mined.toFixed(1),l:'MINED'}].map(({v,l})=>(
          <div key={l} className="stat-cell" style={{flex:1}}>
            <div className="stat-value">{v}</div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>
      {/* Warrior card */}
      <div className="warrior-card">
        <div className="warrior-avatar" style={{fontSize:18}}>{warrior.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,color:'var(--gold)',letterSpacing:'.08em'}}>{warrior.name}</div>
          <div style={{fontSize:8,color:'rgba(255,215,0,.4)',letterSpacing:'.1em',marginTop:1}}>{warrior.rarity} · SPEED {warrior.speed}</div>
        </div>
        <div style={{background:'rgba(255,215,0,.08)',border:'1px solid rgba(255,215,0,.15)',borderRadius:8,padding:'3px 8px',fontSize:9,color:'var(--gold)'}}>{warrior.bonus}</div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 2 — ORACLE PROPHECY
   Daily prophecy (Arabic + English). 7-day streak rewards.
   ───────────────────────────────────────────────────────────────── */
function OracleProphecy() {
  const [propIdx, setPropIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [streakDay] = useState(7);
  const prophecy = PROPHÉCIÉS[propIdx];

  const STREAK_REWARDS = [
    { day:1,  reward:'100 EZZI',         done:true  },
    { day:3,  reward:'Rare Capsule',      done:true  },
    { day:5,  reward:'Epic Warrior',      done:true  },
    { day:7,  reward:'500 EZZI + WL',     done:true  },
    { day:14, reward:'LEGENDARY NFT',     done:false },
    { day:30, reward:'Genesis Pack',      done:false },
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{display:'flex',flexDirection:'column',flex:1,padding:'8px 16px 4px',overflowY:'auto'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}} className="grid-bg-void"/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,position:'relative',zIndex:2}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,letterSpacing:'.12em'}}>🔮 DAILY ORACLE</div>
        <div className="badge badge-void">DAY {streakDay} STREAK</div>
      </div>
      {/* Prophecy card */}
      <div style={{background:'rgba(204,0,255,.04)',border:'2px solid rgba(204,0,255,.18)',borderRadius:16,padding:18,textAlign:'center',marginBottom:9,position:'relative',zIndex:2}}>
        <div style={{fontSize:13,color:'rgba(204,0,255,.65)',marginBottom:9,letterSpacing:'.08em'}}>🌟 THE ORACLE SPEAKS</div>
        <div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,color:'#cc00ff',letterSpacing:'.06em',lineHeight:1.4,marginBottom:7}}>
          {prophecy.arabic}
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,.45)',fontStyle:'italic',marginBottom:12}}>
          {prophecy.english}
        </div>
        <div style={{background:'rgba(255,215,0,.06)',border:'1px solid rgba(255,215,0,.15)',borderRadius:10,padding:10}}>
          <div style={{fontSize:8,color:'rgba(255,215,0,.5)',letterSpacing:'.1em',marginBottom:4}}>PROPHECY REVEALS</div>
          <div style={{fontFamily:'var(--font-display)',fontSize:14,color:'#ffd700'}}>
            {revealed ? prophecy.event : '??? Tap to reveal ???'}
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:10,position:'relative',zIndex:2}}>
        <button onClick={() => { setRevealed(true); haptic(); }}
          style={{background:'rgba(204,0,255,.08)',border:'1px solid rgba(204,0,255,.25)',borderRadius:12,padding:11,cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:9,color:'#cc00ff',letterSpacing:'.06em'}}>
          🔮 REVEAL EVENT
        </button>
        <button onClick={() => { setPropIdx(i=>(i+1)%PROPHÉCIÉS.length); setRevealed(false); haptic(); }}
          style={{background:'rgba(255,215,0,.06)',border:'1px solid rgba(255,215,0,.18)',borderRadius:12,padding:11,cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:9,color:'#ffd700',letterSpacing:'.06em'}}>
          ⚡ NEXT PROPHECY
        </button>
      </div>
      {/* Streak rewards */}
      <div style={{position:'relative',zIndex:2}}>
        <div className="section-label">STREAK REWARDS</div>
        {STREAK_REWARDS.map(s => (
          <div key={s.day} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:s.done?'#00ff9f':'rgba(255,255,255,.12)',flexShrink:0,boxShadow:s.done?'0 0 6px #00ff9f':undefined}}/>
            <span style={{flex:1,fontSize:11,fontWeight:700,color:s.done?'rgba(255,255,255,.8)':'rgba(255,255,255,.3)'}}>Day {s.day}</span>
            <span style={{fontSize:9,color:s.done?'var(--gold)':'rgba(255,255,255,.25)'}}>{s.reward}</span>
            {s.done && <span style={{fontSize:8,background:'rgba(0,255,159,.1)',border:'1px solid rgba(0,255,159,.2)',borderRadius:5,padding:'1px 6px',color:'#00ff9f'}}>DONE</span>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 3 — WAR GUILD
   Collective boss raids. Damage = EZZI spent. Kill = pool share.
   ───────────────────────────────────────────────────────────────── */
function WarGuild({ balance, setBalance }: { balance:number; setBalance:React.Dispatch<React.SetStateAction<number>> }) {
  const [bossHp, setBossHp] = useState(68);
  const [myDmg, setMyDmg]   = useState(0);
  const [feedItems, setFeedItems] = useState([
    { w:'KRONOS #007', dmg:847, col:'#cc00ff' },
    { w:'SOLARIS #14', dmg:632, col:'#ff3300' },
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      setBossHp(h => Math.max(0, h - 0.2));
      const w = WARRIORS[Math.floor(Math.random()*WARRIORS.length)];
      const n = Math.floor(Math.random()*100)+1;
      const dmg = Math.floor(Math.random()*900)+100;
      const cols=['#cc00ff','#ff3300','#00d4ff','#ff8c00','#00ff9f'];
      const col = cols[Math.floor(Math.random()*cols.length)];
      setFeedItems(f=>[{w:`${w.name} #${String(n).padStart(3,'0')}`,dmg,col},...f].slice(0,4));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const attack = () => {
    if (balance < 500) return;
    const dmg = Math.floor(500+Math.random()*2000);
    setBalance((b: number)=>b-500);
    setMyDmg(d=>d+dmg);
    setBossHp(h=>Math.max(0,h-dmg/68000*100));
    haptic('impact');
  };

  const LEADERBOARD = [
    { name:'VoidKing',  dmg:'847K', share:'18%', col:'#ffd700' },
    { name:'CryptoAxe', dmg:'634K', share:'14%', col:'#c0c0c0' },
    { name:'YOU',       dmg:`${(myDmg/1000).toFixed(1)}K`, share:`${Math.max(1,Math.floor(myDmg/47000))}%`, col:'#00d4ff' },
    { name:'DesertLord',dmg:'289K', share:'6%',  col:'rgba(255,255,255,.5)' },
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{display:'flex',flexDirection:'column',flex:1,padding:'8px 16px 4px',overflowY:'auto'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}} className="grid-bg-fire"/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,position:'relative',zIndex:2}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,letterSpacing:'.12em'}}>⚔ WAR GUILD</div>
        <div style={{background:'rgba(255,60,0,.08)',border:'1px solid rgba(255,60,0,.2)',borderRadius:20,padding:'3px 10px',fontSize:8,color:'#ff6600'}}>SEASON 1</div>
      </div>
      {/* Boss card */}
      <div className="boss-card" style={{marginBottom:8,position:'relative',zIndex:2}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:12,color:'#ff4400',letterSpacing:'.1em'}}>💀 ETERNAL TITAN — BOSS RAID</div>
          <div style={{fontFamily:'var(--font-display)',fontSize:13,color:'#ff6600'}}>{bossHp.toFixed(1)}% HP</div>
        </div>
        <div className="hp-track">
          <div className="hp-fill" style={{width:`${bossHp}%`}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:8,color:'rgba(255,255,255,.25)',marginTop:6}}>
          <span>2,847 warriors attacking</span>
          <span>02:14:33 remaining</span>
        </div>
        <div style={{marginTop:8,background:'rgba(255,215,0,.05)',border:'1px solid rgba(255,215,0,.12)',borderRadius:10,padding:'7px 11px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:9,color:'rgba(255,215,0,.6)'}}>KILL REWARD POOL</span>
          <span style={{fontFamily:'var(--font-display)',fontSize:16,color:'#ffd700',fontWeight:700}}>500,000 EZZI</span>
        </div>
      </div>
      {/* Attack */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:8,position:'relative',zIndex:2}}>
        <button onClick={attack}
          style={{background:'rgba(255,60,0,.08)',border:'2px solid rgba(255,60,0,.3)',borderRadius:12,padding:'12px 8px',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:14,color:'#ff4400',letterSpacing:'.08em',fontWeight:700}}>
          ⚔ ATTACK<br/><span style={{fontSize:10}}>−500 EZZI</span>
        </button>
        <div style={{background:'rgba(0,212,255,.03)',border:'1px solid rgba(0,212,255,.12)',borderRadius:12,padding:10,textAlign:'center'}}>
          <div style={{fontSize:8,color:'rgba(255,255,255,.28)',letterSpacing:'.1em',marginBottom:3}}>MY TOTAL DAMAGE</div>
          <div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,color:'#00d4ff'}}>{myDmg.toLocaleString()}</div>
        </div>
      </div>
      {/* Live feed */}
      <div style={{marginBottom:9,position:'relative',zIndex:2}}>
        <div className="section-label">LIVE ATTACKS</div>
        <AnimatePresence initial={false}>
          {feedItems.map((item,i) => (
            <motion.div key={`${item.w}-${i}`} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
              style={{display:'flex',alignItems:'center',gap:7,padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,.04)',fontSize:9,color:'rgba(255,255,255,.45)'}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:item.col,flexShrink:0}}/>
              <span style={{flex:1}}>{item.w} → Titan</span>
              <span style={{color:'#ff6600',fontWeight:700}}>-{item.dmg.toLocaleString()}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Leaderboard */}
      <div style={{position:'relative',zIndex:2}}>
        <div className="section-label">DAMAGE LEADERBOARD</div>
        {LEADERBOARD.map((r,i) => (
          <div key={r.name} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:700,color:r.col,width:24,textAlign:'center'}}>
              {i===0?'🥇':i===1?'🥈':i===2?'⚡':i+1}
            </div>
            <span style={{flex:1,fontFamily:'var(--font-display)',fontSize:12,fontWeight:700,color:r.col}}>{r.name}</span>
            <span style={{fontSize:9,color:'rgba(255,255,255,.4)',marginRight:8}}>{r.dmg}</span>
            <div style={{background:'rgba(255,215,0,.08)',border:'1px solid rgba(255,215,0,.15)',borderRadius:6,padding:'2px 7px',fontSize:8,color:'var(--gold)'}}>{r.share} pool</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 4 — SANCTUM (Personal Base)
   Upgrade buildings with EZZI. Each building boosts game stats.
   ───────────────────────────────────────────────────────────────── */
function Sanctum({ balance, setBalance }: { balance:number; setBalance:React.Dispatch<React.SetStateAction<number>> }) {
  const [buildings, setBuildings] = useState([
    { name:'RESONANCE FORGE',     level:3, maxLevel:10, bonus:'+2.4/tap',  cost:5000,  pct:30,  col:'#ffd700', desc:'Boosts mining multiplier per tap' },
    { name:'PRECISION RESONATOR', level:2, maxLevel:10, bonus:'ZONE +15%', cost:3000,  pct:20,  col:'#00d4ff', desc:'Widens the perfect-tap zone' },
    { name:'ANCIENT ORACLE',      level:2, maxLevel:5,  bonus:'+1 event',  cost:2500,  pct:40,  col:'#cc00ff', desc:'Reveals more prophecy events' },
    { name:'EZZI GARDEN',         level:1, maxLevel:10, bonus:'+0.8/s',    cost:8000,  pct:10,  col:'#00ff9f', desc:'Passive income while app is closed' },
  ]);

  const upgrade = (idx:number) => {
    const b = buildings[idx];
    if (balance < b.cost || b.level >= b.maxLevel) return;
    setBalance((bl: number) => bl - b.cost);
    setBuildings(prev => prev.map((bd,i) => i===idx
      ? {...bd, level:bd.level+1, cost:Math.floor(bd.cost*1.8), pct:Math.min(100,bd.pct+10)}
      : bd
    ));
    haptic('success');
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{display:'flex',flexDirection:'column',flex:1,padding:'8px 16px 4px',overflowY:'auto'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}} className="grid-bg-gold"/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,position:'relative',zIndex:2}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,letterSpacing:'.12em'}}>🏛 YOUR SANCTUM</div>
        <div className="badge badge-gold">LVL 3 FORGE</div>
      </div>
      {/* Visual map */}
      <div style={{width:'100%',height:150,background:'linear-gradient(180deg,rgba(0,0,20,.8),rgba(0,20,40,.6))',borderRadius:16,border:'1px solid rgba(255,215,0,.12)',overflow:'hidden',marginBottom:10,position:'relative',zIndex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:12,flexWrap:'wrap',padding:12}}>
        {[{icon:'⚡',lbl:'FORGE',col:'rgba(255,215,0,.15)'},{icon:'🎯',lbl:'RESONATOR',col:'rgba(0,212,255,.12)'},{icon:'🔮',lbl:'ORACLE',col:'rgba(204,0,255,.12)'},{icon:'🌱',lbl:'GARDEN',col:'rgba(0,255,159,.1)'}].map(b=>(
          <div key={b.lbl} style={{width:56,height:56,borderRadius:10,background:b.col,border:'1px solid rgba(255,215,0,.15)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2}}>
            <span style={{fontSize:18}}>{b.icon}</span>
            <span style={{fontSize:7,color:'rgba(255,215,0,.6)',letterSpacing:'.04em'}}>{b.lbl}</span>
          </div>
        ))}
        <div style={{position:'absolute',top:8,right:10,fontSize:8,color:'rgba(255,255,255,.25)'}}>TAP BUILDING TO UPGRADE</div>
      </div>
      {/* Buildings */}
      {buildings.map((b,i) => (
        <div key={b.name} className="building-card">
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
              <span style={{fontFamily:'var(--font-display)',fontSize:12,fontWeight:700,color:b.col}}>{b.name}</span>
              <span style={{fontSize:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:5,padding:'1px 5px',color:'rgba(255,255,255,.5)'}}>Lv.{b.level}/{b.maxLevel}</span>
            </div>
            <div style={{fontSize:9,color:'rgba(255,255,255,.35)',marginBottom:5}}>{b.desc}</div>
            <div style={{background:'rgba(255,255,255,.05)',borderRadius:3,height:4,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${b.pct}%`,background:b.col,borderRadius:3}}/>
            </div>
          </div>
          <div style={{textAlign:'right',marginLeft:10}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:13,color:b.col,marginBottom:4}}>{b.bonus}</div>
            <button onClick={() => upgrade(i)}
              style={{background:balance>=b.cost?'rgba(255,215,0,.08)':'rgba(255,255,255,.04)',border:`1px solid ${balance>=b.cost?'rgba(255,215,0,.2)':'rgba(255,255,255,.1)'}`,borderRadius:8,padding:'4px 10px',fontSize:8,color:balance>=b.cost?'#ffd700':'rgba(255,255,255,.3)',cursor:balance>=b.cost?'pointer':'not-allowed',fontFamily:'var(--font-mono)'}}>
              {b.level>=b.maxLevel?'MAX':b.cost.toLocaleString()+' EZZI'}
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 5 — STAKING VAULT
   Lock EZZI for 30/60/90 days. Earn APY. Get perks.
   ───────────────────────────────────────────────────────────────── */
function StakingVault({ balance, setBalance }: { balance:number; setBalance:React.Dispatch<React.SetStateAction<number>> }) {
  const [lockDays, setLockDays] = useState<30|60|90>(30);
  const [amount, setAmount]     = useState(5000);
  const [staked, setStaked]     = useState(false);

  const APY = { 30:45, 60:75, 90:120 } as const;
  const apy = APY[lockDays];
  const daily  = amount * apy/100 / 365;
  const total  = amount * (1 + apy/100 * lockDays/365);

  const confirmStake = () => {
    if (balance < amount) return;
    setBalance((b: number)=>b-amount);
    setStaked(true);
    haptic('success');
  };

  const PERKS = [
    { icon:'🔒', label:'Genesis Holder NFT bonus',    bonus:'+3% all commissions'    },
    { icon:'🎯', label:'Whitelist priority',            bonus:'Phase 1 guaranteed'     },
    { icon:'⚔',  label:'War Guild damage boost',       bonus:'+25% attack power'      },
    { icon:'🌟', label:'Exclusive Mythic capsule drops',bonus:'Stakers only'           },
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{display:'flex',flexDirection:'column',flex:1,padding:'8px 16px 4px',overflowY:'auto'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}} className="grid-bg-gold"/>
      <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,letterSpacing:'.12em',marginBottom:9,position:'relative',zIndex:2}}>
        💎 EZZI STAKING VAULT
      </div>
      {/* Hero card */}
      <div className="wallet-hero" style={{marginBottom:9,position:'relative',zIndex:2}}>
        <div className="section-label" style={{marginBottom:4}}>AMOUNT TO STAKE</div>
        <div style={{fontFamily:'var(--font-display)',fontSize:36,fontWeight:700,color:'var(--gold)',lineHeight:1}}>
          {amount.toLocaleString()}
        </div>
        <div style={{fontSize:9,color:'rgba(255,215,0,.35)',letterSpacing:'.1em',marginTop:1}}>EZZI TOKENS</div>
        <div style={{display:'flex',gap:9,marginTop:12}}>
          {[{l:'DAILY',v:`+${Math.floor(daily)}`,c:'#00ff9f'},{l:'TOTAL RETURN',v:Math.floor(total).toLocaleString(),c:'#00d4ff'},{l:'APY',v:`${apy}%`,c:'#ff00c8'}].map(s=>(
            <div key={s.l} style={{flex:1,background:`rgba(${s.c==='#00ff9f'?'0,255,159':s.c==='#00d4ff'?'0,212,255':'255,0,200'},.07)`,border:`1px solid rgba(${s.c==='#00ff9f'?'0,255,159':s.c==='#00d4ff'?'0,212,255':'255,0,200'},.15)`,borderRadius:9,padding:7,textAlign:'center'}}>
              <div style={{fontSize:8,color:s.c,opacity:.6,letterSpacing:'.1em',marginBottom:2}}>{s.l}</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:16,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Lock period */}
      <div style={{marginBottom:9,position:'relative',zIndex:2}}>
        <div className="section-label">LOCK PERIOD</div>
        <div style={{display:'flex',gap:6}}>
          {([30,60,90] as const).map(d=>(
            <button key={d} className="stake-tier"
              onClick={()=>setLockDays(d)}
              style={{borderColor:d===lockDays?'rgba(255,215,0,.35)':'rgba(255,255,255,.08)',background:d===lockDays?'rgba(255,215,0,.08)':'transparent',color:d===lockDays?'var(--gold)':'rgba(255,255,255,.4)'}}>
              <div style={{fontSize:14,fontWeight:700}}>{d}D</div>
              <div style={{fontSize:9,opacity:.7}}>{APY[d]}% APY</div>
            </button>
          ))}
        </div>
      </div>
      {/* Amount slider */}
      <div style={{marginBottom:9,position:'relative',zIndex:2}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:8,color:'rgba(255,255,255,.28)',letterSpacing:'.1em',marginBottom:5}}>
          <span>AMOUNT</span><span style={{color:'var(--gold)'}}>{amount.toLocaleString()} EZZI</span>
        </div>
        <input type="range" min={1000} max={Math.max(10000,Math.floor(balance))} step={500}
          value={amount} onChange={e=>setAmount(+e.target.value)} style={{width:'100%'}}/>
      </div>
      <button onClick={confirmStake}
        style={{width:'100%',padding:13,background:staked?'rgba(0,255,159,.1)':'rgba(255,215,0,.1)',border:`2px solid ${staked?'rgba(0,255,159,.3)':'rgba(255,215,0,.3)'}`,borderRadius:13,cursor:'pointer',fontFamily:'var(--font-display)',fontSize:15,fontWeight:700,color:staked?'#00ff9f':'var(--gold)',letterSpacing:'.1em',marginBottom:10,position:'relative',zIndex:2}}>
        {staked?'✅ STAKED SUCCESSFULLY':`⚡ STAKE ${amount.toLocaleString()} EZZI`}
      </button>
      {/* Perks */}
      <div style={{position:'relative',zIndex:2}}>
        <div className="section-label">STAKING PERKS</div>
        {PERKS.map(p=>(
          <div key={p.label} style={{display:'flex',alignItems:'center',gap:9,padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
            <span style={{fontSize:16}}>{p.icon}</span>
            <span style={{flex:1,fontSize:10,color:'rgba(255,255,255,.55)'}}>{p.label}</span>
            <span style={{fontSize:9,color:'var(--gold)'}}>{p.bonus}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 6 — ANCIENT BAZAAR
   P2P marketplace. Users buy/sell relics and fragments.
   ───────────────────────────────────────────────────────────────── */
function AncientBazaar({ balance, setBalance }: { balance:number; setBalance:React.Dispatch<React.SetStateAction<number>> }) {
  const [filter, setFilter] = useState<'ALL'|'MYTHIC'|'LEGENDARY'|'EPIC'>('ALL');

  const RELICS = [
    { name:'VOID ORB',       type:'Relic',    rarity:'MYTHIC',    price:8500,  icon:'🔮', bonus:'+50% Void zone mining',    seller:'VoidKing'   },
    { name:'KRONOS SHARD',   type:'Fragment', rarity:'LEGENDARY', price:3200,  icon:'⚡', bonus:'Resonance window +30%',     seller:'TimeLord'   },
    { name:'ATLAS TOME',     type:'Scroll',   rarity:'EPIC',      price:1800,  icon:'📜', bonus:'Sanctum build cost -20%',  seller:'Builder99'  },
    { name:'GENESIS KEY',    type:'Access',   rarity:'LEGENDARY', price:12000, icon:'🗝', bonus:'Genesis capsule guaranteed',seller:'GrandMaster'},
    { name:'FLAME ESSENCE',  type:'Relic',    rarity:'EPIC',      price:2400,  icon:'🔥', bonus:'+40% Guild attack power',  seller:'FireKing'   },
    { name:'STAR MAP',       type:'Scroll',   rarity:'MYTHIC',    price:15000, icon:'🌌', bonus:'Reveal all zone bonuses',  seller:'Cosmos'     },
  ];

  const filtered = RELICS.filter(r => filter==='ALL' || r.rarity===filter);

  const buyRelic = (price:number) => {
    if (balance < price) return;
    setBalance((b: number)=>b-price);
    haptic('success');
  };

  const RARITY_BORDER: Record<string,string> = {
    MYTHIC:'rgba(255,0,200,.2)', LEGENDARY:'rgba(255,215,0,.2)', EPIC:'rgba(180,77,255,.15)'
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{display:'flex',flexDirection:'column',flex:1,padding:'8px 16px 4px',overflowY:'auto'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}} className="grid-bg-gold"/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,position:'relative',zIndex:2}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,letterSpacing:'.12em'}}>🏺 ANCIENT BAZAAR</div>
        <div className="badge badge-gold">{RELICS.length} RELICS</div>
      </div>
      {/* Filter tabs */}
      <div style={{display:'flex',gap:5,marginBottom:9,position:'relative',zIndex:2,overflowX:'auto'}}>
        {(['ALL','MYTHIC','LEGENDARY','EPIC'] as const).map(f=>(
          <div key={f} onClick={()=>setFilter(f)} style={{
            padding:'4px 11px',borderRadius:20,cursor:'pointer',whiteSpace:'nowrap',fontSize:8,letterSpacing:'.1em',
            border:`1px solid ${f===filter?'rgba(255,215,0,.3)':'rgba(255,255,255,.08)'}`,
            background:f===filter?'rgba(255,215,0,.07)':'transparent',
            color:f===filter?'var(--gold)':'rgba(255,255,255,.35)',
          }}>{f}</div>
        ))}
      </div>
      {/* Relics */}
      {filtered.map(item => (
        <div key={item.name} className="relic-card" style={{borderColor:RARITY_BORDER[item.rarity]||'rgba(255,255,255,.08)'}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:11}}>
            <div style={{width:46,height:46,borderRadius:11,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
              {item.icon}
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                <span style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,
                  color:item.rarity==='MYTHIC'?'#ff00c8':item.rarity==='LEGENDARY'?'#ffd700':'#b44dff'}}>
                  {item.name}
                </span>
                <span className={`badge badge-${item.rarity.toLowerCase()}`} style={{fontSize:7,padding:'1px 5px'}}>
                  {item.rarity}
                </span>
              </div>
              <div style={{fontSize:9,color:'rgba(0,212,255,.7)',marginBottom:2}}>{item.bonus}</div>
              <div style={{fontSize:8,color:'rgba(255,255,255,.25)'}}>by {item.seller}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,color:'var(--gold)'}}>{item.price.toLocaleString()}</div>
              <div style={{fontSize:8,color:'rgba(255,215,0,.35)',marginBottom:5}}>EZZI</div>
              <button onClick={()=>buyRelic(item.price)}
                style={{background:'rgba(255,215,0,.1)',border:'1px solid rgba(255,215,0,.25)',borderRadius:8,padding:'4px 11px',fontSize:9,color:'var(--gold)',cursor:'pointer',fontFamily:'var(--font-mono)'}}>
                BUY
              </button>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 7 — COSMOS MAP
   Interactive SVG zone map. Tap zone to see details and join.
   ───────────────────────────────────────────────────────────────── */
function CosmosMap() {
  const [selected, setSelected] = useState(0);
  const [joined,   setJoined]   = useState<string|null>(null);

  const MAP_POSITIONS = [
    { x:165, y:80,  r:42 },
    { x:255, y:140, r:38 },
    { x:55,  y:155, r:32 },
    { x:145, y:205, r:28 },
    { x:50,  y:255, r:30 },
    { x:245, y:230, r:25 },
  ];

  const zone = ZONES[selected];
  const pos  = MAP_POSITIONS[selected];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{display:'flex',flexDirection:'column',flex:1,padding:'8px 16px 4px',overflowY:'auto'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}} className="grid-bg-void"/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,position:'relative',zIndex:2}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,letterSpacing:'.12em'}}>🌌 COSMOS MAP</div>
        <div style={{fontSize:8,color:'rgba(255,255,255,.3)',letterSpacing:'.1em'}}>TAP ZONE TO EXPLORE</div>
      </div>
      {/* SVG Map */}
      <div style={{width:'100%',height:310,background:'rgba(0,0,20,.85)',borderRadius:16,border:'1px solid rgba(255,255,255,.06)',overflow:'hidden',marginBottom:9,position:'relative',zIndex:2}}>
        <svg width="100%" height="310" viewBox="0 0 320 310">
          <defs>
            {ZONES.map((_,i)=>(
              <radialGradient key={i} id={`zg${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={ZONES[i].color} stopOpacity=".2"/>
                <stop offset="100%" stopColor={ZONES[i].color} stopOpacity="0"/>
              </radialGradient>
            ))}
          </defs>
          {/* Stars */}
          {Array.from({length:70},(_,i)=>(
            <circle key={i} cx={Math.sin(i*137.508)*150+160} cy={Math.cos(i*137.508)*140+155}
              r={.4+Math.sin(i*0.7)*.8} fill={`rgba(255,255,255,${.1+Math.abs(Math.sin(i*.4))*.4})`}
              style={{animation:`starBlink ${2+i%3}s ${i*.1}s ease infinite`}}/>
          ))}
          {/* Connection lines */}
          {MAP_POSITIONS.map((a,i)=>MAP_POSITIONS.slice(i+1).map((b,j)=>(
            <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(255,255,255,.04)" strokeWidth=".5"/>
          )))}
          {/* Zone circles */}
          {ZONES.map((z,i)=>{
            const p=MAP_POSITIONS[i];
            return (
              <g key={z.id} onClick={()=>setSelected(i)} style={{cursor:'pointer'}}>
                <circle cx={p.x} cy={p.y} r={p.r+15} fill={`url(#zg${i})`}/>
                <circle cx={p.x} cy={p.y} r={p.r} fill={z.color} fillOpacity={selected===i?.18:.08}
                  stroke={z.color} strokeWidth={selected===i?2.5:1} strokeOpacity={selected===i?1:.4}/>
                <text x={p.x} y={p.y-3} textAnchor="middle"
                  fontFamily="Rajdhani,sans-serif" fontSize={selected===i?10:9} fontWeight="700"
                  fill={z.color} fillOpacity={selected===i?1:.6}>{z.name}</text>
                <text x={p.x} y={p.y+11} textAnchor="middle" fontSize="8"
                  fill={z.color} fillOpacity=".5">{z.warriors}W</text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* Zone detail */}
      <div style={{background:`${zone.color}08`,border:`1px solid ${zone.color}2e`,borderRadius:14,padding:13,marginBottom:9,position:'relative',zIndex:2}}>
        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:zone.color,boxShadow:`0 0 8px ${zone.color}`,flexShrink:0}}/>
          <div style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,color:zone.color,letterSpacing:'.1em',flex:1}}>{zone.name}</div>
          <div style={{fontSize:9,color:'rgba(255,255,255,.35)'}}>{zone.description.slice(0,28)}...</div>
        </div>
        <div style={{display:'flex',gap:7,marginBottom:9}}>
          {[{l:'WARRIORS',v:zone.warriors},{l:'POWER',v:`${zone.pct}%`},{l:'MINING',v:zone.bonus}].map(s=>(
            <div key={s.l} style={{flex:1,background:'rgba(255,255,255,.04)',borderRadius:9,padding:8,textAlign:'center'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:zone.color}}>{s.v}</div>
              <div style={{fontSize:7,color:'rgba(255,255,255,.28)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <button onClick={()=>{setJoined(zone.id);haptic('success');}}
          style={{width:'100%',padding:11,background:joined===zone.id?'rgba(0,255,159,.08)':'rgba(255,255,255,.05)',border:`1px solid ${joined===zone.id?'rgba(0,255,159,.25)':'rgba(255,255,255,.12)'}`,borderRadius:11,cursor:'pointer',fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:joined===zone.id?'#00ff9f':zone.color,letterSpacing:'.08em'}}>
          {joined===zone.id?`✅ JOINED ${zone.name}`:`⚔ JOIN ${zone.name}`}
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CAPSULES (Standalone component, used from any screen)
   Cinematic reveal with 3-phase animation and gold rain for Mythic.
   ───────────────────────────────────────────────────────────────── */
function CapsuleReveal({ onClose, rarity, warrior }: { onClose:()=>void; rarity:string; warrior:string }) {
  const [phase, setPhase] = useState(0);
  const color = RARITY_COLORS[rarity] || '#fff';
  const PHASES = ['OPENING...','REVEALING...','⚡ FOUND!'];

  useEffect(()=>{
    const timers = PHASES.map((_,i)=>setTimeout(()=>setPhase(i),i*800));
    return ()=>timers.forEach(t=>clearTimeout(t));
  },[]);

  return (
    <div className="reveal-overlay visible">
      {rarity==='MYTHIC' && (
        <div className="gold-rain">
          {Array.from({length:25},(_,i)=>(
            <div key={i} className="gold-particle" style={{
              left:`${Math.random()*100}%`,
              ['--dur' as string]:`${1+Math.random()*2}s`,
              ['--delay' as string]:`${Math.random()*2.5}s`,
            } as React.CSSProperties}/>
          ))}
        </div>
      )}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{fontSize:11,color:'rgba(255,255,255,.35)',letterSpacing:'.2em'}}>
        {PHASES[Math.min(phase,PHASES.length-1)]}
      </motion.div>
      <motion.div
        initial={{scale:.8,filter:'blur(16px)',opacity:0}}
        animate={{scale:1,filter:'blur(0px)',opacity:1}}
        transition={{delay:1.2,duration:0.6}}
        style={{width:188,height:248,borderRadius:20,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,border:`2px solid ${color}`,background:`linear-gradient(145deg,${color}12,${color}06)`,boxShadow:`0 0 40px ${color}30`}}
      >
        <span style={{fontSize:58}}>{RARITY_ICONS[rarity]||'⚡'}</span>
        <span style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:700,color,letterSpacing:'.12em'}}>{warrior}</span>
        <span style={{fontSize:9,letterSpacing:'.25em',color,opacity:.7}}>✦ {rarity} ✦</span>
      </motion.div>
      <button onClick={onClose}
        style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'9px 24px',fontSize:11,color:'rgba(255,255,255,.65)',cursor:'pointer',fontFamily:'var(--font-mono)'}}>
        CLAIM WARRIOR
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LOADING SCREEN
   ───────────────────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',flexDirection:'column',gap:16}}>
      <motion.div animate={{rotate:360}} transition={{duration:1.8,repeat:Infinity,ease:'linear'}}>
        <EzziLogo size={52}/>
      </motion.div>
      <div style={{fontFamily:'var(--font-display)',fontSize:14,color:'rgba(255,215,0,.5)',letterSpacing:'.25em'}}>
        INITIALIZING...
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN APP
   ───────────────────────────────────────────────────────────────── */
export default function EzziWorldApp() {
  const [screen,  setScreen]  = useState<ScreenId>('forge');
  const [user,    setUser]    = useState<TGUser|null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reveal,  setReveal]  = useState<{show:boolean;rarity:string;warrior:string}>({show:false,rarity:'',warrior:''});

  const GRID_CLASS: Record<ScreenId,string> = {
    forge:'grid-bg-cyan', oracle:'grid-bg-void', guild:'grid-bg-fire',
    sanctum:'grid-bg-gold', staking:'grid-bg-gold', bazaar:'grid-bg-gold', cosmos:'grid-bg-void',
  };

  // Telegram WebApp init
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      document.body.style.backgroundColor = '#02020a';
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
        authUser(tgUser);
        return;
      }
    }
    setLoading(false);
  }, []);

  const authUser = async (tgUser: TGUser) => {
    try {
      const res = await fetch(`${API}/telegram/auth`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          telegramId:tgUser.id.toString(), username:tgUser.username,
          firstName:tgUser.first_name, photoUrl:tgUser.photo_url,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setBalance(data.data?.balance || 0);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingScreen/>;

  const sharedProps = { balance, setBalance };

  return (
    <div style={{maxWidth:430,margin:'0 auto',minHeight:'100vh',display:'flex',flexDirection:'column',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
      {/* Grid background */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}} className={GRID_CLASS[screen]}/>

      {/* Capsule reveal overlay */}
      {reveal.show && (
        <CapsuleReveal
          rarity={reveal.rarity} warrior={reveal.warrior}
          onClose={()=>setReveal({show:false,rarity:'',warrior:''})}/>
      )}

      <AppHeader user={user} balance={balance}/>

      <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
        <AnimatePresence mode="wait">
          {screen==='forge'   && <ResonanceForge key="forge"   {...sharedProps}/>}
          {screen==='oracle'  && <OracleProphecy key="oracle"/>}
          {screen==='guild'   && <WarGuild       key="guild"   {...sharedProps}/>}
          {screen==='sanctum' && <Sanctum        key="sanctum" {...sharedProps}/>}
          {screen==='staking' && <StakingVault   key="staking" {...sharedProps}/>}
          {screen==='bazaar'  && <AncientBazaar  key="bazaar"  {...sharedProps}/>}
          {screen==='cosmos'  && <CosmosMap      key="cosmos"/>}
        </AnimatePresence>
      </main>

      <BottomNav active={screen} onChange={setScreen}/>
    </div>
  );
}

/**
 * ULTRA AAA Animation System
 * GSAP + Custom 2.5D Effects
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ============================================
// 2.5D Card Tilt Effect
// ============================================

export function initCardTilt(element: HTMLElement) {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / centerY * -15;
    const rotateY = (x - centerX) / centerX * 15;

    gsap.to(element, {
      rotateX: rotateX,
      rotateY: rotateY,
      transformPerspective: 1000,
      duration: 0.3,
      ease: 'power2.out',
    });

    // Shine effect
    const shine = element.querySelector('.card-shine') as HTMLElement;
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.3) 0%, transparent 60%)`;
    }
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    });
  };

  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
}

// ============================================
// Stagger Reveal Animation
// ============================================

export function staggerReveal(selector: string, options?: { delay?: number }) {
  const elements = document.querySelectorAll(selector);

  gsap.fromTo(elements,
    {
      y: 60,
      opacity: 0,
      scale: 0.95,
    },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      delay: options?.delay || 0,
    }
  );
}

// ============================================
// Scroll Reveal with Parallax
// ============================================

export function scrollReveal(element: HTMLElement, options?: { y?: number; delay?: number }) {
  if (typeof window === 'undefined') return;

  gsap.fromTo(element,
    {
      y: options?.y || 80,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
      delay: options?.delay || 0,
    }
  );
}

// ============================================
// Premium Button Hover
// ============================================

export function buttonHover(element: HTMLElement) {
  element.addEventListener('mouseenter', () => {
    gsap.to(element, {
      scale: 1.05,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  element.addEventListener('mousedown', () => {
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
    });
  });

  element.addEventListener('mouseup', () => {
    gsap.to(element, {
      scale: 1.05,
      duration: 0.2,
      ease: 'elastic.out(1, 0.5)',
    });
  });
}

// ============================================
// Text Reveal Animation
// ============================================

export function textReveal(element: HTMLElement) {
  const text = element.textContent || '';
  element.innerHTML = text.split('').map(char =>
    `<span class="char" style="display: inline-block; opacity: 0; transform: translateY(50px)">${char === ' ' ? '&nbsp;' : char}</span>`
  ).join('');

  const chars = element.querySelectorAll('.char');

  gsap.to(chars, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.03,
    ease: 'power3.out',
  });
}

// ============================================
// Pulse Glow Effect
// ============================================

export function pulseGlow(element: HTMLElement, color: string = '#00d4ff') {
  gsap.to(element, {
    boxShadow: `0 0 30px ${color}40, 0 0 60px ${color}20`,
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut',
  });
}

// ============================================
// Counter Animation
// ============================================

export function animateCounter(element: HTMLElement, target: number, duration: number = 2) {
  const obj = { value: 0 };

  gsap.to(obj, {
    value: target,
    duration: duration,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent = Math.floor(obj.value).toLocaleString();
    },
  });
}

// ============================================
// Cinematic Entrance
// ============================================

export function cinematicEntrance() {
  const tl = gsap.timeline();

  tl.fromTo('.hero-title',
    { y: 100, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
  )
  .fromTo('.hero-subtitle',
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
    '-=0.6'
  )
  .fromTo('.hero-cta',
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
    '-=0.4'
  );

  return tl;
}

// ============================================
// Capsule Opening Animation Sequence
// ============================================

export function capsuleOpeningSequence(element: HTMLElement) {
  const tl = gsap.timeline();

  // Phase 1: Float and glow
  tl.to(element, {
    scale: 1.1,
    boxShadow: '0 0 60px rgba(0, 212, 255, 0.5)',
    duration: 0.5,
    ease: 'power2.out',
  })
  // Phase 2: Vibrate
  .to(element, {
    x: 'random(-5, 5)',
    y: 'random(-5, 5)',
    duration: 0.1,
    repeat: 8,
    ease: 'none',
  })
  // Phase 3: Explosion
  .to(element, {
    scale: 2,
    opacity: 0,
    duration: 0.3,
    ease: 'power4.in',
  });

  return tl;
}

// ============================================
// NFT Reveal Animation
// ============================================

export function nftReveal(element: HTMLElement, rarity: string) {
  const colors: Record<string, string> = {
    common: '#8a9bb0',
    rare: '#4d9fff',
    epic: '#b44dff',
    legendary: '#ffd700',
    mythic: '#ff00ff',
  };

  const color = colors[rarity] || colors.common;

  const tl = gsap.timeline();

  tl.fromTo(element,
    {
      scale: 0,
      opacity: 0,
      rotateY: -180,
    },
    {
      scale: 1,
      opacity: 1,
      rotateY: 0,
      duration: 1,
      ease: 'elastic.out(1, 0.5)',
    }
  )
  .to(element, {
    boxShadow: `0 0 50px ${color}60`,
    duration: 0.5,
    repeat: 3,
    yoyo: true,
  }, '-=0.5');

  return tl;
}

// ============================================
// Parallax Background
// ============================================

export function initParallax(container: HTMLElement) {
  if (typeof window === 'undefined') return;

  const layers = container.querySelectorAll('.parallax-layer');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    layers.forEach((layer, index) => {
      const speed = (index + 1) * 0.2;
      gsap.to(layer, {
        y: scrollY * speed,
        duration: 0.3,
        ease: 'none',
      });
    });
  });
}

// ============================================
// Magnetic Button Effect
// ============================================

export function magneticButton(element: HTMLElement) {
  const strength = 30;

  element.addEventListener('mousemove', (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(element, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    });
  });
}

// ============================================
// Smooth Scroll
// ============================================

export function smoothScrollTo(target: string | number) {
  if (typeof window === 'undefined') return;

  gsap.to(window, {
    scrollTo: { y: target, autoKill: false },
    duration: 1.2,
    ease: 'power3.inOut',
  });
}

// ============================================
// Loading Sequence
// ============================================

export function loadingSequence(onComplete?: () => void) {
  const tl = gsap.timeline({ onComplete });

  tl.to('.loading-bar', {
    width: '100%',
    duration: 2,
    ease: 'power2.inOut',
  })
  .to('.loading-screen', {
    y: '-100%',
    duration: 0.8,
    ease: 'power3.inOut',
  });

  return tl;
}

export { gsap, ScrollTrigger };

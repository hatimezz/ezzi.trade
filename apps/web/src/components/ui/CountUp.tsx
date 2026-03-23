'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function CountUp({
  end,
  start = 0,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const [value, setValue] = useState(start);
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
            const easedProgress = easeOutExpo(progress);
            const current = start + (end - start) * easedProgress;
            setValue(current);
            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, start, duration]);

  return (
    <span ref={ref} className={cn('font-mono font-bold tabular-nums', className)}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
}

export { CountUp };
export type { CountUpProps };

'use client';

import { useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TickerProps {
  children: ReactNode;
  speed?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  className?: string;
}

function Ticker({ children, speed = 40, direction = 'left', pauseOnHover = true, className }: TickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const innerEl = innerRef.current;
    if (!scrollEl || !innerEl) return;

    let animationId: number;
    let position = 0;
    const contentWidth = innerEl.scrollWidth / 2;

    function animate() {
      if (direction === 'left') {
        position -= speed / 60;
        if (position <= -contentWidth) position = 0;
      } else {
        position += speed / 60;
        if (position >= 0) position = -contentWidth;
      }
      if (innerEl) {
        innerEl.style.transform = `translateX(${position}px)`;
      }
      animationId = requestAnimationFrame(animate);
    }

    if (direction === 'right') {
      position = -contentWidth;
    }

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [speed, direction]);

  return (
    <div
      ref={scrollRef}
      className={cn('overflow-hidden whitespace-nowrap', pauseOnHover && 'hover:[&>div]:pause', className)}
    >
      <div ref={innerRef} className="inline-flex">
        <div className="inline-flex items-center gap-8">{children}</div>
        <div className="inline-flex items-center gap-8">{children}</div>
      </div>
    </div>
  );
}

export { Ticker };
export type { TickerProps };

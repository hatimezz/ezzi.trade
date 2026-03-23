'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'glass' | 'gold' | 'void' | 'base';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  glass: 'card-glass',
  gold: 'card-gold',
  void: 'card-void',
  base: 'card',
};

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'glass', hover = true, padding = 'md', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          !hover && 'pointer-events-none',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
export type { CardProps, CardVariant };

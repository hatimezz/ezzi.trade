'use client';

import { cn } from '@/lib/utils';

interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
}

interface SocialLinksProps {
  links: SocialLink[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizeClasses: Record<string, string> = {
  sm: '[&_svg]:w-4 [&_svg]:h-4',
  md: '[&_svg]:w-5 [&_svg]:h-5',
  lg: '[&_svg]:w-6 [&_svg]:h-6',
};

function SocialLinks({ links, size = 'md', className }: SocialLinksProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {links.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.name}
          className={cn(
            'inline-flex items-center justify-center rounded-lg',
            'bg-white/5 border border-white/10 text-[var(--text-secondary)]',
            'hover:border-[var(--border-accent)] hover:text-[var(--ezzi)] hover:bg-[rgba(0,212,255,0.05)]',
            'transition-all duration-200',
            sizeClasses[size],
            iconSizeClasses[size]
          )}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

export { SocialLinks };
export type { SocialLinksProps, SocialLink };

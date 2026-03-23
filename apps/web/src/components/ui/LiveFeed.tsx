'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FeedItem {
  id: string;
  content: ReactNode;
  timestamp?: number;
}

interface LiveFeedProps {
  items: FeedItem[];
  maxVisible?: number;
  className?: string;
}

function LiveFeed({ items, maxVisible = 5, className }: LiveFeedProps) {
  const [visible, setVisible] = useState<FeedItem[]>([]);

  useEffect(() => {
    setVisible(items.slice(0, maxVisible));
  }, [items, maxVisible]);

  return (
    <div className={cn('space-y-2 overflow-hidden', className)}>
      <AnimatePresence initial={false}>
        {visible.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="card-glass p-3 text-sm"
          >
            {item.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export { LiveFeed };
export type { LiveFeedProps, FeedItem };

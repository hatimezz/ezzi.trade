'use client';

import { Bell, Search, Menu } from 'lucide-react';

interface AdminTopbarProps {
  title: string;
  onMenuToggle?: () => void;
}

export function AdminTopbar({ title, onMenuToggle }: AdminTopbarProps) {
  return (
    <div className="admin-topbar">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-lg font-bold font-['Rajdhani'] uppercase tracking-wider text-white">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-48"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-white/5 text-gray-400" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff6b35]" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff8c00] flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <span className="hidden md:block text-sm text-gray-300">Admin</span>
        </div>
      </div>
    </div>
  );
}

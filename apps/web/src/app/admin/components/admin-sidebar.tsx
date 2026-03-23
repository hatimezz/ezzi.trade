'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Box,
  Sword,
  Rocket,
  ShoppingCart,
  Handshake,
  BarChart3,
  ClipboardList,
  Bell,
  Settings,
  UserCog,
  ScrollText,
  LogOut,
  Shield,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/capsules', label: 'Capsules', icon: Box },
  { href: '/admin/nfts', label: 'NFTs', icon: Sword },
  { href: '/admin/presale', label: 'Presale', icon: Rocket },
  { href: '/admin/marketplace', label: 'Marketplace', icon: ShoppingCart },
  { href: '/admin/partners', label: 'Partners', icon: Handshake },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/waitlist', label: 'Waitlist', icon: ClipboardList },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/accounts', label: 'Accounts', icon: UserCog },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="p-6 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#ff8c00] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-widest text-white">
              EZZI Admin
            </h1>
            <span className="text-[10px] text-gray-500 font-mono">v1.0.0</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <Link
          href="/admin/login"
          className="admin-sidebar-link text-red-400 hover:text-red-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}

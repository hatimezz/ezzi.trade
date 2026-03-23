'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './components/admin-sidebar';
import { AdminTopbar } from './components/admin-topbar';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/capsules': 'Capsules',
  '/admin/nfts': 'NFTs',
  '/admin/presale': 'Presale',
  '/admin/marketplace': 'Marketplace',
  '/admin/partners': 'Partners',
  '/admin/analytics': 'Analytics',
  '/admin/waitlist': 'Waitlist',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'Settings',
  '/admin/accounts': 'Accounts',
  '/admin/audit-log': 'Audit Log',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLogin = pathname === '/admin/login';

  if (isLogin) {
    return (
      <div style={{ background: 'var(--admin-bg)' }} className="min-h-screen">
        {children}
      </div>
    );
  }

  const title = PAGE_TITLES[pathname] ?? 'Admin';

  return (
    <div style={{ background: 'var(--admin-bg)' }} className="min-h-screen">
      <style>{`
        body > div > nav:first-of-type { display: none !important; }
        body > div > div > main { padding-top: 0 !important; }
        .navbar { display: none !important; }
      `}</style>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar />

      <div className="md:ml-[260px] flex flex-col min-h-screen">
        <AdminTopbar
          title={title}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'EZZI World - Mine · Collect · Battle · Earn',
  description: 'The #1 Web3 gaming platform of 2026. Collect NFT warriors, mine EZZI coins, and battle for supremacy.',
  keywords: ['NFT', 'gaming', 'Web3', 'Solana', 'mining', 'EZZI'],
  authors: [{ name: 'EZZI World' }],
  openGraph: {
    title: 'EZZI World',
    description: 'Mine · Collect · Battle · Earn · Rule · Recruit',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#02020a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#02020a] text-white antialiased min-h-screen">
        <Providers>
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

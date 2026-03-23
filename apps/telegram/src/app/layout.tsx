import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'EZZI World',
  description: 'Cyber-Ancient Civilization on Solana',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#02020a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive"/>
      </head>
      <body style={{ background:'#02020a', color:'#fff', margin:0 }}>
        {children}
      </body>
    </html>
  );
}

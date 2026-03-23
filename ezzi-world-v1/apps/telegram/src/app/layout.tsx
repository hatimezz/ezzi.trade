import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EZZI World - Telegram',
  description: 'Mine EZZI coins on Telegram',
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
    <html lang="en">
      <body className="bg-[#02020a] text-white antialiased max-w-md mx-auto">
        {children}
      </body>
    </html>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, Wallet, Users, ShoppingBag, Pickaxe } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useUserBalance } from '@/hooks/use-api';

const navLinks = [
  { href: '/warriors', label: 'Warriors', icon: Users },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/mining', label: 'Mining', icon: Pickaxe },
  { href: '/capsules', label: 'Capsules', icon: Zap },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { connected, publicKey, connect, disconnect, truncateAddress, isLoading } = useWallet();
  const { data: balance } = useUserBalance();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#02020a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-[#00d4ff]" />
            <span className="text-xl font-bold font-['Rajdhani'] uppercase tracking-wider">
              EZZI <span className="text-[#00d4ff]">WORLD</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:flex items-center space-x-4">
            {connected && balance && (
              <div className="text-right mr-4">
                <p className="text-xs text-gray-400">Balance</p>
                <p className="text-sm font-bold text-[#00d4ff] font-['Space_Mono']">
                  {Math.floor(balance.ezziBalance || 0).toLocaleString()} EZZI
                </p>
              </div>
            )}

            <button
              onClick={connected ? disconnect : connect}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                connected
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  : 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/20'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>
                {isLoading
                  ? 'Connecting...'
                  : connected
                  ? truncateAddress(publicKey || '')
                  : 'Connect Wallet'}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0a1a] border-b border-white/5"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              ))}

              {connected && balance && (
                <div className="px-4 py-3 border-t border-white/10">
                  <p className="text-sm text-gray-400">Balance</p>
                  <p className="text-lg font-bold text-[#00d4ff] font-['Space_Mono']">
                    {Math.floor(balance.ezziBalance || 0).toLocaleString()} EZZI
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  connected ? disconnect() : connect();
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 mt-4 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 rounded-lg font-medium"
              >
                <Wallet className="w-5 h-5" />
                <span>
                  {isLoading
                    ? 'Connecting...'
                    : connected
                    ? truncateAddress(publicKey || '')
                    : 'Connect Wallet'}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

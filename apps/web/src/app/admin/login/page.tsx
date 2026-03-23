'use client';

import { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email === 'admin@ezzi.world' && password === 'admin') {
        window.location.href = '/admin';
      } else {
        setError('Invalid credentials');
        setLoading(false);
      }
    }, 800);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--admin-bg)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ background: '#ff6b35' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10"
          style={{ background: '#00d4ff' }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#ff8c00] mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-['Rajdhani'] uppercase tracking-widest text-white">
            EZZI Admin
          </h1>
          <p className="text-gray-500 text-sm mt-1">Secure access to mission control</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="admin-card space-y-5"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="block text-xs font-['Rajdhani'] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ezzi.world"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#ff6b35]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-['Rajdhani'] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-10 pr-12 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#ff6b35]/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn w-full bg-gradient-to-r from-[#ff6b35] to-[#ff8c00] text-white font-bold disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          EZZI World Admin Panel &middot; Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}

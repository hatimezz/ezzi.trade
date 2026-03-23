'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { useWallet } from '@/hooks/use-wallet';

export const runtime = 'nodejs';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginError {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { connect, isPhantomInstalled, connecting } = useWallet();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<LoginError>({});
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const validateForm = (): boolean => {
    const newErrors: LoginError = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setRemainingAttempts(null);

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        router.push('/dashboard');
      }
    } catch (error: any) {
      const errorData = error.response?.data;

      if (error.response?.status === 429) {
        const retryAfter = errorData?.retryAfter || 1800;
        const minutes = Math.ceil(retryAfter / 60);
        setErrors({
          general: `Too many attempts. Please try again in ${minutes} minutes.`,
        });
      } else if (error.response?.status === 401) {
        setErrors({
          general: 'Invalid email or password',
        });
        if (errorData?.remainingAttempts !== undefined) {
          setRemainingAttempts(errorData.remainingAttempts);
        }
      } else {
        setErrors({
          general: errorData?.error || 'Failed to login. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    if (!isPhantomInstalled) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await connect();
      router.push('/dashboard');
    } catch (error: any) {
      setErrors({
        general: error.message || 'Failed to connect wallet',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-page-base relative">
      {/* Background Effects */}
      <div className="bg-grid" />
      <div className="bg-scanlines" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ffd700]/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-display text-4xl font-bold text-gradient">
              EZZI WORLD
            </h1>
          </Link>
          <p className="mt-2 text-[#8892a0]">
            Welcome back, warrior
          </p>
        </div>

        {/* Login Card */}
        <div className="card-glass p-8">
          <h2 className="font-display text-2xl font-bold text-center mb-6">
            Sign In
          </h2>

          {errors.general && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <p className="text-red-400 text-sm text-center">{errors.general}</p>
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <p className="text-[#8892a0] text-xs text-center mt-1">
                  {remainingAttempts} attempts remaining
                </p>
              )}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8892a0]" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-[#0d0d1a] border rounded-lg text-white placeholder-[#4a5568] transition-colors focus:outline-none focus:border-[#00d4ff] ${
                    errors.email ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-red-400 text-xs">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8892a0]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 bg-[#0d0d1a] border rounded-lg text-white placeholder-[#4a5568] transition-colors focus:outline-none focus:border-[#00d4ff] ${
                    errors.password ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892a0] hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-red-400 text-xs">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#131326] text-[#8892a0]">Or continue with</span>
            </div>
          </div>

          {/* Wallet Connect */}
          <button
            onClick={handleWalletConnect}
            disabled={isLoading || connecting}
            className="w-full btn btn-secondary py-3 flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            {connecting
              ? 'Connecting...'
              : isPhantomInstalled
              ? 'Connect Phantom Wallet'
              : 'Install Phantom Wallet'}
          </button>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-[#8892a0] text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-[#00d4ff] hover:text-[#33e0ff] transition-colors font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

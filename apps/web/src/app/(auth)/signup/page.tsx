'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Wallet, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useWallet } from '@/hooks/use-wallet';

export const runtime = 'nodejs';

interface SignupFormData {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

interface SignupErrors {
  email?: string;
  username?: string;
  password?: string;
  displayName?: string;
  general?: string;
}

interface PasswordStrength {
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const { connect, isPhantomInstalled, connecting } = useWallet();

  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    username: '',
    password: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptTermsError, setAcceptTermsError] = useState('');

  const checkPasswordStrength = (password: string): PasswordStrength => ({
    hasLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  });

  const strength = checkPasswordStrength(formData.password);
  const strengthScore = Object.values(strength).filter(Boolean).length;

  const validateForm = (): boolean => {
    const newErrors: SignupErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (strengthScore < 3) {
      newErrors.password = 'Password is too weak';
    }

    if (!acceptTerms) {
      setAcceptTermsError('You must accept the terms and conditions');
    } else {
      setAcceptTermsError('');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && acceptTerms;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await api.post('/auth/signup', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        displayName: formData.displayName || formData.username,
      });

      if (response.data.success) {
        router.push('/dashboard');
      }
    } catch (error: any) {
      const errorData = error.response?.data;

      if (error.response?.status === 409) {
        setErrors({
          general: 'Email or username already exists',
        });
      } else if (error.response?.status === 400) {
        setErrors({
          general: errorData?.error || 'Invalid input. Please check your details.',
        });
      } else {
        setErrors({
          general: errorData?.error || 'Failed to create account. Please try again.',
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

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  const getStrengthColor = () => {
    if (strengthScore <= 2) return 'bg-red-500';
    if (strengthScore <= 3) return 'bg-yellow-500';
    if (strengthScore <= 4) return 'bg-[#00d4ff]';
    return 'bg-green-500';
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
            Join the battle for supremacy
          </p>
        </div>

        {/* Signup Card */}
        <div className="card-glass p-8">
          <h2 className="font-display text-2xl font-bold text-center mb-6">
            Create Account
          </h2>

          {errors.general && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <p className="text-red-400 text-sm text-center">{errors.general}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8892a0]" />
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-[#0d0d1a] border rounded-lg text-white placeholder-[#4a5568] transition-colors focus:outline-none focus:border-[#00d4ff] ${
                    errors.username ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-red-400 text-xs">{errors.username}</p>
              )}
            </div>

            {/* Display Name Field */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                Display Name <span className="text-[#8892a0]">(optional)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8892a0]" />
                <input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-[#0d0d1a] border rounded-lg text-white placeholder-[#4a5568] transition-colors focus:outline-none focus:border-[#00d4ff] ${
                    errors.displayName ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="How should we call you?"
                  disabled={isLoading}
                />
              </div>
              {errors.displayName && (
                <p className="mt-1 text-red-400 text-xs">{errors.displayName}</p>
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
                  placeholder="Create a password"
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= strengthScore ? getStrengthColor() : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <PasswordRequirement met={strength.hasLength} text="8+ characters" />
                    <PasswordRequirement met={strength.hasUpper} text="Uppercase" />
                    <PasswordRequirement met={strength.hasLower} text="Lowercase" />
                    <PasswordRequirement met={strength.hasNumber} text="Number" />
                    <PasswordRequirement met={strength.hasSpecial} text="Special char" />
                  </div>
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  if (e.target.checked) setAcceptTermsError('');
                }}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-[#0d0d1a] text-[#00d4ff] focus:ring-[#00d4ff] focus:ring-offset-0"
              />
              <label htmlFor="terms" className="text-sm text-[#8892a0]">
                I agree to the{' '}
                <Link href="/terms" className="text-[#00d4ff] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[#00d4ff] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {acceptTermsError && (
              <p className="text-red-400 text-xs">{acceptTermsError}</p>
            )}

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
                  Creating account...
                </span>
              ) : (
                'Create Account'
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

          {/* Login Link */}
          <p className="mt-6 text-center text-[#8892a0] text-sm">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#00d4ff] hover:text-[#33e0ff] transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1 ${met ? 'text-green-400' : 'text-[#4a5568]'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );
}

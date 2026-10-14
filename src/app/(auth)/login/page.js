'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Feather from '@/components/shared/FeatherIcon';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(form.email, form.password);
    if (result.success) {
      router.push(redirect || '/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <Link href="/" className="flex items-center gap-2 mb-10 group">
        <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center">
          <Feather size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Blog<span style={{ color: 'var(--color-brand)' }}>Write</span>
        </span>
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Welcome back</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        Sign in to continue writing amazing content.
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Username or Email</label>
          <input
            type="text"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none transition-colors focus-ring"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
            placeholder="you@example.com or username"
            autoComplete="username"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
            <Link href="/forgot-password" className="text-xs transition-colors hover:text-[var(--color-brand)]" style={{ color: 'var(--color-text-tertiary)' }}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 pr-12 rounded-lg text-sm focus:outline-none transition-colors focus-ring"
              style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-sm font-semibold text-white gradient-brand hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-center mt-8" style={{ color: 'var(--color-text-tertiary)' }}>
        Don't have an account?{' '}
        <Link href="/signup" className="font-medium transition-colors hover:text-[var(--color-brand)]" style={{ color: 'var(--color-brand)' }}>
          Sign up free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Feather from '@/components/shared/FeatherIcon';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else { const d = await res.json(); setError(d.error || 'Failed to send reset email'); }
    } catch { setError('Something went wrong'); }
    setLoading(false);
  };

  if (sent) return (
    <div className="w-full max-w-md animate-fade-in text-center">
      <CheckCircle size={48} style={{ color: 'var(--color-success)' }} className="mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Check your email</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>We sent a password reset link to <strong>{email}</strong></p>
      <Link href="/login" className="text-sm font-medium" style={{ color: 'var(--color-brand)' }}>← Back to login</Link>
    </div>
  );

  return (
    <div className="w-full max-w-md animate-fade-in">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center"><Feather size={18} className="text-white" /></div>
        <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Blog<span style={{ color: 'var(--color-brand)' }}>Write</span></span>
      </Link>
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Forgot password?</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>Enter your email and we'll send you a reset link.</p>
      {error && <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-error)' }}>{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus-ring"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
            placeholder="you@example.com" required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-lg text-sm font-semibold text-white gradient-brand hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <p className="text-sm text-center mt-8" style={{ color: 'var(--color-text-tertiary)' }}>
        <Link href="/login" className="flex items-center justify-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={14} /> Back to login
        </Link>
      </p>
    </div>
  );
}

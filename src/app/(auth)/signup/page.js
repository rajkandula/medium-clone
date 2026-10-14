'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import Feather from '@/components/shared/FeatherIcon';

const INTERESTS = [
  'Technology', 'Science', 'Design', 'Business', 'Programming',
  'AI & ML', 'Productivity', 'Health', 'Travel', 'Finance',
  'Lifestyle', 'Education', 'Psychology', 'Startups', 'Creativity',
];

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '' });
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (step === 1) {
      if (!form.name.trim()) { setError('Full name is required'); return; }
      if (!form.email.trim()) { setError('Email is required'); return; }
      if (!form.username.trim() || form.username.length < 3) { setError('Username must be at least 3 characters'); return; }
      if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
      setError(''); setStep(2); return;
    }
    setLoading(true); setError('');
    const result = await signup({ name: form.name, email: form.email, username: form.username, password: form.password, interests: selectedInterests });
    if (result.success) { router.push(redirect || '/dashboard'); }
    else { setError(result.error || 'Signup failed'); setStep(1); }
    setLoading(false);
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <div className="w-full max-w-md animate-fade-in">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center">
          <Feather size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Blog<span style={{ color: 'var(--color-brand)' }}>Write</span>
        </span>
      </Link>

      {step === 1 ? (
        <>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Create your account</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>Start sharing your ideas with the world.</p>

          {error && (
            <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full name', key: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Username', key: 'username', type: 'text', placeholder: 'johndoe' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>{field.label}</label>
                <input type={field.type} value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: field.key === 'username' ? e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') : e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus-ring"
                  style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                  placeholder={field.placeholder} required />
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-lg text-sm focus:outline-none focus-ring"
                  style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                  placeholder="Min. 8 characters" minLength={8} autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-warning)' }}>
                  {8 - form.password.length} more character{8 - form.password.length !== 1 ? 's' : ''} needed
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Confirm password</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-lg text-sm focus:outline-none focus-ring"
                  style={{
                    background: 'var(--color-bg-input)',
                    border: `1px solid ${passwordsMismatch ? 'var(--color-error)' : passwordsMatch ? 'var(--color-success)' : 'var(--color-border-primary)'}`,
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Re-enter your password" autoComplete="new-password" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordsMatch && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
                  <Check size={12} /> Passwords match
                </p>
              )}
              {passwordsMismatch && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-error)' }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <button type="submit" className="w-full py-3 rounded-lg text-sm font-semibold text-white gradient-brand hover:opacity-90 transition-opacity">
              Continue →
            </button>
          </form>

          <p className="text-sm text-center mt-8" style={{ color: 'var(--color-text-tertiary)' }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--color-brand)' }}>Sign in</Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Pick your interests</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>Personalize your feed by selecting topics you enjoy.</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {INTERESTS.map(interest => (
              <button key={interest} onClick={() => toggleInterest(interest)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: selectedInterests.includes(interest) ? 'var(--color-brand)' : 'var(--color-bg-tertiary)',
                  color: selectedInterests.includes(interest) ? 'white' : 'var(--color-text-secondary)',
                  border: `1px solid ${selectedInterests.includes(interest) ? 'var(--color-brand)' : 'var(--color-border-primary)'}`,
                }}>
                {selectedInterests.includes(interest) && <Check size={14} className="inline mr-1" />}
                {interest}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg text-sm font-medium"
              style={{ border: '1px solid var(--color-border-secondary)', color: 'var(--color-text-primary)' }}>Back</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-lg text-sm font-semibold text-white gradient-brand hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}


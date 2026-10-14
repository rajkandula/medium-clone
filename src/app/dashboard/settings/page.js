'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Loader2, Check, Plus, X, Sun, Moon, Monitor, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';

const INTERESTS = ['Technology','Science','Design','Business','Programming','AI & ML','Productivity','Health','Travel','Finance','Lifestyle','Education','Psychology','Startups','Creativity'];

export default function SettingsProfilePage() {
  const { user, refresh } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    interests: user?.interests || [],
  });
  const [customInterest, setCustomInterest] = useState('');

  // Re-sync form when user data changes (after refresh)
  useEffect(() => {
    if (user) {
      setForm({
        interests: user.interests || [],
      });
    }
  }, [user]);

  const addCustomInterest = () => {
    const val = customInterest.trim();
    if (val && !form.interests.includes(val)) {
      setForm(f => ({ ...f, interests: [...f.interests, val] }));
    }
    setCustomInterest('');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await refresh();
        setSuccess('Settings updated!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const toggleInterest = (i) => {
    setForm(f => ({ ...f, interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i] }));
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--color-success)' }}>
          <Check size={14} /> {success}
        </div>
      )}

      <div className="p-6 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Account Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-3" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Email</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{user?.email}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Username</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>@{user?.username}</span>
          </div>
        </div>
      </div>

      {/* Subscription Plan */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Subscription Plan</h3>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: user?.subscription?.plan === 'writer' ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'var(--color-bg-card)',
                border: user?.subscription?.plan === 'writer' ? 'none' : '1px solid var(--color-border-secondary)',
              }}>
              {user?.subscription?.plan === 'writer'
                ? <Crown size={18} className="text-white" />
                : <Sparkles size={18} style={{ color: 'var(--color-text-muted)' }} />}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {user?.subscription?.plan === 'writer' ? 'Writer Pro' : 'Free Plan'}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {user?.subscription?.plan === 'writer'
                  ? `Renews ${user?.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'soon'}`
                  : 'Basic features included'}
              </div>
            </div>
          </div>
          <Link href="/dashboard/billing"
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{
              background: user?.subscription?.plan === 'writer' ? 'var(--color-bg-card)' : 'var(--color-brand)',
              color: user?.subscription?.plan === 'writer' ? 'var(--color-text-secondary)' : 'white',
              border: user?.subscription?.plan === 'writer' ? '1px solid var(--color-border-secondary)' : 'none',
            }}>
            {user?.subscription?.plan === 'writer' ? 'Manage' : 'Upgrade'}
          </Link>
        </div>
      </div>

      <div className="p-6 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Appearance</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Choose how BlogWrite looks for you.</p>
        <div className="flex gap-3">
          {[
            { key: 'light', label: 'Light', icon: Sun },
            { key: 'dark', label: 'Dark', icon: Moon },
          ].map(opt => (
            <button key={opt.key} onClick={() => setTheme(opt.key)}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
              style={{
                border: `2px solid ${theme === opt.key ? 'var(--color-brand)' : 'var(--color-border-primary)'}`,
                background: theme === opt.key ? 'var(--color-brand-glow)' : 'var(--color-bg-tertiary)',
              }}>
              <opt.icon size={20} style={{ color: theme === opt.key ? 'var(--color-brand)' : 'var(--color-text-tertiary)' }} />
              <span className="text-xs font-semibold" style={{ color: theme === opt.key ? 'var(--color-brand)' : 'var(--color-text-secondary)' }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Interests</h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: form.interests.length > 0 ? 'var(--color-brand-glow)' : 'var(--color-bg-tertiary)', color: form.interests.length > 0 ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
            {form.interests.length} selected
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Select topics you're interested in. This helps personalize your home feed.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {INTERESTS.map(i => (
            <button key={i} onClick={() => toggleInterest(i)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{ background: form.interests.includes(i) ? 'var(--color-brand)' : 'var(--color-bg-tertiary)', color: form.interests.includes(i) ? 'white' : 'var(--color-text-secondary)', border: `1px solid ${form.interests.includes(i) ? 'var(--color-brand)' : 'var(--color-border-primary)'}` }}>
              {i}
            </button>
          ))}
        </div>

        {/* Custom interests */}
        {form.interests.filter(i => !INTERESTS.includes(i)).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {form.interests.filter(i => !INTERESTS.includes(i)).map(i => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'var(--color-brand)', color: 'white' }}>
                {i}
                <button onClick={() => toggleInterest(i)} className="hover:opacity-70"><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Add custom */}
        <div className="flex gap-2">
          <input
            value={customInterest}
            onChange={e => setCustomInterest(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomInterest(); } }}
            className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus-ring"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
            placeholder="Add a custom interest..."
          />
          <button onClick={addCustomInterest}
            className="px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 flex items-center gap-1.5"
            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)' }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <button onClick={handleSaveProfile} disabled={saving}
        className="px-6 py-3 rounded-lg text-sm font-semibold text-white gradient-brand hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Save Changes
      </button>
    </div>
  );
}

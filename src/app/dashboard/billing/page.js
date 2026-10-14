'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Check, Star, Zap, Activity, FolderGit2, CheckCircle2 } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpgrading(false);
    }
  };

  const isWriter = user?.subscription?.plan === 'writer';

  const freeFeatures = [
    { text: 'Create up to 3 blog posts (Rich text & Markdown)', enabled: true },
    { text: '50MB secure media storage', enabled: true },
    { text: 'Standard profile page template', enabled: true },
    { text: 'Claude.ai MCP Integration', enabled: true },
    { text: 'AI Chat Assistant & Writing Copilot', enabled: false },
    { text: 'Pulse tech news & Research Desk', enabled: false },
    { text: 'AI Startup Concepts hub', enabled: false },
    { text: 'Advanced statistics & reader analytics', enabled: false },
    { text: 'Custom SEO fields override', enabled: false },
    { text: 'Exclusive Writer profile badge ✨', enabled: false },
  ];

  const premiumFeatures = [
    { text: 'Unlimited posts (Rich text, LaTeX, HTML, Markdown)', enabled: true },
    { text: '5GB secure media storage', enabled: true },
    { text: 'Custom profile as a personal portfolio', enabled: true },
    { text: 'AI Chat Assistant & Writing Copilot', enabled: true },
    { text: 'Pulse tech news & Research Desk', enabled: true },
    { text: 'AI Startup Concepts hub', enabled: true },
    { text: 'Advanced statistics & reader analytics', enabled: true },
    { text: 'Custom SEO fields override', enabled: true },
    { text: 'Exclusive Writer profile badge ✨', enabled: true },
    { text: 'Claude.ai MCP Integration', enabled: true },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Account Subscriptions</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Choose a tier that matches your publishing scale and unlock advanced developer utilities.</p>
      </div>

      {/* Current Plan Badge */}
      <div className="p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Current Standing</span>
          <h2 className="text-xl font-extrabold capitalize flex items-center gap-2 mt-1" style={{ color: 'var(--color-text-primary)' }}>
            {user?.subscription?.plan || 'Free Plan'} {isWriter && <Star size={16} fill="var(--color-brand)" stroke="var(--color-brand)" className="animate-spin-slow" />}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {isWriter ? 'Your subscription is active and auto-renews monthly.' : 'You are currently on our default complimentary tier.'}
          </p>
        </div>
        <div className="px-4 py-2 rounded-lg text-xs font-semibold"
          style={{ background: isWriter ? 'var(--color-brand-glow)' : 'var(--color-bg-tertiary)', color: isWriter ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
          {isWriter ? 'Active Premium subscription' : 'Basic complimentary tier'}
        </div>
      </div>

      {/* Plan Comparisons cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Free Plan Card */}
        <div className="p-6 rounded-xl flex flex-col justify-between transition-all duration-300 hover:shadow-lg"
          style={{
            background: 'var(--color-bg-card)',
            border: isWriter ? '1px solid var(--color-border-primary)' : '2px solid var(--color-border-primary)',
            opacity: isWriter ? 0.75 : 1
          }}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Free Tier</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>For casual hobbyist writers.</p>
              </div>
              <span className="text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>$0</span>
            </div>

            <ul className="space-y-3.5 mb-8">
              {freeFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-xs">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: f.enabled ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                    <Check size={10} style={{ color: f.enabled ? 'var(--color-success)' : 'var(--color-error)' }} />
                  </span>
                  <span style={{ color: f.enabled ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }} className={!f.enabled ? 'line-through' : ''}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button disabled className="w-full py-3 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
            {isWriter ? 'Downgrade available on period end' : 'Current active tier'}
          </button>
        </div>

        {/* Writer Premium Plan Card */}
        <div className="p-6 rounded-xl flex flex-col justify-between transition-all duration-300 hover:shadow-2xl relative overflow-hidden"
          style={{
            background: 'var(--color-bg-card)',
            border: isWriter ? '2px solid var(--color-brand)' : '1px solid var(--color-border-primary)'
          }}>
          {/* Best value tag */}
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold text-white gradient-brand animate-pulse">
            Recommended
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                  Writer Pro <Zap size={14} style={{ color: 'var(--color-brand)' }} fill="var(--color-brand)" />
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>For professional developers & creators.</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>$1</span>
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}> / month</span>
              </div>
            </div>

            <ul className="space-y-3.5 mb-8">
              {premiumFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-xs group">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center bg-[rgba(34,197,94,0.15)] group-hover:scale-110 transition-transform">
                    <Check size={10} style={{ color: '#22c55e' }} className="stroke-[3px]" />
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {isWriter ? (
            <div className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold text-center border"
              style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.02)' }}>
              <CheckCircle2 size={14} style={{ color: '#22c55e' }} /> Subscription active
            </div>
          ) : (
            <button onClick={handleUpgrade} disabled={upgrading}
              className="w-full py-3 rounded-lg text-xs font-extrabold transition-all text-white gradient-brand shadow-lg hover:scale-[1.01] hover:brightness-110 active:scale-95 disabled:opacity-50">
              {upgrading ? 'Connecting to Stripe secure portal...' : 'Upgrade to Writer — $1/mo'}
            </button>
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
          <FolderGit2 size={20} style={{ color: 'var(--color-text-tertiary)' }} />
          <div>
            <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Secure Processing</h4>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Stripe encrypted transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
          <Activity size={20} style={{ color: 'var(--color-text-tertiary)' }} />
          <div>
            <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Instant Activation</h4>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Plan features apply immediately</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
          <Star size={20} style={{ color: 'var(--color-text-tertiary)' }} />
          <div>
            <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Flexible Plan</h4>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Cancel subscription at any time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

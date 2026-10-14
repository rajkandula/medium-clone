'use client';

import { useSWRFetch } from '@/hooks/useSWRFetch';
import { DollarSign, Users, ArrowUpRight, ShieldCheck, Calendar } from 'lucide-react';
import { formatNumber, timeAgo } from '@/lib/utils';

export default function AdminBillingPage() {
  const { data, loading } = useSWRFetch('/api/admin?type=billing');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--color-brand)' }}></div>
      </div>
    );
  }

  const mrr = data?.mrr || 0;
  const totalSubscribers = data?.totalSubscribers || 0;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Administrative Billing</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Monitor platform subscription metrics and active Stripe plans.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Monthly Recurring Revenue</span>
            <DollarSign size={16} style={{ color: 'var(--color-brand)' }} />
          </div>
          <div className="text-3xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
            ${mrr.toFixed(2)}
          </div>
          <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
            <ArrowUpRight size={10} /> 100% ARR growth
          </p>
        </div>

        <div className="p-5 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Active Premium Writers</span>
            <Users size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div className="text-3xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
            {totalSubscribers}
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--color-text-muted)' }}>Paying $1.00 / month</p>
        </div>

        <div className="p-5 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Average ARPU</span>
            <ShieldCheck size={16} style={{ color: '#22c55e' }} />
          </div>
          <div className="text-3xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
            $1.00
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--color-text-muted)' }}>Standard monthly pricing plan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Subscribers List */}
        <div className="lg:col-span-2 rounded-xl flex flex-col overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <div className="p-5" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Active Subscribers</h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            {data?.subscribers?.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No active paying subscribers found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Subscriber</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Plan ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Period End</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-border-primary)' }}>
                  {data?.subscribers?.map(sub => (
                    <tr key={sub._id} className="hover:bg-[var(--color-bg-hover)]">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{sub.name}</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>@{sub.username}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>
                          writer_tier_1
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {sub.subscription?.currentPeriodEnd ? new Date(sub.subscription.currentPeriodEnd).toLocaleDateString() : '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Invoice & Logs */}
        <div className="rounded-xl flex flex-col overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <div className="p-5" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Simulated Invoices</h2>
          </div>
          <div className="divide-y flex-1" style={{ borderColor: 'var(--color-border-primary)' }}>
            {data?.invoices?.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No invoice records available.</div>
            ) : (
              data?.invoices?.map(inv => (
                <div key={inv.id} className="p-4 space-y-2 hover:bg-[var(--color-bg-hover)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium" style={{ color: 'var(--color-text-muted)' }}>{inv.id}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)' }}>{inv.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{inv.user.name}</span>
                    <span className="font-extrabold" style={{ color: 'var(--color-text-primary)' }}>${inv.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    Paid {new Date(inv.date).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

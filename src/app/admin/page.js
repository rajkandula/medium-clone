'use client';

import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Users, FileText, MessageCircle, DollarSign, TrendingUp } from 'lucide-react';
import { formatNumber, timeAgo } from '@/lib/utils';

export default function AdminPage() {
  const { data } = useSWRFetch('/api/admin?type=stats');

  const stats = [
    { label: 'Total Users', value: formatNumber(data?.totalUsers || 0), icon: Users, color: '#3b82f6' },
    { label: 'Published Posts', value: formatNumber(data?.totalPosts || 0), icon: FileText, color: '#22c55e' },
    { label: 'Comments', value: formatNumber(data?.totalComments || 0), icon: MessageCircle, color: '#f59e0b' },
    { label: 'Writer Subs', value: formatNumber(data?.writerUsers || 0), icon: DollarSign, color: '#ec4899' },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Admin Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="p-5 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</span>
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Signups */}
      <div className="rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent Signups</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border-primary)' }}>
          {data?.recentUsers?.map(u => (
            <div key={u._id} className="p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{u.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{u.email}</p>
              </div>
              <span className="text-xs capitalize px-2 py-1 rounded-full"
                style={{ background: u.subscription?.plan === 'writer' ? 'var(--color-brand-glow)' : 'var(--color-bg-tertiary)', color: u.subscription?.plan === 'writer' ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
                {u.subscription?.plan || 'free'}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{timeAgo(u.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

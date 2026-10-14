'use client';

import { useState } from 'react';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Search, Shield, Ban, CheckCircle } from 'lucide-react';
import { timeAgo, formatNumber } from '@/lib/utils';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, mutate } = useSWRFetch(`/api/admin?type=users&page=${page}&search=${search}`);

  const handleAction = async (userId, action, updateData) => {
    // Confirm high-privilege role changes — a mis-click grants/revokes full admin.
    if (action === 'role') {
      const becomingAdmin = updateData?.role === 'admin';
      if (!window.confirm(becomingAdmin
        ? 'Grant this user full admin access?'
        : 'Remove admin access from this user?')) return;
    }
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateUser', userId, data: updateData }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e.error || 'Action failed');
        return;
      }
      mutate();
    } catch {
      alert('Action failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Users ({data?.total || 0})</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus-ring"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
            placeholder="Search users..." />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
              {['User', 'Email', 'Plan', 'Posts', 'Role', 'Joined', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-tertiary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-border-primary)' }}>
            {data?.users?.map(u => (
              <tr key={u._id} className="hover:bg-[var(--color-bg-hover)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-white">{u.name?.[0]}</div>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs capitalize" style={{ background: u.subscription?.plan === 'writer' ? 'var(--color-brand-glow)' : 'var(--color-bg-tertiary)', color: u.subscription?.plan === 'writer' ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
                    {u.subscription?.plan || 'free'}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{u.postsCount || 0}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'var(--color-bg-tertiary)', color: u.role === 'admin' ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{timeAgo(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleAction(u._id, 'role', { role: u.role === 'admin' ? 'user' : 'admin' })}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)]" title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}>
                    <Shield size={14} style={{ color: u.role === 'admin' ? 'var(--color-error)' : 'var(--color-text-muted)' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className="w-9 h-9 rounded-lg text-sm font-medium"
              style={{ background: page === i + 1 ? 'var(--color-brand)' : 'var(--color-bg-card)', color: page === i + 1 ? 'white' : 'var(--color-text-secondary)' }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

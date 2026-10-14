'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Eye, Heart, MessageCircle, Bookmark, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { data } = useSWRFetch(user ? `/api/posts?author=${user.id}&status=published&limit=50` : null);

  const totalViews = data?.posts?.reduce((s, p) => s + (p.viewCount || 0), 0) || 0;
  const totalLikes = data?.posts?.reduce((s, p) => s + (p.likesCount || 0), 0) || 0;
  const totalComments = data?.posts?.reduce((s, p) => s + (p.commentsCount || 0), 0) || 0;
  const totalBookmarks = data?.posts?.reduce((s, p) => s + (p.bookmarksCount || 0), 0) || 0;

  const stats = [
    { label: 'Total Views', value: formatNumber(totalViews), icon: Eye, color: '#3b82f6' },
    { label: 'Total Likes', value: formatNumber(totalLikes), icon: Heart, color: '#ec4899' },
    { label: 'Comments', value: formatNumber(totalComments), icon: MessageCircle, color: '#22c55e' },
    { label: 'Bookmarks', value: formatNumber(totalBookmarks), icon: Bookmark, color: '#f59e0b' },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Analytics</h1>

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

      <div className="rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Post Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
                {['Post', 'Views', 'Likes', 'Comments', 'Bookmarks'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border-primary)' }}>
              {data?.posts?.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).map(post => (
                <tr key={post._id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                  <td className="px-5 py-3 max-w-xs truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>{post.title}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>{formatNumber(post.viewCount || 0)}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>{formatNumber(post.likesCount || 0)}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>{formatNumber(post.commentsCount || 0)}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>{formatNumber(post.bookmarksCount || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.posts || data.posts.length === 0) && (
            <div className="p-12 text-center">
              <TrendingUp size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No data yet. Publish posts to see analytics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

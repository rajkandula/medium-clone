'use client';

import { useState } from 'react';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Bookmark as BookmarkIcon, X, BookOpen, Newspaper, Rocket, FileText, ExternalLink, ArrowUpRight } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

const TABS = [
  { key: 'all', label: 'All', icon: BookmarkIcon },
  { key: 'post', label: 'Blog Posts', icon: FileText },
  { key: 'research', label: 'Research Papers', icon: BookOpen },
  { key: 'news', label: 'News & Pulse', icon: Newspaper },
];

function BookmarkItem({ item, onRemove }) {
  const type = item.itemType || 'post';

  // Resolve display data based on type
  let title, subtitle, href, removeId, removeType;

  if (type === 'post' && item.post) {
    title = item.post.title;
    subtitle = `by ${item.post.author?.name || 'Unknown'} · ${timeAgo(item.createdAt)}`;
    href = `/blog/${item.post.slug}`;
    removeId = item.post._id;
    removeType = 'post';
  } else if (type === 'research' && item.research) {
    title = item.research.title;
    subtitle = `${item.research.sourceName || 'arXiv'} · ${item.research.authors?.[0] || ''} · ${timeAgo(item.createdAt)}`;
    href = item.research.sourceUrl;
    removeId = item.research._id;
    removeType = 'research';
  } else if (type === 'news' && item.news) {
    title = item.news.title;
    subtitle = `${item.news.sourceName || 'News'} · ${timeAgo(item.createdAt)}`;
    href = item.news.sourceUrl;
    removeId = item.news._id;
    removeType = 'news';
  } else {
    return null; // Invalid bookmark
  }

  const handleRemove = async () => {
    if (removeType === 'post') {
      await fetch(`/api/posts/${removeId}/bookmark`, { method: 'POST' });
    } else if (removeType === 'research') {
      await fetch(`/api/research/${removeId}/save`, { method: 'POST' });
    } else if (removeType === 'news') {
      await fetch(`/api/news/${removeId}/save`, { method: 'POST' });
    }
    onRemove?.();
  };

  const isExternal = type === 'research' || type === 'news';
  const TypeIcon = type === 'research' ? BookOpen : type === 'news' ? Newspaper : type === 'post' ? FileText : BookmarkIcon;
  const typeColor = type === 'research' ? '#8b5cf6' : type === 'news' ? '#3b82f6' : 'var(--color-brand)';

  return (
    <div className="p-5 flex items-start gap-4 hover:bg-[var(--color-bg-hover)] transition-colors">
      {/* Type badge */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${typeColor}12`,
      }}>
        <TypeIcon size={16} style={{ color: typeColor }} />
      </div>

      <div className="flex-1 min-w-0">
        {isExternal ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-base font-semibold hover:text-[var(--color-brand)] block truncate"
            style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}>
            {title} <ArrowUpRight size={12} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.5 }} />
          </a>
        ) : (
          <Link href={href}
            className="text-base font-semibold hover:text-[var(--color-brand)] block truncate"
            style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </Link>
        )}
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          {subtitle}
        </p>
      </div>
      <button onClick={handleRemove}
        className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
        style={{ color: 'var(--color-text-tertiary)' }}
        title="Remove bookmark">
        <X size={16} />
      </button>
    </div>
  );
}

export default function BookmarksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const typeParam = activeTab === 'all' ? '' : `?type=${activeTab}`;
  const { data, isLoading, mutate } = useSWRFetch(`/api/users/me/bookmarks${typeParam}`);

  const bookmarks = data?.bookmarks || [];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Bookmarks</h1>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '20px',
        borderBottom: '1px solid var(--color-border-primary)',
        paddingBottom: '0',
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 16px', fontSize: '13px', fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent',
                color: active ? 'var(--color-brand)' : 'var(--color-text-muted)',
                borderBottom: active ? '2px solid var(--color-brand)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        {isLoading && !data ? (
          <div className="divide-y animate-pulse" style={{ borderColor: 'var(--color-border-primary)' }}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="p-5 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl skeleton shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-1/2 skeleton" />
                  <div className="h-3.5 w-1/3 skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--color-border-primary)' }}>
            {bookmarks.map(item => (
              <BookmarkItem key={item._id} item={item} onRemove={() => mutate()} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <BookmarkIcon size={40} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-base font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {activeTab === 'all' ? 'No bookmarks yet' : `No saved ${TABS.find(t => t.key === activeTab)?.label?.toLowerCase() || 'items'}`}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Save posts, research papers, and news articles to read later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

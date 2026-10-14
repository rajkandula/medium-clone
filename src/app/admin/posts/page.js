'use client';

import { useState } from 'react';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Star, Trash2, Eye } from 'lucide-react';
import { timeAgo, formatNumber } from '@/lib/utils';
import Link from 'next/link';

export default function AdminPostsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const { data, mutate } = useSWRFetch(`/api/admin?type=posts&page=${page}${status ? `&status=${status}` : ''}`);

  const handleFeature = async (postId, isFeatured) => {
    await fetch('/api/admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'featurePost', postId, data: { isFeatured: !isFeatured } }),
    });
    mutate();
  };

  const handleDeleteClick = (postId) => {
    setDeleteConfirmId(postId);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    const postId = deleteConfirmId;
    setDeleteConfirmId(null);
    await fetch('/api/admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deletePost', postId }),
    });
    mutate();
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Posts ({data?.total || 0})</h1>
        <div className="flex gap-2">
          {['', 'published', 'draft', 'archived'].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
              style={{ background: status === s ? 'var(--color-brand-glow)' : 'var(--color-bg-tertiary)', color: status === s ? 'var(--color-brand)' : 'var(--color-text-tertiary)' }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        <div className="divide-y" style={{ borderColor: 'var(--color-border-primary)' }}>
          {data?.posts?.map(post => (
            <div key={post._id} className="p-4 flex items-center gap-4 hover:bg-[var(--color-bg-hover)]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{post.title}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  by {post.author?.name} · {timeAgo(post.createdAt)} · {formatNumber(post.viewCount)} views
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
                style={{ background: post.status === 'published' ? 'rgba(34,197,94,0.1)' : 'var(--color-bg-tertiary)', color: post.status === 'published' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {post.status}
              </span>
              <div className="flex gap-1">
                <button onClick={() => handleFeature(post._id, post.isFeatured)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)]" title="Feature">
                  <Star size={14} style={{ color: post.isFeatured ? 'var(--color-brand)' : 'var(--color-text-muted)' }} fill={post.isFeatured ? 'currentColor' : 'none'} />
                </button>
                <Link href={`/blog/${post.slug}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)]"><Eye size={14} style={{ color: 'var(--color-text-muted)' }} /></Link>
                <button onClick={() => handleDeleteClick(post._id)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)]"><Trash2 size={14} style={{ color: 'var(--color-error)' }} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Dialog Overlay */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border-primary)] transition-all animate-scale-up"
            style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
            <h3 className="text-[17px] font-bold mb-2.5" style={{ fontFamily: 'var(--font-serif)' }}>
              Delete Post
            </h3>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--color-bg-hover)] cursor-pointer"
                style={{ border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Star, MessageSquare, Trash2, ShieldAlert, Heart, Info, DollarSign } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export default function AdminFeedbackPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { data, mutate, loading } = useSWRFetch(`/api/feedback?page=${page}${category ? `&category=${category}` : ''}${sentiment ? `&sentiment=${sentiment}` : ''}`);

  const handleDeleteClick = (feedbackId) => {
    setDeleteConfirmId(feedbackId);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    const feedbackId = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteFeedback', feedbackId }),
      });
      if (!res.ok) { alert('Failed to delete feedback'); return; }
      mutate();
    } catch {
      alert('Failed to delete feedback');
    }
  };

  const getSentimentEmoji = (s) => {
    switch (s) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      default: return '😐';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'bug': return <ShieldAlert size={14} style={{ color: 'var(--color-error)' }} />;
      case 'billing': return <DollarSign size={14} style={{ color: 'var(--color-brand)' }} />;
      case 'feature': return <Heart size={14} style={{ color: '#ec4899' }} />;
      default: return <Info size={14} style={{ color: '#3b82f6' }} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Customer Feedback</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Browse user ratings, system reports, and service suggestions.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Category Selector */}
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}>
            <option value="">All Categories</option>
            <option value="bug">Bugs</option>
            <option value="feature">Features</option>
            <option value="billing">Billing</option>
            <option value="general">General</option>
          </select>

          {/* Sentiment Selector */}
          <select value={sentiment} onChange={e => { setSentiment(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}>
            <option value="">All Sentiments</option>
            <option value="happy">Happy 😊</option>
            <option value="neutral">Neutral 😐</option>
            <option value="sad">Sad 😢</option>
          </select>
        </div>
      </div>

      {/* Feedback Feed */}
      {loading && page === 1 ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--color-brand)' }}></div>
        </div>
      ) : data?.feedbacks?.length === 0 ? (
        <div className="p-16 text-center rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <MessageSquare size={32} className="mx-auto opacity-30 mb-2" />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>No feedback submissions match these criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.feedbacks?.map(item => (
            <div key={item._id} className="p-5 rounded-xl flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-lg"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" title={`Sentiment: ${item.sentiment}`}>{getSentimentEmoji(item.sentiment)}</span>
                    <div>
                      <h3 className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{item.name}</h3>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{item.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteClick(item._id)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors" title="Delete Feedback">
                    <Trash2 size={13} style={{ color: 'var(--color-error)' }} />
                  </button>
                </div>

                {/* Rating Stars & Category Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={12} fill={i < item.rating ? '#f59e0b' : 'none'} stroke={i < item.rating ? '#f59e0b' : 'var(--color-text-muted)'} />
                    ))}
                  </div>
                  <span className="text-[10px] capitalize px-2 py-0.5 rounded flex items-center gap-1 font-semibold"
                    style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                    {getCategoryIcon(item.category)} {item.category}
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  "{item.text}"
                </p>
              </div>

              <div className="mt-4 pt-3 flex justify-between items-center text-[10px]" style={{ borderTop: '1px solid var(--color-border-primary)', color: 'var(--color-text-muted)' }}>
                <span>{item.submittedBy ? `User: @${item.submittedBy.username}` : 'Guest User'}</span>
                <span>{timeAgo(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className="w-9 h-9 rounded-lg text-xs font-bold transition-all"
              style={{
                background: page === i + 1 ? 'var(--color-brand)' : 'var(--color-bg-card)',
                color: page === i + 1 ? 'white' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-primary)'
              }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
      {/* Custom Dialog Overlay */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border-primary)] transition-all animate-scale-up"
            style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
            <h3 className="text-[17px] font-bold mb-2.5" style={{ fontFamily: 'var(--font-serif)' }}>
              Delete Feedback
            </h3>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete this feedback? This action cannot be undone.
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

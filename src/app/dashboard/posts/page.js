'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useAuth } from '@/context/AuthContext';
import { FileText, Eye, Heart, Trash2, Edit, Plus, X, FolderPlus, Tag, Check, Loader2 } from 'lucide-react';
import { timeAgo, truncate, getPostExcerpt } from '@/lib/utils';

export default function MyStoriesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('published');
  const [page, setPage] = useState(1);
  const [activeCollection, setActiveCollection] = useState(null);
  const [assignDropdown, setAssignDropdown] = useState(null);
  const [savingAssign, setSavingAssign] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Load user's profile design (which has custom tabs) via SWR for caching and speed
  const { data: userData, mutate: mutateUser } = useSWRFetch(user ? '/api/users/me' : null);
  const profileDesign = userData?.user?.profileDesign;

  const customTabs = (profileDesign?.customTabs || []).filter(t => t.visible !== false);

  const { data, isLoading, mutate } = useSWRFetch(
    user ? `/api/posts?author=${user.id}&status=${tab}&page=${page}&limit=10` : null
  );

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    await fetch(`/api/posts/${deleteConfirmId}`, { method: 'DELETE' });
    setDeleteConfirmId(null);
    mutate();
  };

  // Toggle a post in/out of a profile custom tab
  const handleTogglePostInTab = async (tabId, postId) => {
    if (!profileDesign) return;
    setSavingAssign(true);

    const updatedTabs = (profileDesign.customTabs || []).map(t => {
      if (t.id !== tabId) return t;
      const has = (t.posts || []).includes(postId);
      return { ...t, posts: has ? (t.posts || []).filter(p => p !== postId) : [...(t.posts || []), postId] };
    });

    const updatedDesign = { ...profileDesign, customTabs: updatedTabs };

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileDesign: updatedDesign }),
      });
      if (res.ok) {
        mutateUser();
      }
    } catch {}
    setSavingAssign(false);
    setAssignDropdown(null);
  };

  // Check if a post is assigned to a specific tab
  const isPostInTab = (tabId, postId) => {
    const tab = (profileDesign?.customTabs || []).find(t => t.id === tabId);
    return (tab?.posts || []).includes(postId);
  };

  // Filter posts by custom tab
  const getFilteredPosts = () => {
    const allPosts = data?.posts || [];
    if (!activeCollection) return allPosts;
    const ct = customTabs.find(t => t.id === activeCollection);
    if (!ct) return allPosts;
    const tabPostIds = ct.posts || [];
    return allPosts.filter(p => tabPostIds.includes(p._id));
  };

  const statusTabs = ['published', 'draft', 'archived'];
  const posts = getFilteredPosts();

  return (
    <div className="max-w-5xl mx-auto animate-fade-in px-4 sm:px-6 py-2">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>
          My Posts
        </h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Manage and organize all your content
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
        {statusTabs.map(t => (
          <button key={t} onClick={() => { setTab(t); setActiveCollection(null); setPage(1); }}
            className="px-4 py-2.5 text-[13px] font-semibold capitalize transition-all relative whitespace-nowrap"
            style={{
              color: tab === t && !activeCollection ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
            }}>
            {t}
            {tab === t && !activeCollection && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full" style={{ background: 'var(--color-brand)' }} />
            )}
          </button>
        ))}

        {/* Custom Profile Tabs */}
        {customTabs.length > 0 && (
          <>
            <div className="w-px h-5 mx-2" style={{ background: 'var(--color-border-primary)' }} />
            {customTabs.map(ct => (
              <button key={ct.id} onClick={() => { setActiveCollection(activeCollection === ct.id ? null : ct.id); setPage(1); }}
                className="px-3 py-2.5 text-[13px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 relative"
                style={{
                  color: activeCollection === ct.id ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
                }}>
                <Tag size={12} />
                {ct.label}
                {activeCollection === ct.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full" style={{ background: 'var(--color-brand)' }} />
                )}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Posts List */}
      {isLoading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-border-primary)] animate-pulse"
              style={{ background: 'var(--color-bg-card)' }}>
              <div className="w-[72px] h-[72px] rounded-xl skeleton shrink-0" />
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="h-4 w-1/3 skeleton" />
                <div className="h-3 w-3/4 skeleton" />
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-3.5 w-10 skeleton" />
                  <div className="h-3.5 w-16 skeleton" />
                  <div className="h-3.5 w-12 skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <div key={post._id}
              className="group flex items-center gap-4 p-4 rounded-2xl transition-all hover:shadow-md animate-slide-up"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-primary)',
                animationDelay: `${i * 0.04}s`,
              }}>
              {/* Thumbnail */}
              {post.coverImage ? (
                <Link href={tab === 'published' ? `/blog/${post.slug}` : `/dashboard/posts/${post._id}/edit`}
                  className="shrink-0">
                  <img src={post.coverImage} alt=""
                    className="w-[72px] h-[72px] rounded-xl object-cover group-hover:scale-105 transition-transform" />
                </Link>
              ) : (
                <div className="w-[72px] h-[72px] rounded-xl shrink-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--color-bg-hover), var(--color-bg-secondary))' }}>
                  <FileText size={24} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <Link href={tab === 'published' ? `/blog/${post.slug}` : `/dashboard/posts/${post._id}/edit`}
                  className="block group/title">
                  <h3 className="text-[15px] font-bold leading-snug truncate group-hover/title:text-[var(--color-brand)] transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}>
                    {post.title}
                  </h3>
                </Link>
                <p className="text-[12.5px] mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {getPostExcerpt(post, 100)}
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {tab === 'published' && (
                    <>
                      <span className="text-[11px] flex items-center gap-1 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                        <Eye size={12} /> {post.viewCount || 0}
                      </span>
                      <span className="text-[11px] flex items-center gap-1 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                        <Heart size={12} /> {post.likesCount || 0}
                      </span>
                    </>
                  )}
                  <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {timeAgo(post.publishedAt || post.createdAt)}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {post.readTime} min read
                  </span>
                  {post.format && post.format !== 'richtext' && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase"
                      style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>
                      {post.format}
                    </span>
                  )}
                  {/* Show which profile tabs this post belongs to */}
                  {customTabs.filter(ct => (ct.posts || []).includes(post._id)).map(ct => (
                    <span key={ct.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                      style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-tertiary)' }}>
                      <Tag size={9} /> {ct.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Assign to profile tab */}
                {customTabs.length > 0 && (
                  <div className="relative">
                    <button onClick={() => setAssignDropdown(assignDropdown === post._id ? null : post._id)}
                      className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
                      title="Add to site tab"
                      style={{ color: 'var(--color-text-tertiary)' }}>
                      <FolderPlus size={16} />
                    </button>
                    {assignDropdown === post._id && (
                      <div className="absolute right-0 top-full mt-1 z-50 rounded-xl py-1 min-w-[180px] shadow-xl"
                        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
                        <div className="px-3 py-1.5 border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                            My Site Tabs
                          </p>
                        </div>
                        {customTabs.map(ct => {
                          const isAssigned = isPostInTab(ct.id, post._id);
                          return (
                            <button key={ct.id}
                              onClick={() => handleTogglePostInTab(ct.id, post._id)}
                              disabled={savingAssign}
                              className="flex items-center gap-2 w-full px-3 py-2 text-[13px] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50"
                              style={{ color: 'var(--color-text-primary)' }}>
                              <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                                style={{
                                  background: isAssigned ? 'var(--color-brand)' : 'var(--color-bg-secondary)',
                                  border: isAssigned ? 'none' : '1px solid var(--color-border-primary)',
                                }}>
                                {isAssigned && <Check size={10} className="text-white" />}
                              </div>
                              {ct.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <Link href={`/dashboard/posts/${post._id}/edit`}
                  className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
                  style={{ color: 'var(--color-text-tertiary)' }}>
                  <Edit size={16} />
                </Link>
                <button onClick={() => handleDeleteClick(post._id)}
                  className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                  style={{ color: 'var(--color-error)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--color-bg-secondary)' }}>
            <FileText size={28} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <p className="text-[16px] font-bold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>
            {activeCollection ? `No posts in "${customTabs.find(t => t.id === activeCollection)?.label}"` : `No ${tab} stories`}
          </p>
          <p className="text-[13px] mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
            {activeCollection
              ? 'Hover a post and click the folder icon to add it to this tab.'
              : tab === 'draft'
                ? 'Start writing and save as draft.'
                : 'Publish your first story!'}
          </p>
          {!activeCollection && (
            <Link href="/dashboard/posts/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
              <Plus size={14} /> Write a Story
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: data.totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className="w-9 h-9 rounded-xl text-[13px] font-semibold transition-all"
              style={{
                background: page === i + 1 ? 'var(--color-brand)' : 'var(--color-bg-card)',
                color: page === i + 1 ? 'white' : 'var(--color-text-secondary)',
                border: `1px solid ${page === i + 1 ? 'var(--color-brand)' : 'var(--color-border-primary)'}`,
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

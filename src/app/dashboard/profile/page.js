'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Users, FileText, Heart, Loader2, ExternalLink, Edit3, Trash2 } from 'lucide-react';
import { formatNumber, timeAgo, truncate, getPostExcerpt } from '@/lib/utils';

export default function DashboardProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('articles');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Step 1: Get current user session
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) { setLoading(false); return; }
        const authData = await authRes.json();
        const me = authData.user;
        if (!me) { setLoading(false); return; }

        // Step 2: Fetch full profile with posts via username
        if (me.username) {
          const profileRes = await fetch(`/api/users/${me.username}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.user) {
              setProfile(profileData.user);
              setPosts(profileData.posts || []);
              setLoading(false);
              return;
            }
          }
        }

        // Fallback: use auth data directly
        setProfile({
          name: me.name,
          username: me.username || me.email?.split('@')[0],
          email: me.email,
          avatar: me.avatar,
          bio: me.bio,
          followersCount: me.followersCount || 0,
          followingCount: me.followingCount || 0,
          postsCount: me.postsCount || 0,
          createdAt: me.createdAt,
        });
        setPosts([]);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin" style={{ color: '#f59e0b' }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Users size={48} className="mb-4" style={{ color: 'var(--color-text-muted)' }} />
        <p className="text-[18px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Profile not found</p>
        <p className="text-[14px] mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
          Set up your username in settings to view your profile.
        </p>
        <Link href="/dashboard/settings"
          className="px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-10">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.name}
            className="w-[88px] h-[88px] rounded-full object-cover shrink-0"
            style={{ border: '3px solid var(--color-border-primary)' }} />
        ) : (
          <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-[32px] font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            {profile.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            {profile.name}
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            @{profile.username}
          </p>

          {profile.bio && (
            <p className="text-[14px] mt-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-6 mt-4">
            <span className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>{formatNumber(profile.followersCount || 0)}</strong> followers
            </span>
            <span className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>{formatNumber(profile.followingCount || 0)}</strong> following
            </span>
            <span className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>{posts.length || profile.postsCount || 0}</strong> posts
            </span>
          </div>

          <Link href="/dashboard/settings"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-[var(--color-bg-hover)]"
            style={{ border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}>
            <Edit3 size={14} />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 mb-6 border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
        <button
          onClick={() => setActiveTab('articles')}
          className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'articles' ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]' : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
        >
          Articles
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'about' ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]' : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
        >
          About
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'articles' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {posts.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border-primary)' }}>
              <FileText size={36} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-[14px]" style={{ color: 'var(--color-text-tertiary)' }}>No published posts yet.</p>
              <Link href="/dashboard/posts/new"
                className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-semibold hover:underline" style={{ color: '#f59e0b' }}>
                Write your first post
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post._id}
                  className="p-5 rounded-xl transition-all hover:shadow-md group"
                  style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/blog/${post.slug || post._id}`} className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-semibold leading-snug mb-1 hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                        {post.title}
                      </h3>
                      <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                          {getPostExcerpt(post, 140)}
                        </p>
                    </Link>
                    {post.coverImage && (
                      <img src={post.coverImage} alt="" className="w-[100px] h-[66px] rounded-lg object-cover shrink-0 hidden sm:block" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                      <span>{timeAgo(post.publishedAt || post.createdAt)}</span>
                      <span>{post.readTime || Math.ceil((post.content?.length || 0) / 1000)} min</span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} /> {post.likesCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/posts/${post._id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-[var(--color-bg-hover)]"
                        style={{ color: 'var(--color-text-secondary)' }}>
                        <Edit3 size={13} /> Edit
                      </Link>
                      <button onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(post._id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-red-50"
                        style={{ color: '#ef4444' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {profile.about ? (
            <div className="prose prose-sm max-w-none" style={{ color: 'var(--color-text-secondary)' }}>
              {profile.about.split('\n').map((paragraph, idx) => (
                paragraph ? <p key={idx} className="mb-4 leading-relaxed">{paragraph}</p> : <br key={idx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border-primary)' }}>
              <p className="text-[14px] mb-3" style={{ color: 'var(--color-text-tertiary)' }}>You haven't written an about section yet.</p>
              <Link href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline" style={{ color: '#f59e0b' }}>
                <Edit3 size={14} /> Add your story
              </Link>
            </div>
          )}
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
                onClick={async () => {
                  const idToDelete = deleteConfirmId;
                  setDeleteConfirmId(null);
                  try {
                    await fetch(`/api/posts/${idToDelete}`, { method: 'DELETE' });
                    setPosts(prev => prev.filter(p => p._id !== idToDelete));
                  } catch {}
                }}
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

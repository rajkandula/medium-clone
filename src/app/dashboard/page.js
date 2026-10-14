'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, Star, Flame, Clock, ArrowUpRight, Sparkles, SquarePen, Rocket, FlaskConical, Activity, BookOpen, Code, Cpu, Bot, Palette, Eye, X, Flag, EyeOff, Share2, LinkIcon, UserPlus, Plus, FileText, Lightbulb, StickyNote, List, LayoutGrid } from 'lucide-react';
import { timeAgo, truncate, formatNumber, getPostExcerpt } from '@/lib/utils';

const CONTENT_FILTERS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'blog', label: 'Blogs', icon: BookOpen },
  { id: 'aiconcept', label: 'AI Concepts', icon: Bot },
  { id: 'product', label: 'Products', icon: Rocket },
];

const SIDEBAR_QUICK_FILTERS = [
  { name: 'All', key: 'all' },
  { name: 'Blog Posts', key: 'blog' },
  { name: 'AI Concepts', key: 'product' },
  { name: 'Research', key: 'research' },
  { name: 'Pulse', key: 'pulse' },
];

const getContentTypeInfo = (format) => {
  switch (format) {
    case 'product': return { label: 'Startup Concept', icon: Rocket, color: '#f59e0b' };
    case 'research': return { label: 'Research', icon: FlaskConical, color: '#3b82f6' };
    case 'pulse': return { label: 'Pulse', icon: Activity, color: '#ef4444' };
    default: return { label: 'Blog', icon: BookOpen, color: 'var(--color-text-secondary)' };
  }
};

/* ─── Three-dot Dropdown Menu ─── */
function PostMenu({ post, onClose }) {
  const menuRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}`);
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 1200);
    } catch {}
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/blog/${post.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url: shareUrl }); } catch {}
    } else {
      handleCopyLink();
    }
  };

  const menuItems = [
    { icon: copied ? Sparkles : LinkIcon, label: copied ? 'Copied!' : 'Copy Link', onClick: handleCopyLink, color: copied ? '#22c55e' : undefined },
    { icon: Share2, label: 'Share', onClick: handleShare },
    { icon: UserPlus, label: 'Follow Author', onClick: () => { onClose(); } },
    { divider: true },
    { icon: EyeOff, label: 'Not Interested', onClick: () => { onClose(); }, muted: true },
    { icon: Flag, label: 'Report', onClick: () => { onClose(); }, muted: true },
  ];

  return (
    <div ref={menuRef} className="absolute right-0 top-full mt-1 z-50 py-1.5 rounded-xl overflow-hidden animate-slide-up"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '180px' }}>
      {menuItems.map((item, i) => item.divider ? (
        <div key={i} className="my-1" style={{ borderTop: '1px solid var(--color-border-primary)' }} />
      ) : (
        <button key={i} onClick={item.onClick}
          className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] font-medium hover:bg-[var(--color-bg-hover)] transition-colors text-left cursor-pointer"
          style={{ color: item.color || (item.muted ? 'var(--color-text-muted)' : 'var(--color-text-secondary)') }}>
          <item.icon size={14} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Feed Article (List View Only) ─── */
function FeedArticle({ post, index }) {
  const [bookmarked, setBookmarked] = useState(post.userBookmarked || false);
  const [liked, setLiked] = useState(post.userLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${post._id}/bookmark`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
      }
    } catch {}
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch {}
  };

  return (
    <article className="py-6 animate-slide-up" style={{ borderBottom: '1px solid var(--color-border-primary)', animationDelay: `${index * 0.05}s` }}>
      {/* Author line */}
      <div className="flex items-center gap-2.5 mb-3">
        {post.author?.avatar ? (
          <img src={post.author.avatar} alt="" className="w-6 h-6 rounded-lg object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            {post.author?.name?.[0]?.toUpperCase()}
          </div>
        )}
        <Link href={`/profile/${post.author?.username}`} className="text-[13px] font-semibold hover:underline" style={{ color: 'var(--color-text-primary)' }}>
          {post.author?.name}
        </Link>
        {post.tags?.[0] && (
          <>
            <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>in</span>
            <Link href={`/explore?q=${encodeURIComponent(post.tags[0])}`}
              className="text-[12px] font-medium px-2.5 py-0.5 rounded-lg hover:opacity-80"
              style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
              {post.tags[0]}
            </Link>
          </>
        )}
        <span className="text-[12px] ml-auto flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
          {(() => {
            const typeInfo = getContentTypeInfo(post.format);
            const TypeIcon = typeInfo.icon;
            return (
              <span className="flex items-center gap-1.5 font-semibold hidden sm:flex">
                {post.isAiGenerated && post.format === 'product' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-white"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', boxShadow: '0 2px 6px rgba(168,85,247,0.2)' }}>
                    <Sparkles size={9} fill="currentColor" className="animate-pulse" /> AI Concept
                  </span>
                ) : (
                  <span className="flex items-center gap-1" style={{ color: typeInfo.color }}>
                    <TypeIcon size={12} /> {typeInfo.label}
                  </span>
                )}
              </span>
            );
          })()}
          <span className="hidden sm:inline">•</span>
          {timeAgo(post.publishedAt || post.createdAt)}
        </span>
      </div>

      {/* Content row */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <Link href={`/blog/${post.slug}`} className="group">
            <h2 className="text-[19px] font-bold mb-1.5 leading-snug group-hover:text-[#f59e0b] transition-colors line-clamp-2"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
              {post.title}
            </h2>
            <p className="text-[14px] leading-relaxed line-clamp-2 hidden sm:block"
              style={{ color: 'var(--color-text-tertiary)' }}>
              {getPostExcerpt(post, 160)}
            </p>
          </Link>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              {post.isFeatured && (
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'var(--color-brand-glow)', color: '#d97706' }}>
                  <Star size={11} fill="currentColor" /> Featured
                </span>
              )}
              <button onClick={handleLike}
                className="flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 text-[12px] cursor-pointer"
                style={{ color: liked ? '#ef4444' : 'var(--color-text-muted)' }}>
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {formatNumber(likesCount)}
              </button>
              <span className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                <MessageCircle size={14} /> {formatNumber(post.commentsCount || 0)}
              </span>
              <span className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                <Eye size={13} /> {formatNumber(post.viewCount || 0)}
              </span>
              {post.readTime && (
                <span className="text-[12px] flex items-center gap-1 hidden sm:flex" style={{ color: 'var(--color-text-muted)' }}>
                  <Clock size={12} /> {post.readTime} min
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={handleBookmark}
                className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-all cursor-pointer"
                style={{ color: bookmarked ? '#f59e0b' : 'var(--color-text-muted)' }}>
                <Bookmark size={16} strokeWidth={1.5} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
              <div className="relative">
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-all cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen && <PostMenu post={post} onClose={() => setMenuOpen(false)} />}
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        {post.coverImage && (
          <Link href={`/blog/${post.slug}`} className="shrink-0 hidden sm:block">
            <img src={post.coverImage} alt=""
              className="w-[128px] h-[96px] rounded-xl object-cover hover:shadow-lg transition-all" />
          </Link>
        )}
      </div>
    </article>
  );
}

function SocialCardArticle({ post, index }) {
  const [bookmarked, setBookmarked] = useState(post.userBookmarked || false);
  const [liked, setLiked] = useState(post.userLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [copied, setCopied] = useState(false);

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${post._id}/bookmark`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
      }
    } catch {}
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch {}
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}/blog/${post.slug}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const typeInfo = getContentTypeInfo(post.format);
  const TypeIcon = typeInfo.icon;

  return (
    <article className="mb-6 p-6 rounded-2xl animate-slide-up hover:shadow-md transition-all"
      style={{
        background: 'var(--color-bg-card)',
        border: post.isAiGenerated && post.format === 'product' ? '1px solid rgba(168,85,247,0.3)' : '1px solid var(--color-border-primary)',
        boxShadow: post.isAiGenerated && post.format === 'product' ? '0 4px 12px rgba(168,85,247,0.03)' : 'none',
        animationDelay: `${index * 0.05}s`
      }}>
      {/* Social Header */}
      <div className="flex items-center gap-3 mb-4">
        {post.author?.avatar ? (
          <img src={post.author.avatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-[var(--color-border-primary)]" />
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm"
            style={{ background: post.isAiGenerated && post.format === 'product' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            {post.author?.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <Link href={`/profile/${post.author?.username}`} className="text-[14px] font-bold hover:underline block leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            {post.author?.name}
          </Link>
          <span className="text-[11px] block mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            @{post.author?.username || 'writer'} · {timeAgo(post.publishedAt || post.createdAt)}
          </span>
        </div>
        
        {/* Content Type tag on right */}
        <div className="ml-auto flex items-center gap-2">
          {post.isAiGenerated && post.format === 'product' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white"
              style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', boxShadow: '0 2px 6px rgba(168,85,247,0.2)' }}>
              <Sparkles size={11} fill="currentColor" className="animate-pulse" /> AI Concept
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg"
              style={{ background: 'var(--color-bg-tertiary)', color: typeInfo.color }}>
              <TypeIcon size={11} /> {typeInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Social Post Content */}
      <Link href={`/blog/${post.slug}`} className="group block mb-4">
        <h3 className="text-[18px] font-extrabold mb-2 leading-snug group-hover:text-[#f59e0b] transition-colors"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)', letterSpacing: '-0.01em' }}>
          {post.title}
        </h3>
        <p className="text-[14.5px] leading-relaxed line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>
          {getPostExcerpt(post, 240)}
        </p>
      </Link>

      {/* Embedded Cover image */}
      {post.coverImage && (
        <Link href={`/blog/${post.slug}`} className="block mb-4 overflow-hidden rounded-xl border border-[var(--color-border-primary)]">
          <img src={post.coverImage} alt=""
            className="w-full max-h-[320px] object-cover hover:scale-[1.01] transition-all duration-300" />
        </Link>
      )}

      {/* Action footer bar */}
      <div className="flex items-center justify-between pt-3 mt-2" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
        <button onClick={handleLike}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--color-bg-hover)] transition-all text-[13px] font-medium"
          style={{ color: liked ? '#ef4444' : 'var(--color-text-muted)' }}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} strokeWidth={1.7} />
          <span>{likesCount}</span>
        </button>

        <Link href={`/blog/${post.slug}#comments`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--color-bg-hover)] transition-all text-[13px] font-medium"
          style={{ color: 'var(--color-text-muted)' }}>
          <MessageCircle size={16} strokeWidth={1.7} />
          <span>{post.commentsCount || 0}</span>
        </Link>

        <button onClick={handleBookmark}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--color-bg-hover)] transition-all text-[13px] font-medium"
          style={{ color: bookmarked ? '#f59e0b' : 'var(--color-text-muted)' }}>
          <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} strokeWidth={1.7} />
          <span>{bookmarked ? 'Saved' : 'Save'}</span>
        </button>

        <button onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--color-bg-hover)] transition-all text-[13px] font-medium"
          style={{ color: copied ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          <Share2 size={16} strokeWidth={1.7} />
          <span>{copied ? 'Copied' : 'Share'}</span>
        </button>
      </div>
    </article>
  );
}

function GridCardArticle({ post, index }) {
  const [bookmarked, setBookmarked] = useState(post.userBookmarked || false);
  const [liked, setLiked] = useState(post.userLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${post._id}/bookmark`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
      }
    } catch {}
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch {}
  };

  const typeInfo = getContentTypeInfo(post.format);
  const TypeIcon = typeInfo.icon;

  return (
    <article className="flex flex-col rounded-2xl overflow-hidden hover:shadow-md transition-all animate-slide-up"
      style={{
        background: 'var(--color-bg-card)',
        border: post.isAiGenerated && post.format === 'product' ? '1px solid rgba(168,85,247,0.3)' : '1px solid var(--color-border-primary)',
        boxShadow: post.isAiGenerated && post.format === 'product' ? '0 4px 12px rgba(168,85,247,0.03)' : 'none',
        animationDelay: `${index * 0.05}s`
      }}>
      {/* Cover image on top */}
      <Link href={`/blog/${post.slug}`} className="block relative h-48 w-full overflow-hidden bg-[var(--color-bg-tertiary)]">
        {post.coverImage ? (
          <img src={post.coverImage} alt="" className="w-full h-full object-cover hover:scale-105 transition-all duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
            <BookOpen size={36} strokeWidth={1} />
          </div>
        )}
        {post.isAiGenerated && post.format === 'product' ? (
          <span className="absolute top-3 left-3 flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-md backdrop-blur-md text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
            <Sparkles size={10} fill="currentColor" className="animate-pulse" /> AI Concept
          </span>
        ) : (
          <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md text-white shadow-sm"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
            <TypeIcon size={10} /> {typeInfo.label}
          </span>
        )}
      </Link>

      {/* Grid Content Body */}
      <div className="flex-1 flex flex-col p-5">
        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          {timeAgo(post.publishedAt || post.createdAt)}
        </span>
        <Link href={`/blog/${post.slug}`} className="group block mt-1.5 mb-2 flex-1">
          <h3 className="text-[16px] font-bold leading-snug group-hover:text-[#f59e0b] transition-colors line-clamp-2"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>
            {post.title}
          </h3>
          <p className="text-[13px] leading-relaxed line-clamp-2 mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {getPostExcerpt(post, 120)}
          </p>
        </Link>

        {/* Footer info in grid card */}
        <div className="flex items-center justify-between pt-4 mt-auto" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
          <div className="flex items-center gap-2">
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt="" className="w-5 h-5 rounded-md object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white"
                style={{ background: post.isAiGenerated && post.format === 'product' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                {post.author?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[11.5px] font-medium line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
              {post.author?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleLike}
              className="flex items-center gap-1 transition-transform hover:scale-105 active:scale-95 text-[11px] cursor-pointer"
              style={{ color: liked ? '#ef4444' : 'var(--color-text-muted)' }}>
              <Heart size={11} fill={liked ? 'currentColor' : 'none'} /> {formatNumber(likesCount)}
            </button>
            <button onClick={handleBookmark}
              className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] transition-all cursor-pointer"
              style={{ color: bookmarked ? '#f59e0b' : 'var(--color-text-muted)' }}>
              <Bookmark size={13} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function GridSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-[var(--color-border-primary)] animate-pulse" style={{ background: 'var(--color-bg-card)' }}>
      <div className="h-48 w-full bg-[var(--color-bg-tertiary)]" />
      <div className="flex-1 p-5 flex flex-col gap-3">
        <div className="h-3 w-16 bg-[var(--color-bg-tertiary)] rounded-full" />
        <div className="h-5 w-5/6 bg-[var(--color-bg-tertiary)] rounded-full mb-1" />
        <div className="h-4 w-full bg-[var(--color-bg-tertiary)] rounded-full" />
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--color-border-primary)]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[var(--color-bg-tertiary)]" />
            <div className="h-3 w-20 bg-[var(--color-bg-tertiary)] rounded-full" />
          </div>
          <div className="h-4 w-12 bg-[var(--color-bg-tertiary)] rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Trending Sidebar Card (Enhanced with thumbnails) ─── */
function TrendingCard({ item }) {
  const typeConfig = {
    blog: { label: 'Blog', icon: BookOpen, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    research: { label: 'Research', icon: FlaskConical, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    pulse: { label: 'Pulse', icon: Activity, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    product: { label: 'Product', icon: Rocket, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  };
  const t = typeConfig[item._type] || typeConfig.blog;
  const isAiProduct = item._type === 'product' && item.isAiGenerated;
  const badgeLabel = isAiProduct ? 'AI Concept' : t.label;
  const badgeColor = isAiProduct ? '#a855f7' : t.color;
  const badgeBg = isAiProduct ? 'rgba(168,85,247,0.1)' : t.bg;
  const TypeIcon = isAiProduct ? Sparkles : t.icon;

  const isInternal = item._type === 'blog' || item._type === 'product';
  const href = isInternal
    ? `/blog/${item.slug}`
    : item.sourceUrl || '#';
  const isExternal = !isInternal;

  return (
    <div className="mb-3.5 pb-3.5" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
      <div className="flex gap-3">
        {/* Thumbnail */}
        {item.coverImage && (
          <Link href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}
            className="shrink-0">
            <img src={item.coverImage} alt="" className="w-[56px] h-[42px] rounded-lg object-cover" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: badgeBg, color: badgeColor }}>
              <TypeIcon size={9} className={isAiProduct ? 'animate-pulse' : ''} /> {badgeLabel}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {timeAgo(item.publishedAt || item.createdAt)}
            </span>
          </div>
          <Link href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}>
            <h4 className="text-[12.5px] font-bold leading-snug hover:text-[#f59e0b] transition-colors line-clamp-2"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>
              {item.title}
            </h4>
          </Link>
          {item.author?.name && (
            <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {item.author.name}
            </p>
          )}
          {item.sourceName && !item.author?.name && (
            <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {item.sourceName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── AI Concept of the Day Card ─── */
function AiConceptOfTheDay({ items }) {
  const aiConcept = items.find(item => item._type === 'product' && item.isAiGenerated);
  if (!aiConcept) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(99,102,241,0.06))', border: '1px solid rgba(168,85,247,0.15)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
          style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
          <Sparkles size={10} fill="currentColor" className="animate-pulse" /> AI Pick
        </span>
        <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Concept of the Day</span>
      </div>
      {aiConcept.coverImage && (
        <Link href={`/blog/${aiConcept.slug}`} className="block mb-3 overflow-hidden rounded-xl">
          <img src={aiConcept.coverImage} alt="" className="w-full h-[100px] object-cover hover:scale-105 transition-all duration-500" />
        </Link>
      )}
      <Link href={`/blog/${aiConcept.slug}`}>
        <h4 className="text-[14px] font-bold leading-snug hover:text-[#a855f7] transition-colors line-clamp-2 mb-1.5"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>
          {aiConcept.title}
        </h4>
      </Link>
      <p className="text-[12px] leading-relaxed line-clamp-2 mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
        {getPostExcerpt(aiConcept, 100)}
      </p>
      <Link href={`/blog/${aiConcept.slug}`}
        className="text-[11px] font-bold inline-flex items-center gap-1 hover:gap-2 transition-all"
        style={{ color: '#a855f7' }}>
        Explore concept <ArrowUpRight size={11} />
      </Link>
    </div>
  );
}

/* ─── Skeleton Loaders ─── */
function ArticleSkeleton() {
  return (
    <div className="py-6" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton w-6 h-6 rounded-lg" />
        <div className="skeleton h-3 w-40 rounded-lg" />
      </div>
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="skeleton h-5 w-3/4 mb-2 rounded-lg" />
          <div className="skeleton h-4 w-full mb-1 rounded-lg" />
          <div className="skeleton h-4 w-2/3 rounded-lg" />
          <div className="flex gap-3 mt-4">
            <div className="skeleton h-3 w-16 rounded-lg" />
            <div className="skeleton h-3 w-12 rounded-lg" />
            <div className="skeleton h-3 w-12 rounded-lg" />
          </div>
        </div>
        <div className="skeleton w-[128px] h-[96px] rounded-xl shrink-0 hidden sm:block" />
      </div>
    </div>
  );
}

/* ─── Welcome Hero Banner ─── */
function WelcomeBanner({ user, onDismiss }) {
  return (
    <div className="relative mb-8 p-6 rounded-2xl overflow-hidden animate-slide-up"
      style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7, #fff7ed)', border: '1px solid rgba(245,158,11,0.15)' }}>
      <button onClick={onDismiss}
        className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/60 transition-all cursor-pointer"
        style={{ color: 'var(--color-text-muted)' }}>
        <X size={16} />
      </button>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
          <SquarePen size={22} className="text-white" />
        </div>
        <div>
          <h3 className="text-[18px] font-bold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>
            Welcome to BlogWrite{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </h3>
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Your all-in-one platform for writing, learning, and sharing knowledge. Explore AI-generated concepts, write with LaTeX & Markdown, or discover research papers.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/posts/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
              <SquarePen size={13} /> Start Writing
            </Link>
            <Link href="/explore"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:shadow-sm hover:-translate-y-0.5"
              style={{ background: 'white', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}>
              <BookOpen size={13} /> Explore Content
            </Link>
            <Link href="/dashboard/product-launch"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:shadow-sm hover:-translate-y-0.5"
              style={{ background: 'white', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}>
              <Sparkles size={13} /> AI Concepts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function DashboardHome() {
  const { user } = useAuth();
  const [tab, setTab] = useState('foryou');
  const [contentFilter, setContentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [accumulatedPosts, setAccumulatedPosts] = useState([]);
  const [sidebarItems, setSidebarItems] = useState([]);
  const [sidebarFilter, setSidebarFilter] = useState('all');
  const [showWelcome, setShowWelcome] = useState(false);
  const [viewStyle, setViewStyle] = useState('list');

  // Load view style from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('feed_view_style');
    if (saved && ['list', 'social', 'grid'].includes(saved)) {
      setViewStyle(saved);
    }
  }, []);

  const handleSetViewStyle = (style) => {
    setViewStyle(style);
    localStorage.setItem('feed_view_style', style);
  };

  // Check if user should see welcome banner
  useEffect(() => {
    const dismissed = localStorage.getItem('blogwrite_welcome_dismissed');
    if (!dismissed) setShowWelcome(true);
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('blogwrite_welcome_dismissed', '1');
  };

  const feedUrl = tab === 'foryou'
    ? `/api/feed?type=personalized&page=${page}&limit=10${contentFilter !== 'all' ? `&format=${contentFilter}` : ''}`
    : `/api/feed?type=trending&page=${page}&limit=10${contentFilter !== 'all' ? `&format=${contentFilter}` : ''}`;

  const { data: feedData, isLoading: feedLoading, isValidating: feedValidating } = useSWRFetch(feedUrl);

  // Reset page and accumulated posts on tab or filter change
  useEffect(() => {
    setPage(1);
    setAccumulatedPosts([]);
  }, [tab, contentFilter]);

  // Accumulate posts as they are loaded
  useEffect(() => {
    if (feedData?.posts) {
      if (page === 1) {
        setAccumulatedPosts(feedData.posts);
      } else {
        setAccumulatedPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const newPosts = feedData.posts.filter(p => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
      }
    }
  }, [feedData?.posts, page]);

  // Fetch mixed sidebar content: blogs + research + pulse
  useEffect(() => {
    Promise.all([
      fetch('/api/feed?type=trending&limit=8').then(r => r.json()).catch(() => ({ posts: [] })),
      fetch('/api/research?sort=trending&limit=4').then(r => r.json()).catch(() => ({ papers: [] })),
      fetch('/api/news?sort=trending&limit=4').then(r => r.json()).catch(() => ({ articles: [] })),
    ]).then(([blogData, researchData, newsData]) => {
      const blogs = (blogData.posts || []).map(p => ({ ...p, _type: p.format === 'product' ? 'product' : 'blog' }));
      const papers = (researchData.papers || []).map(p => ({ ...p, _type: 'research' }));
      const news = (newsData.articles || []).map(a => ({ ...a, _type: 'pulse' }));
      // Merge and sort by date
      const all = [...blogs, ...papers, ...news].sort(
        (a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt)
      );
      setSidebarItems(all);
    });
  }, []);

  const loadMore = useCallback(() => {
    if (feedData?.hasMore && !feedLoading && !feedValidating && feedData?.page === page) {
      setPage(p => p + 1);
    }
  }, [feedData, feedLoading, feedValidating, page]);
  const loaderRef = useInfiniteScroll(loadMore);

  const posts = accumulatedPosts;
  // Sidebar: exclude items already showing in the main feed, and apply sidebar filter
  const mainFeedIds = new Set(posts.map(p => p._id));
  const filteredSidebarItems = sidebarItems
    .filter(item => !mainFeedIds.has(item._id))
    .filter(item => sidebarFilter === 'all' || item._type === sidebarFilter);
  const trendingItems = filteredSidebarItems.slice(0, 7);

  return (
    <div className="flex">
      {/* Main Feed */}
      <div className="flex-1 min-w-0 px-8 lg:px-12 pt-6 pb-12" style={{ borderRight: '1px solid var(--color-border-primary)' }}>
        {/* Sticky Control Header */}
        <div className="sticky top-[52px] md:top-0 z-10 py-4 mb-2 glass" style={{ borderBottom: '1px solid var(--color-border-primary)', backdropFilter: 'blur(12px)' }}>
          {/* Feed source selector (For You / Trending) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] p-0.5 rounded-xl border border-[var(--color-border-primary)] shadow-sm">
              <button
                onClick={() => setTab('foryou')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                  tab === 'foryou'
                    ? 'bg-[var(--color-bg-card)] shadow-xs scale-[1.02]'
                    : 'hover:bg-[var(--color-bg-hover)]'
                }`}
                style={{ color: tab === 'foryou' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
              >
                <Sparkles size={13} className={tab === 'foryou' ? 'text-[#f59e0b]' : 'text-gray-400'} />
                <span>For You</span>
              </button>
              <button
                onClick={() => setTab('trending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                  tab === 'trending'
                    ? 'bg-[var(--color-bg-card)] shadow-xs scale-[1.02]'
                    : 'hover:bg-[var(--color-bg-hover)]'
                }`}
                style={{ color: tab === 'trending' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
              >
                <Flame size={13} className={tab === 'trending' ? 'text-[#f59e0b]' : 'text-gray-400'} />
                <span>Trending</span>
              </button>
            </div>

            {/* Feed view style selector */}
            <div className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] p-0.5 rounded-xl border border-[var(--color-border-primary)] shadow-sm">
              <button
                onClick={() => handleSetViewStyle('list')}
                title="Classic List"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewStyle === 'list'
                    ? 'bg-[var(--color-bg-card)] shadow-xs scale-[1.02]'
                    : 'hover:bg-[var(--color-bg-hover)]'
                }`}
                style={{ color: viewStyle === 'list' ? 'var(--color-brand)' : 'var(--color-text-muted)' }}
              >
                <List size={15} />
              </button>
              <button
                onClick={() => handleSetViewStyle('social')}
                title="Social Card"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewStyle === 'social'
                    ? 'bg-[var(--color-bg-card)] shadow-xs scale-[1.02]'
                    : 'hover:bg-[var(--color-bg-hover)]'
                }`}
                style={{ color: viewStyle === 'social' ? 'var(--color-brand)' : 'var(--color-text-muted)' }}
              >
                <MessageSquare size={15} />
              </button>
              <button
                onClick={() => handleSetViewStyle('grid')}
                title="Visual Grid"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewStyle === 'grid'
                    ? 'bg-[var(--color-bg-card)] shadow-xs scale-[1.02]'
                    : 'hover:bg-[var(--color-bg-hover)]'
                }`}
                style={{ color: viewStyle === 'grid' ? 'var(--color-brand)' : 'var(--color-text-muted)' }}
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>

          {/* Content Type Filter Chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar">
            {CONTENT_FILTERS.map(filter => {
              const Icon = filter.icon;
              const isActive = contentFilter === filter.id;
              return (
                <button key={filter.id}
                  onClick={() => setContentFilter(filter.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer"
                  style={{
                    background: isActive ? 'var(--color-text-primary)' : 'var(--color-bg-tertiary)',
                    color: isActive ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
                    border: isActive ? 'none' : '1px solid var(--color-border-primary)',
                  }}>
                  <Icon size={12} />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Welcome Banner */}
        {showWelcome && <WelcomeBanner user={user} onDismiss={dismissWelcome} />}

        {/* Articles Feed */}
        <div>
          {feedLoading && posts.length === 0 && (
            <div className={viewStyle === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'flex flex-col'}>
              {viewStyle === 'grid' ? (
                <>
                  <GridSkeleton />
                  <GridSkeleton />
                  <GridSkeleton />
                  <GridSkeleton />
                </>
              ) : (
                <>
                  <ArticleSkeleton />
                  <ArticleSkeleton />
                  <ArticleSkeleton />
                  <ArticleSkeleton />
                </>
              )}
            </div>
          )}

          <div className={viewStyle === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'flex flex-col'}>
            {posts.map((post, i) => {
              if (viewStyle === 'social') {
                return <SocialCardArticle key={post._id} post={post} index={i} />;
              }
              if (viewStyle === 'grid') {
                return <GridCardArticle key={post._id} post={post} index={i} />;
              }
              return <FeedArticle key={post._id} post={post} index={i} />;
            })}
          </div>

          {posts.length === 0 && !feedLoading && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'var(--color-bg-tertiary)' }}>
                <SquarePen size={28} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>
                {contentFilter !== 'all' ? `No ${CONTENT_FILTERS.find(f => f.id === contentFilter)?.label} found` : 'Your feed is empty'}
              </h3>
              <p className="text-[14px] mb-8 max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                {contentFilter !== 'all'
                  ? 'Try selecting a different content type or check back later.'
                  : 'Follow writers and topics to see stories here, or start writing your own.'}
              </p>
              <div className="flex gap-3 justify-center">
                {contentFilter !== 'all' ? (
                  <button onClick={() => setContentFilter('all')} className="px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:shadow-md cursor-pointer"
                    style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg-primary)' }}>
                    Show all content
                  </button>
                ) : (
                  <>
                    <Link href="/explore" className="px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:shadow-md"
                      style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg-primary)' }}>
                      Explore stories
                    </Link>
                    <Link href="/dashboard/posts/new" className="px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:bg-[var(--color-bg-hover)]"
                      style={{ border: '1.5px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}>
                      Start writing
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {feedData?.hasMore && <div ref={loaderRef} className="h-10 mt-6" />}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:block w-[340px] shrink-0 sticky top-6 h-[calc(100vh-24px)] overflow-y-auto py-6 px-8">
        {/* AI Concept of the Day */}
        <AiConceptOfTheDay items={sidebarItems} />

        {/* Trending Now — mixed content */}
        <div className="mb-8 p-5 rounded-2xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Flame size={16} style={{ color: '#f59e0b' }} />
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Trending Now</h3>
          </div>

          {/* Quick Filters for sidebar */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {SIDEBAR_QUICK_FILTERS.map(f => (
              <button key={f.key}
                onClick={() => setSidebarFilter(f.key)}
                className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer"
                style={{
                  background: sidebarFilter === f.key ? 'var(--color-text-primary)' : 'var(--color-bg-tertiary)',
                  color: sidebarFilter === f.key ? 'var(--color-bg-primary)' : 'var(--color-text-muted)',
                  border: sidebarFilter === f.key ? 'none' : '1px solid var(--color-border-primary)',
                }}>
                {f.name}
              </button>
            ))}
          </div>

          {trendingItems.length > 0 ? (
            trendingItems.map(item => <TrendingCard key={`${item._type}-${item._id}`} item={item} />)
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2"><div className="skeleton w-12 h-4 rounded-md" /><div className="skeleton h-3 w-16 rounded-lg" /></div>
              <div className="skeleton h-4 w-full mb-1 rounded-lg" /><div className="skeleton h-4 w-3/4 mb-1 rounded-lg" /><div className="skeleton h-3 w-16 mt-1 mb-5 rounded-lg" />
              <div className="flex items-center gap-2 mb-2"><div className="skeleton w-12 h-4 rounded-md" /><div className="skeleton h-3 w-16 rounded-lg" /></div>
              <div className="skeleton h-4 w-full mb-1 rounded-lg" /><div className="skeleton h-4 w-2/3 mb-1 rounded-lg" /><div className="skeleton h-3 w-16 mt-1 rounded-lg" />
            </>
          )}
          <Link href="/explore" className="text-[12px] font-semibold hover:underline mt-1 inline-flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
            See the full list <ArrowUpRight size={11} />
          </Link>
        </div>

        {/* Footer links */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] px-1" style={{ color: 'var(--color-text-muted)' }}>
          {['Help', 'Status', 'About', 'Blog', 'Privacy', 'Terms'].map(link => (
            <span key={link} className="hover:underline cursor-pointer hover:text-[#999]">{link}</span>
          ))}
        </div>
      </aside>

    </div>
  );
}

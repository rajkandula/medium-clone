'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Rocket, ExternalLink, Heart, Eye, ArrowUpRight, Sparkles, Flame, Clock, Trophy, Tag, Search, Plus, X, ChevronRight, Star, Zap, Cloud, Bot, Wrench, Palette, Code, Bookmark, BookmarkCheck, Database, HeartPulse, Landmark, GraduationCap, Leaf, Shield, Gamepad2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { timeAgo, formatNumber, getPostExcerpt } from '@/lib/utils';

const CATEGORIES = [
  { key: 'all', label: 'All Concepts', icon: Rocket },
  { key: 'developer', label: 'Developer', icon: Wrench },
  { key: 'data', label: 'Data', icon: Database },
  { key: 'design', label: 'Design', icon: Palette },
  { key: 'productivity', label: 'Productivity', icon: Zap },
  { key: 'health', label: 'Health', icon: HeartPulse },
  { key: 'finance', label: 'Fintech', icon: Landmark },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'climate', label: 'Climate', icon: Leaf },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'gaming', label: 'Gaming', icon: Gamepad2 },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest', icon: Clock },
  { key: 'trending', label: 'Trending', icon: Flame },
  { key: 'top', label: 'Top Voted', icon: Trophy },
];

function LaunchCard({ post, featured = false }) {
  const [liked, setLiked] = useState(post.userLiked || false);
  const [likeCount, setLikeCount] = useState(post.likesCount || 0);
  const [saved, setSaved] = useState(post.userBookmarked || false);
  const excerpt = getPostExcerpt(post, featured ? 160 : 110);
  const displayIcon = post.appIcon;

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likesCount);
      }
    } catch {}
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${post._id}/bookmark`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSaved(data.bookmarked);
      }
    } catch {}
  };

  if (featured) {
    return (
      <Link href={`/dashboard/read/${post.slug || post._id}`}
        className="group relative block rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
        style={{
          background: 'var(--color-bg-card)',
          border: post.isAiGenerated ? '1px solid rgba(168,85,247,0.4)' : '1px solid var(--color-border-primary)',
          boxShadow: post.isAiGenerated ? '0 10px 30px -10px rgba(168,85,247,0.1)' : '0 10px 30px -10px rgba(0,0,0,0.05)'
        }}>
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.06] blur-[80px] pointer-events-none"
          style={{
            background: post.isAiGenerated ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
            transform: 'translate(20%, -20%)'
          }} />
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-8 items-stretch relative z-10">
          
          {/* Left Column: Product Info */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Badge & Meta */}
              <div className="flex items-center gap-2">
                {post.isAiGenerated ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', boxShadow: '0 4px 10px rgba(168,85,247,0.2)' }}>
                    <Sparkles size={10} fill="currentColor" className="animate-pulse" /> AI Concept
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 10px rgba(245,158,11,0.2)' }}>
                    <Star size={10} fill="currentColor" /> Featured Launch
                  </span>
                )}
                {post.tags?.[0] && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
                    style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>
                    #{post.tags[0]}
                  </span>
                )}
              </div>

              {/* Title & Excerpt */}
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-black tracking-tight group-hover:text-[var(--color-brand)] transition-colors duration-200"
                  style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                  {post.appName || post.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {excerpt}
                </p>
              </div>
            </div>

            {/* Bottom Panel: Author & Metrics */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
              <div className="flex items-center gap-2.5">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                    style={{ background: post.isAiGenerated ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                    {post.author?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-[11px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{post.author?.name}</div>
                  <div className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>{post.isAiGenerated ? 'AI Designer' : 'Product Maker'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                <span className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] px-2.5 py-1 rounded-lg"><Eye size={11} /> {formatNumber(post.viewCount || 0)}</span>
                <button onClick={handleLike}
                  className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] px-2.5 py-1 rounded-lg transition-transform hover:scale-105 active:scale-95 animate-fade-in"
                  style={{ color: liked ? '#ef4444' : 'var(--color-text-muted)' }}>
                  <Heart size={11} fill={liked ? 'currentColor' : 'none'} /> {formatNumber(likeCount)}
                </button>
                <button onClick={handleSave}
                  className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] px-2.5 py-1 rounded-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ color: saved ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
                  {saved ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Cover/App Showcase */}
          <div className="w-full md:w-5/12 shrink-0 relative flex items-center justify-center rounded-2xl overflow-hidden min-h-[200px]"
            style={{
              background: post.isAiGenerated ? 'linear-gradient(135deg, #0e051d 0%, #170c2e 100%)' : 'linear-gradient(135deg, #0a0a0a 0%, #1c1106 100%)',
              border: '1px solid var(--color-border-primary)'
            }}>
            {post.coverImage ? (
              <img src={post.coverImage} alt={post.appName || post.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-3xl font-extrabold text-white overflow-hidden shadow-2xl transition-transform group-hover:rotate-3 duration-300"
                  style={{
                    background: displayIcon ? '#fff' : post.isAiGenerated ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    boxShadow: post.isAiGenerated ? '0 10px 30px rgba(168,85,247,0.3)' : '0 10px 30px rgba(245,158,11,0.3)'
                  }}>
                  {displayIcon
                    ? <img src={displayIcon} alt="" className="w-full h-full object-cover" />
                    : ((post.appName || post.title)?.[0]?.toUpperCase() || '🚀')}
                </div>
              </div>
            )}
            <ArrowUpRight size={18} className="absolute top-4 right-4 text-white/50 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all duration-200" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/dashboard/read/${post.slug || post._id}`}
      className={`group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:shadow-lg ${
        post.isAiGenerated ? 'hover:border-purple-500' : 'hover:border-[var(--color-brand)]'
      }`}
      style={{
        background: 'var(--color-bg-card)',
        border: post.isAiGenerated ? '1px solid rgba(168,85,247,0.3)' : '1px solid var(--color-border-primary)',
        boxShadow: post.isAiGenerated ? '0 4px 12px rgba(168,85,247,0.03)' : '0 2px 8px rgba(0,0,0,0.01)'
      }}>
      {/* Icon/Thumbnail */}
      <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-xl font-bold text-white overflow-hidden transition-transform duration-300 group-hover:scale-105"
        style={{
          background: displayIcon ? '#fff' : post.isAiGenerated ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
          border: '1px solid var(--color-border-primary)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
        }}>
        {displayIcon
          ? <img src={displayIcon} alt="" className="w-full h-full object-cover" />
          : post.coverImage
            ? <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
            : ((post.appName || post.title)?.[0]?.toUpperCase() || '🚀')}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-bold truncate group-hover:text-[var(--color-brand)] transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}>
              {post.appName || post.title}
            </h3>
            {post.isAiGenerated && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', boxShadow: '0 2px 6px rgba(168,85,247,0.2)' }}>
                <Sparkles size={8} fill="currentColor" className="animate-pulse" /> AI Concept
              </span>
            )}
          </div>
          <ArrowUpRight size={14} className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {excerpt}
        </p>
        <div className="flex items-center gap-3 pt-1 text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          <span className="capitalize">{timeAgo(post.publishedAt || post.createdAt)}</span>
          <span className="flex items-center gap-0.5"><Eye size={10} /> {formatNumber(post.viewCount || 0)}</span>
          <button onClick={handleLike}
            className="flex items-center gap-0.5 transition-colors hover:text-red-400"
            style={{ color: liked ? '#ef4444' : 'var(--color-text-muted)' }}>
            <Heart size={10} fill={liked ? 'currentColor' : 'none'} /> {formatNumber(likeCount)}
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-0.5 transition-colors hover:text-[var(--color-brand)]"
            style={{ color: saved ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
            {saved ? <BookmarkCheck size={10} /> : <Bookmark size={10} />}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function ProductLaunchPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/posts?status=published&limit=50')
      .then(r => r.json())
      .then(data => {
        const productPosts = (data.posts || []).filter(p =>
          p.format === 'product'
        );
        setPosts(productPosts);
        setLoading(false);
      })
      .catch(() => {
        setPosts([]);
        setLoading(false);
      });
  }, []);

  const filtered = posts.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      return p.title?.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q));
    }
    if (category !== 'all') {
      return p.tags?.some(t => t.toLowerCase().includes(category));
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'trending') return (b.viewCount || 0) - (a.viewCount || 0);
    if (sort === 'top') return (b.likesCount || 0) - (a.likesCount || 0);
    return new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt);
  });

  const featured = sorted.slice(0, 1);
  const rest = sorted.slice(1);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 min-h-screen">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              boxShadow: '0 8px 24px -6px rgba(245,158,11,0.4)',
            }}>
            <Rocket size={26} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              Startup Concepts
            </h1>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              Discover {posts.length} AI-generated startup concepts
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10 items-start">
        
        {/* Main Content */}
        <div className="space-y-8">
          {/* ── Search & Filter ── */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200" 
                style={{ color: searchFocused ? 'var(--color-brand)' : 'var(--color-text-muted)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products or tags..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium border outline-none transition-all duration-300"
                style={{
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                  borderColor: searchFocused ? 'var(--color-brand)' : 'var(--color-border-primary)',
                  boxShadow: searchFocused ? '0 0 0 4px var(--color-brand-glow)' : 'none',
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1.5 shrink-0 scrollbar-thin hide-scrollbar">
              {SORT_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isActive = sort === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className="flex items-center gap-2 px-4.5 py-3 rounded-2xl text-xs font-bold border whitespace-nowrap cursor-pointer transition-all duration-300 transform active:scale-95 shadow-sm"
                    style={{
                      background: isActive ? 'var(--color-brand-glow)' : 'var(--color-bg-card)',
                      color: isActive ? 'var(--color-brand)' : 'var(--color-text-muted)',
                      borderColor: isActive ? 'var(--color-brand)' : 'var(--color-border-primary)',
                    }}
                  >
                    <Icon size={14} /> {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl animate-pulse border"
                  style={{
                    background: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border-primary)',
                  }} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && sorted.length === 0 && (
            <div className="text-center py-20 px-4 rounded-3xl border-2 border-dashed transition-colors"
              style={{
                borderColor: 'var(--color-border-primary)',
                background: 'var(--color-bg-card)'
              }}>
              <Rocket size={52} className="mx-auto mb-5 opacity-40 animate-bounce" style={{ color: 'var(--color-text-muted)' }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {search ? 'No products found' : 'No launches yet'}
              </h3>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {search ? `No products match "${search}". Try another query.` : 'Be the first to share your product with the world!'}
              </p>
            </div>
          )}

          {/* Product List */}
          {!loading && sorted.length > 0 && (
            <div className="space-y-10">
              
              {/* Featured Launch */}
              {featured.length > 0 && !search && category === 'all' && sort === 'newest' && (
                <div className="space-y-4">
                  <h2 className="text-[15px] font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                    <Sparkles size={16} className="text-amber-500 fill-amber-500 animate-pulse" /> Concept of the Week
                  </h2>
                  <LaunchCard post={featured[0]} featured />
                </div>
              )}

              {/* All other launches */}
              <div className="space-y-4">
                <h2 className="text-[15px] font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <Clock size={16} className="text-gray-400" /> {search ? 'Search Results' : 'Recent Concepts'}
                </h2>
                <div className="flex flex-col gap-4">
                  {(search || category !== 'all' || sort !== 'newest' ? sorted : rest).map(post => (
                    <LaunchCard key={post._id} post={post} />
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="lg:sticky lg:top-24 space-y-6 w-full lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-1.5">
          
          {/* Categories */}
          <div className="p-5 rounded-3xl border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-primary)' }}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 px-2" style={{ color: 'var(--color-text-primary)' }}>
              Categories
            </h3>
            <div className="flex flex-col gap-1.5">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 cursor-pointer text-left hover:-translate-y-[1px] active:translate-y-0"
                    style={{
                      background: isActive ? 'var(--color-brand-glow)' : 'transparent',
                      color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? 'text-[var(--color-brand)]' : 'text-gray-400 group-hover:text-[var(--color-text-primary)] transition-colors'} />
                      <span>{cat.label}</span>
                    </div>
                    {isActive ? (
                      <ChevronRight size={14} className="text-[var(--color-brand)]" />
                    ) : (
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity translate-x-1 group-hover:translate-x-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top Products Widget */}
          <div className="p-5 rounded-3xl border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-primary)' }}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 px-2 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Flame size={15} className="text-amber-500 fill-amber-500" /> Trending This Week
            </h3>
            {!loading && sorted.length > 0 ? (
              <div className="flex flex-col gap-4">
                {[...sorted].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 4).map((post, i) => (
                  <Link key={post._id} href={`/dashboard/read/${post.slug || post._id}`} className="group flex items-center gap-3.5 hover:no-underline">
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border shadow-sm transition-transform duration-300 group-hover:scale-105"
                      style={{
                        background: post.appIcon ? '#fff' : post.isAiGenerated ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                        borderColor: post.appIcon ? 'var(--color-border-primary)' : 'transparent'
                      }}>
                      {post.appIcon ? (
                        <img src={post.appIcon} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-white select-none">
                          {((post.appName || post.title)?.[0]?.toUpperCase() || '🚀')}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-[13px] font-bold mb-1 truncate group-hover:text-[var(--color-brand)] transition-colors duration-200" style={{ color: 'var(--color-text-primary)' }}>
                          {post.appName || post.title}
                        </h4>
                        {post.isAiGenerated && (
                          <span className="inline-flex items-center text-[7px] font-extrabold uppercase px-1 py-0.5 rounded text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                            AI Concept
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="flex items-center gap-0.5"><Eye size={10} /> {formatNumber(post.viewCount || 0)}</span>
                        <span className="flex items-center gap-0.5"><Heart size={10} /> {formatNumber(post.likesCount || 0)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-xs font-semibold py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                No trending products yet
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}

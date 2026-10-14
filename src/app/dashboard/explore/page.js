'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, TrendingUp, Sparkles, Heart, Eye, MessageCircle, Hash, X, Compass } from 'lucide-react';
import { timeAgo, truncate, formatNumber, getPostExcerpt } from '@/lib/utils';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'technology', label: '💻 Technology' },
  { key: 'design', label: '🎨 Design' },
  { key: 'business', label: '📈 Business' },
  { key: 'lifestyle', label: '🌿 Lifestyle' },
  { key: 'science', label: '🔬 Science' },
  { key: 'writing', label: '✍️ Writing' },
  { key: 'health', label: '🏃 Health' },
];

function ExploreCard({ post, size = 'normal' }) {
  const isLarge = size === 'large';

  return (
    <Link href={`/blog/${post.slug}`}
      className="group relative block rounded-2xl overflow-hidden"
      style={{
        gridRow: isLarge ? 'span 2' : 'span 1',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-primary)',
      }}>
      {post.coverImage ? (
        <div className={`overflow-hidden ${isLarge ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
          <img src={post.coverImage} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-white font-bold text-[15px] leading-snug mb-2 line-clamp-2">{post.title}</h3>
              <div className="flex items-center gap-4">
                <span className="text-white/80 text-xs flex items-center gap-1">
                  <Heart size={13} fill="white" /> {formatNumber(post.likesCount || 0)}
                </span>
                <span className="text-white/80 text-xs flex items-center gap-1">
                  <MessageCircle size={13} /> {formatNumber(post.commentsCount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${isLarge ? 'aspect-[3/4]' : 'aspect-[4/3]'} p-6 flex flex-col justify-between`}
          style={{ background: `linear-gradient(135deg, var(--color-bg-hover), var(--color-bg-card))` }}>
          <div>
            {post.tags?.length > 0 && (
              <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium mb-3"
                style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>
                {post.tags[0]}
              </span>
            )}
            <h3 className="font-bold leading-snug line-clamp-3 group-hover:text-[#f59e0b] transition-colors"
              style={{ color: 'var(--color-text-primary)', fontSize: isLarge ? 22 : 16 }}>
              {post.title}
            </h3>
            {isLarge && (
              <p className="text-[13px] mt-2 line-clamp-2" style={{ color: 'var(--color-text-tertiary)' }}>
                {getPostExcerpt(post, 100)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-auto pt-4">
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                {post.author?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>{post.author?.name}</span>
            <span className="text-[11px] ml-auto" style={{ color: 'var(--color-text-muted)' }}>{post.readTime || 3} min</span>
          </div>
        </div>
      )}
    </Link>
  );
}

function SearchResultCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="flex gap-4 p-4 rounded-xl transition-all hover:bg-[var(--color-bg-hover)] group">
      {post.coverImage && (
        <img src={post.coverImage} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform" />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-semibold line-clamp-2 group-hover:text-[#f59e0b] transition-colors"
          style={{ color: 'var(--color-text-primary)' }}>
          {post.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
          ) : (
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
              {post.author?.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>{post.author?.name}</span>
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>· {timeAgo(post.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
            <Heart size={11} /> {formatNumber(post.likesCount || 0)}
          </span>
          <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
            <MessageCircle size={11} /> {formatNumber(post.commentsCount || 0)}
          </span>
          {post.tags?.[0] && (
            <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto"
              style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-tertiary)' }}>
              {post.tags[0]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('personalized');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [page, setPage] = useState(1);
  const [accumulatedPosts, setAccumulatedPosts] = useState([]);
  const debouncedSearch = useDebounce(search, 400);

  const feedUrl = debouncedSearch
    ? `/api/search?q=${encodeURIComponent(debouncedSearch)}&page=${page}`
    : `/api/feed?type=${tab}&page=${page}`;
  const { data, isLoading, isValidating } = useSWRFetch(feedUrl);

  // Reset page and accumulated posts on tab/search/category change
  useEffect(() => {
    setPage(1);
    setAccumulatedPosts([]);
  }, [tab, debouncedSearch, category]);

  // Accumulate posts as they are loaded
  useEffect(() => {
    if (data?.posts) {
      if (page === 1) {
        setAccumulatedPosts(data.posts);
      } else {
        setAccumulatedPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const newPosts = data.posts.filter(p => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
      }
    }
  }, [data?.posts, page]);

  const posts = accumulatedPosts;

  const loadMore = useCallback(() => {
    if (data?.hasMore && !isLoading && !isValidating && data?.page === page) {
      setPage(p => p + 1);
    }
  }, [data, isLoading, isValidating, page]);
  const loaderRef = useInfiniteScroll(loadMore);

  const isSearching = debouncedSearch.length > 0;

  return (
    <div className="px-6 py-8 w-full">
      {/* Search bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: searchFocused ? '#f59e0b' : 'var(--color-text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl text-[15px] font-medium focus:outline-none transition-all"
            style={{
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: `2px solid ${searchFocused ? '#f59e0b' : 'var(--color-border-primary)'}`,
              boxShadow: searchFocused ? '0 0 0 4px rgba(245,158,11,0.1)' : 'none',
            }}
            placeholder="Search posts, topics, writers..."
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-bg-hover)]"
              style={{ color: 'var(--color-text-muted)' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Not searching — show tabs + categories + grid */}
      {!isSearching ? (
        <>


          {/* Instagram-style Grid */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {posts.map((post, i) => (
                <ExploreCard key={post._id} post={post} size={i % 7 === 0 ? 'large' : 'normal'} />
              ))}
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border-primary)' }}>
                  <div className="skeleton aspect-[4/3]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <Compass size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-[18px] font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Nothing to explore yet
              </p>
              <p className="text-[14px] mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
                Be the first to write a story on BlogWrite!
              </p>
              <Link href={user ? '/dashboard/posts/new' : '/signup'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                {user ? 'Write a story' : 'Get Started'}
              </Link>
            </div>
          )}
        </>
      ) : (
        /* Search results */
        <div>
          <p className="text-[14px] mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
            {isLoading ? 'Searching...' : (
              <>Results for "<strong style={{ color: 'var(--color-text-primary)' }}>{debouncedSearch}</strong>" ({data?.total || 0})</>
            )}
          </p>

          {posts.length > 0 ? (
            <div className="flex flex-col divide-y" style={{ borderColor: 'var(--color-border-primary)' }}>
              {posts.map(post => (
                <SearchResultCard key={post._id} post={post} />
              ))}
            </div>
          ) : !isLoading ? (
            <div className="text-center py-20">
              <Search size={40} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-[16px] font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No results found</p>
              <p className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
                Try different keywords or browse our categories above
              </p>
            </div>
          ) : null}
        </div>
      )}

      {data?.hasMore && <div ref={loaderRef} className="h-10" />}
    </div>
  );
}

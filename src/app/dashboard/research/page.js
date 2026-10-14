'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, ExternalLink, Loader2, RefreshCw, Share2, ArrowUpRight, FlaskConical, Bot, Code2, GitFork, TrendingUp, Flame, Clock, Star, Hash, Bookmark, BookmarkCheck, Sparkles, GraduationCap, Atom, Cpu, Dna, Coins, BarChart3, Heart, Dumbbell, Landmark } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const TOPIC_ICONS = {
  'AI': Bot,
  'Computer Science': Code2,
  'Machine Learning': GitFork,
  'Engineering': Cpu,
  'Education': GraduationCap,
  'Biology': Dna,
  'Economics': TrendingUp,
  'Finance': Coins,
  'Mathematics': Hash,
  'Physics': Atom,
  'Statistics': BarChart3,
  'Health & Fitness': Dumbbell,
  'Medical': Heart,
  'Politics & Policy': Landmark,
};

const TOPIC_COLORS = {
  'AI': { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', border: 'rgba(168,85,247,0.2)' },
  'Computer Science': { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
  'Machine Learning': { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Engineering': { bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.2)' },
  'Education': { bg: 'rgba(234,179,8,0.1)', color: '#eab308', border: 'rgba(234,179,8,0.2)' },
  'Biology': { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Economics': { bg: 'rgba(217,119,6,0.1)', color: '#d97706', border: 'rgba(217,119,6,0.2)' },
  'Finance': { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' },
  'Mathematics': { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'rgba(99,102,241,0.2)' },
  'Physics': { bg: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: 'rgba(6,182,212,0.2)' },
  'Statistics': { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: 'rgba(244,63,94,0.2)' },
  'Health & Fitness': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  'Medical': { bg: 'rgba(236,72,153,0.1)', color: '#ec4899', border: 'rgba(236,72,153,0.2)' },
  'Politics & Policy': { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'rgba(99,102,241,0.2)' },
};

/* ─── Main Paper Card ─── */
function ResearchPaperCard({ paper, isSaved: initialSaved = false, onToggleSave }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [saveCount, setSaveCount] = useState(paper.savedCount || 0);

  const handleSave = async (e) => {
    e.stopPropagation();
    setSaved(s => !s);
    setSaveCount(c => saved ? c - 1 : c + 1);
    try {
      await fetch(`/api/research/${paper._id}/save`, { method: 'POST' });
      onToggleSave?.(paper._id, !saved);
    } catch {
      setSaved(s => !s);
      setSaveCount(c => saved ? c + 1 : c - 1);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(paper.sourceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <article style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-primary)',
      borderRadius: '16px',
      padding: '24px',
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}>
      {/* Source & Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <BookOpen size={14} style={{ color: 'var(--color-brand)' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {paper.sourceName}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>·</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {timeAgo(paper.publishedAt)}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '18px', fontWeight: 700, lineHeight: 1.35,
        color: 'var(--color-brand)', marginBottom: '6px',
      }}>
        {paper.title}
      </h3>
      
      {/* Authors */}
      {paper.authors && paper.authors.length > 0 && (
        <p style={{
          fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '14px',
        }}>
          {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ` +${paper.authors.length - 3} more` : ''}
        </p>
      )}

      {/* Abstract */}
      {paper.abstract && (
        <p style={{
          fontSize: '14px', lineHeight: 1.7,
          color: 'var(--color-text-secondary)',
          marginBottom: '14px',
        }}>
          {paper.abstract.length > 300 ? paper.abstract.substring(0, 300) + '...' : paper.abstract}
        </p>
      )}

      {/* AI Insight Box */}
      {paper.keyTakeaways && paper.keyTakeaways.length > 0 && (
        <div style={{
          background: 'rgba(251, 191, 36, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={14} style={{ color: '#f59e0b' }} />
            <span style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: '#d97706',
            }}>
              AI Insight
            </span>
          </div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.75, color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
            {paper.keyTakeaways.join(' ')}
          </p>
        </div>
      )}

      {/* Topics */}
      {(paper.topics || []).length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {paper.topics.slice(0, 4).map(topic => {
            const s = TOPIC_COLORS[topic] || { bg: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)', border: 'var(--color-border-primary)' };
            return (
              <span key={topic} style={{
                padding: '3px 10px', borderRadius: '6px',
                fontSize: '11px', fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: s.bg, color: s.color,
              }}>
                {(() => { const Icon = TOPIC_ICONS[topic]; return Icon ? <Icon size={11} /> : null; })()}
                {topic}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid var(--color-border-primary)',
        paddingTop: '14px',
      }}>
        <a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', fontWeight: 600, color: 'var(--color-brand)',
            textDecoration: 'none',
          }}>
          Read Full Paper <ArrowUpRight size={14} />
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSave}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: saved ? 'var(--color-brand)' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
              padding: '4px 8px', borderRadius: '6px',
            }}
            onMouseEnter={e => { if (!saved) e.currentTarget.style.color = 'var(--color-brand)'; }}
            onMouseLeave={e => { if (!saved) e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {saveCount > 0 && <span>{saveCount}</span>}
          </button>
          <button
            onClick={handleShare}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: copied ? '#10b981' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 600, transition: 'color 0.2s',
            }}
          >
            {copied ? 'Copied!' : <Share2 size={14} />}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Sidebar Paper Item ─── */
function SidebarPaperItem({ paper, rank }) {
  return (
    <a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'flex', gap: '12px', padding: '12px',
        borderRadius: '10px', textDecoration: 'none',
        transition: 'background 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Rank number */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 800,
        background: rank <= 3 ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'var(--color-bg-tertiary)',
        color: rank <= 3 ? '#fff' : 'var(--color-text-muted)',
      }}>
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontSize: '13px', fontWeight: 600, lineHeight: 1.4,
          color: 'var(--color-text-primary)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {paper.title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {paper.authors?.[0] || paper.sourceName}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>·</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {timeAgo(paper.publishedAt)}
          </span>
        </div>
      </div>
      <ArrowUpRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '2px' }} />
    </a>
  );
}


const SORT_OPTIONS = [
  { key: 'recommended', label: 'For You', icon: Sparkles },
  { key: 'newest', label: 'Newest', icon: Clock },
  { key: 'trending', label: 'Trending', icon: Flame },
];

export default function ResearchPage() {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [savedPaperIds, setSavedPaperIds] = useState(new Set());
  const [dbTopicCounts, setDbTopicCounts] = useState({});
  const [globalTotalPapers, setGlobalTotalPapers] = useState(0);

  // Fetch user's saved papers
  useEffect(() => {
    if (!user) return;
    fetch('/api/users/me/bookmarks?type=research')
      .then(r => r.json())
      .then(data => {
        const ids = new Set((data.bookmarks || []).map(b => b.research?._id || b.research).filter(Boolean));
        setSavedPaperIds(ids);
      })
      .catch(() => {});
  }, [user]);

  const fetchPapers = useCallback(async (pageNum = 1, currentTopic = 'all', isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const url = `/api/research?page=${pageNum}&limit=20&sort=${sortBy}${currentTopic !== 'all' ? `&topic=${encodeURIComponent(currentTopic)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch research papers');
      
      const data = await res.json();
      
      if (isLoadMore) {
        setPapers(prev => [...prev, ...data.papers]);
      } else {
        setPapers(data.papers);
        setTopics(data.topics || []);
        setDbTopicCounts(data.topicCounts || {});
        setGlobalTotalPapers(data.globalTotal || 0);
      }
      
      setHasMore(data.page < data.totalPages);
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'Failed to fetch') {
        console.error('Fetch papers error:', err);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortBy]);

  useEffect(() => {
    setPage(1);
    fetchPapers(1, activeTopic, false);
  }, [activeTopic, sortBy, fetchPapers]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPapers(nextPage, activeTopic, true);
  };

  const [trendingPapers, setTrendingPapers] = useState([]);

  // Fetch sidebar trending papers separately (different from main feed)
  useEffect(() => {
    fetch('/api/research?sort=trending&limit=20')
      .then(r => r.json())
      .then(data => setTrendingPapers(data.papers || []))
      .catch(() => {});
  }, []);

  // Filter sidebar: exclude papers already visible in main feed
  const mainFeedIds = new Set(papers.map(p => p._id));
  const sidebarPapers = trendingPapers.filter(p => !mainFeedIds.has(p._id)).slice(0, 8);
  // Fallback: if everything overlaps (small dataset), show trending but skip the first few
  const displaySidebarPapers = sidebarPapers.length > 0
    ? sidebarPapers
    : trendingPapers.slice(Math.min(3, papers.length)).slice(0, 8);

  // Topic stats
  const topicCounts = dbTopicCounts;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'var(--color-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(189, 75, 0, 0.25)',
          }}>
            <BookOpen size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand)', letterSpacing: '-0.02em', margin: 0 }}>
              Research Desk
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
              Latest academic papers across AI, Tech, and more
            </p>
          </div>
        </div>
      </div>

      {/* Filter + Sort Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', marginBottom: '24px',
        borderBottom: '1px solid var(--color-border-primary)',
        paddingBottom: '12px',
      }}>
        {/* Topic pills */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1 }}>
          <button
            onClick={() => setActiveTopic('all')}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              background: activeTopic === 'all' ? 'var(--color-brand)' : 'var(--color-bg-tertiary)',
              color: activeTopic === 'all' ? '#fff' : 'var(--color-text-primary)',
            }}
          >
            All Topics
          </button>
          {topics.map(topic => (
            <button
              key={topic}
              onClick={() => setActiveTopic(topic)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                background: activeTopic === topic ? 'var(--color-brand)' : 'var(--color-bg-tertiary)',
                color: activeTopic === topic ? '#fff' : 'var(--color-text-primary)',
              }}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Sort toggles */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {SORT_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const active = sortBy === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                style={{
                  padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: active ? 'var(--color-brand)' : 'transparent',
                  color: active ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                <Icon size={12} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>

        {/* ─── Left: Main Feed ─── */}
        <div>
          {/* Loading */}
          {loading && !loadingMore ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>Finding the latest papers...</p>
            </div>
          ) : (
            <>
              {/* Paper list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {papers.map((paper, idx) => (
                  <ResearchPaperCard
                    key={paper._id || idx}
                    paper={paper}
                    isSaved={savedPaperIds.has(paper._id)}
                    onToggleSave={(id, saved) => {
                      setSavedPaperIds(prev => {
                        const next = new Set(prev);
                        saved ? next.add(id) : next.delete(id);
                        return next;
                      });
                    }}
                  />
                ))}
              </div>

              {/* Empty */}
              {papers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <FlaskConical size={48} style={{ color: 'var(--color-border-primary)', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                    No papers found
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
                    Check back later or try a different topic.
                  </p>
                </div>
              )}

              {/* Load More */}
              {hasMore && papers.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{
                      padding: '10px 24px', borderRadius: '24px', fontSize: '14px', fontWeight: 600,
                      background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border-primary)', cursor: loadingMore ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── Right Sidebar ─── */}
        <aside style={{
          position: 'sticky',
          top: '24px',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          paddingRight: '6px',
        }}>

          {/* Trending Papers */}
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-primary)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border-primary)' }}>
              <Flame size={16} style={{ color: '#ef4444' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Trending Papers
              </h3>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ height: '48px', borderRadius: '8px', background: 'var(--color-bg-tertiary)', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : displaySidebarPapers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {displaySidebarPapers.map((paper, idx) => (
                  <SidebarPaperItem key={paper._id || idx} paper={paper} rank={idx + 1} />
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No trending papers yet
              </p>
            )}
          </div>

          {/* Topics Breakdown */}
          {Object.keys(topicCounts).length > 0 && (
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border-primary)' }}>
                <Hash size={16} style={{ color: 'var(--color-brand)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Topics
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map(([topic, count]) => {
                  const s = TOPIC_COLORS[topic] || { bg: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)', border: 'var(--color-border-primary)' };
                  const Icon = TOPIC_ICONS[topic];
                  return (
                    <button
                      key={topic}
                      onClick={() => setActiveTopic(topic === activeTopic ? 'all' : topic)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: activeTopic === topic ? s.bg : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (activeTopic !== topic) e.currentTarget.style.background = 'var(--color-bg-tertiary)'; }}
                      onMouseLeave={e => { if (activeTopic !== topic) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {Icon && <Icon size={14} style={{ color: s.color }} />}
                        <span style={{ fontSize: '13px', fontWeight: 600, color: activeTopic === topic ? s.color : 'var(--color-text-primary)' }}>
                          {topic}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '12px', fontWeight: 700, padding: '2px 8px',
                        borderRadius: '6px', background: s.bg, color: s.color,
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-primary)',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border-primary)' }}>
              <Star size={16} style={{ color: '#f59e0b' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                About
              </h3>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-muted)', margin: 0 }}>
              Research Desk curates the latest papers from arXiv across AI, Computer Science, and Machine Learning. Papers are updated daily.
            </p>
            <div style={{
              display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '12px',
              borderTop: '1px solid var(--color-border-primary)',
            }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-brand)' }}>
                  {globalTotalPapers}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Papers</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-brand)' }}>
                  {Object.keys(topicCounts).length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Topics</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

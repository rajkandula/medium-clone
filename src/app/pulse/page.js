'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Zap, ExternalLink, Loader2, Clock, RefreshCw, Sparkles, Share2, ArrowUpRight, Bot, Globe, FlaskConical, Briefcase, Shield, Palette, Code2, Settings, Smartphone, BarChart3, Target, GitFork, TrendingUp, Heart, Dumbbell, Landmark, GraduationCap, Coins } from 'lucide-react';
import Feather from '@/components/shared/FeatherIcon';
import { timeAgo } from '@/lib/utils';

import DashboardLayout from '@/app/dashboard/layout';

const TOPIC_ICONS = {
  'AI': Bot,
  'Web Dev': Globe,
  'Science': FlaskConical,
  'Startups': Briefcase,
  'Security': Shield,
  'Design': Palette,
  'Programming': Code2,
  'DevOps': Settings,
  'Mobile': Smartphone,
  'Data': BarChart3,
  'Career': Target,
  'Open Source': GitFork,
  'Health & Fitness': Dumbbell,
  'Medical': Heart,
  'Politics & Policy': Landmark,
  'Economics': Coins,
  'Education': GraduationCap,
};

const TOPIC_COLORS = {
  'AI': { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
  'Web Dev': { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  'Science': { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  'Startups': { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  'Security': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  'Design': { bg: 'rgba(236,72,153,0.1)', color: '#ec4899' },
  'Programming': { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
  'DevOps': { bg: 'rgba(34,211,238,0.1)', color: '#22d3ee' },
  'Mobile': { bg: 'rgba(14,165,233,0.1)', color: '#0ea5e9' },
  'Data': { bg: 'rgba(20,184,166,0.1)', color: '#14b8a6' },
  'Career': { bg: 'rgba(251,146,60,0.1)', color: '#fb923c' },
  'Open Source': { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
  'Health & Fitness': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  'Medical': { bg: 'rgba(236,72,153,0.1)', color: '#ec4899' },
  'Politics & Policy': { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
  'Economics': { bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
  'Education': { bg: 'rgba(234,179,8,0.1)', color: '#eab308' },
};

/* ─── Article Card ─── */
function ArticleCard({ article, isSaved, onToggleSave }) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(article.sourceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/news/${article._id}/save`, { method: 'POST' });
      const data = await res.json();
      setSaved(data.saved);
      onToggleSave?.(article._id, data.saved);
    } catch {}
    setSaving(false);
  };

  return (
    <article style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-primary)',
      borderRadius: '16px',
      padding: '28px 28px 20px',
      transition: 'box-shadow 0.2s',
    }}>

      {/* Source & Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: 'var(--color-brand)', display: 'inline-block', flexShrink: 0,
        }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {article.sourceName}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>·</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '20px', fontWeight: 700, lineHeight: 1.35,
        color: 'var(--color-brand)', marginBottom: '14px',
      }}>
        {article.title}
      </h3>

      {/* Summary text */}
      {article.summary && (
        <p style={{
          fontSize: '14.5px', lineHeight: 1.7,
          color: 'var(--color-text-secondary)',
          marginBottom: '16px',
        }}>
          {article.summary}
        </p>
      )}

      {/* AI Insight Box */}
      {article.keyTakeaways && article.keyTakeaways.length > 0 && (
        <div style={{
          background: 'rgba(251, 191, 36, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Sparkles size={14} style={{ color: '#f59e0b' }} />
            <span style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: '#d97706',
            }}>
              AI Insight
            </span>
          </div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.75, color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
            {article.keyTakeaways.join(' ')}
          </p>
        </div>
      )}

      {/* Topics */}
      {(article.topics || []).length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {article.topics.slice(0, 4).map(topic => {
            const s = TOPIC_COLORS[topic] || { bg: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' };
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
        paddingTop: '16px',
      }}>
        <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13.5px', fontWeight: 600, color: 'var(--color-brand)',
            textDecoration: 'none',
          }}>
          Read Article <ArrowUpRight size={14} />
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={handleSave}
            disabled={saving}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center',
              color: saved ? 'var(--color-brand)' : 'var(--color-text-muted)',
              transition: 'all 0.2s',
            }}
            title={saved ? 'Unsave' : 'Save'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button onClick={handleShare}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center',
              color: copied ? 'var(--color-brand)' : 'var(--color-text-muted)',
              transition: 'color 0.2s',
            }}
            title="Copy link">
            {copied ? (
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Copied!</span>
            ) : (
              <Share2 size={16} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Trending Sidebar ─── */
function TrendingSidebar({ articles, mainFeedIds }) {
  const trending = articles.filter(a => !mainFeedIds?.has(a._id)).slice(0, 8);
  // Fallback: if everything overlaps, skip the first few
  const display = trending.length > 0 ? trending : articles.slice(3, 11);
  if (display.length === 0) return null;

  return (
    <aside style={{
      position: 'sticky',
      top: '80px',
      alignSelf: 'start',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto',
      paddingRight: '6px',
    }}>
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-primary)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <TrendingUp size={16} style={{ color: 'var(--color-brand)' }} />
          <h3 style={{
            fontSize: '15px', fontWeight: 700,
            color: 'var(--color-text-primary)', margin: 0,
          }}>
            Trending Headlines
          </h3>
        </div>

        {/* Numbered list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {display.map((article, i) => (
            <a
              key={article._id}
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                padding: '14px 0',
                borderTop: i > 0 ? '1px solid var(--color-border-primary)' : 'none',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
            >
              {/* Number */}
              <span style={{
                fontSize: '18px', fontWeight: 800, lineHeight: 1,
                color: 'var(--color-text-muted)',
                opacity: 0.35,
                minWidth: '22px',
                paddingTop: '2px',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Source label */}
                <div style={{
                  fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--color-brand)',
                  marginBottom: '4px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: 'var(--color-brand)', display: 'inline-block',
                  }} />
                  {article.source}
                </div>
                {/* Title */}
                <p style={{
                  fontSize: '13px', fontWeight: 600,
                  lineHeight: 1.4,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {article.title}
                </p>
                {/* Time */}
                <span style={{
                  fontSize: '11px', color: 'var(--color-text-muted)',
                  marginTop: '3px', display: 'block',
                }}>
                  {timeAgo(article.publishedAt)}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ─── Main Pulse Content ─── */
function PulseContent() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState('all');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarArticles, setSidebarArticles] = useState([]);

  const fetchArticles = useCallback(async (topicFilter, pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 20 });
      if (topicFilter && topicFilter !== 'all') params.set('topic', topicFilter);
      
      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      
      if (pageNum === 1) {
        setArticles(data.articles || []);
      } else {
        setArticles(prev => [...prev, ...(data.articles || [])]);
      }
      setTotalPages(data.totalPages || 1);
      setAvailableTopics(data.topics || []);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles(activeTopic, 1);
    setPage(1);
  }, [activeTopic, fetchArticles]);

  // Fetch separate trending articles for sidebar
  useEffect(() => {
    fetch('/api/news?sort=trending&limit=15')
      .then(r => r.json())
      .then(data => setSidebarArticles(data.articles || []))
      .catch(() => {});
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchArticles(activeTopic, next);
  };

  return (
    <div>
      <style>{`
        @media (max-width: 900px) {
          .pulse-layout { grid-template-columns: 1fr !important; }
          .pulse-layout > aside { display: none !important; }
        }
      `}</style>
      <div className="pulse-layout" style={{ maxWidth: '1120px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '36px', alignItems: 'start' }}>
        <div>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <span style={{
                width: '4px', height: '28px', borderRadius: '2px',
                background: 'var(--color-brand)', display: 'inline-block',
              }} />
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginLeft: '8px' }}>
                Latest Stories
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginLeft: '16px' }}>
              Curated tech & education news — read the gist or dive deeper
            </p>
          </div>

          {/* Topic Filters */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px',
            marginBottom: '24px', paddingBottom: '24px',
            borderBottom: '1px solid var(--color-border-primary)',
          }}>
            <button
              onClick={() => setActiveTopic('all')}
              style={{
                padding: '6px 14px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: activeTopic === 'all' ? 'var(--color-brand)' : 'var(--color-bg-tertiary)',
                color: activeTopic === 'all' ? 'white' : 'var(--color-text-secondary)',
                border: `1px solid ${activeTopic === 'all' ? 'var(--color-brand)' : 'var(--color-border-primary)'}`,
                transition: 'all 0.2s',
              }}>
              All
            </button>
            {availableTopics.map(topic => {
              const topicStyle = TOPIC_COLORS[topic] || { bg: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' };
              return (
                <button key={topic}
                  onClick={() => setActiveTopic(topic)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: activeTopic === topic ? topicStyle.color : topicStyle.bg,
                    color: activeTopic === topic ? 'white' : topicStyle.color,
                    border: `1px solid ${activeTopic === topic ? topicStyle.color : 'transparent'}`,
                    transition: 'all 0.2s',
                  }}>
                  {(() => { const Icon = TOPIC_ICONS[topic]; return Icon ? <Icon size={13} /> : null; })()}
                  {topic}
                </button>
              );
            })}

            {/* Article Count */}
            {articles.length > 0 && (
              <span style={{
                marginLeft: 'auto', fontSize: '12px', fontWeight: 600,
                color: 'var(--color-brand)', alignSelf: 'center',
              }}>
                {articles.length} articles
              </span>
            )}
          </div>

          {/* Articles */}
          {loading && articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-brand)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading the latest news...</p>
            </div>
          ) : articles.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 0', borderRadius: '16px',
              border: '2px dashed var(--color-border-primary)',
            }}>
              <Zap size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>No articles yet</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                The Pulse hasn&apos;t curated any articles yet. Check back soon!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {articles.map(article => (
                <ArticleCard key={article._id} article={article} />
              ))}

              {/* Load More */}
              {page < totalPages && (
                <div style={{ textAlign: 'center', paddingTop: '12px' }}>
                  <button onClick={loadMore} disabled={loading}
                    style={{
                      padding: '10px 24px', borderRadius: '10px',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border-primary)',
                      transition: 'all 0.2s',
                    }}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trending Sidebar */}
        <TrendingSidebar articles={sidebarArticles} mainFeedIds={new Set(articles.map(a => a._id))} />
      </div>
    </div>
  );
}

export default function PulsePage() {
  const { user: currentUser } = useAuth();

  const content = <PulseContent />;

  if (currentUser) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <nav className="glass-strong" style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--color-border-primary)',
      }}>
        <div style={{
          maxWidth: '1120px', margin: '0 auto', padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div className="gradient-brand" style={{
              width: '28px', height: '28px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Feather size={12} color="white" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Blog<span style={{ color: 'var(--color-brand)' }}>Write</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/login" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand)', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" className="gradient-brand" style={{
              padding: '8px 16px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, color: 'white', textDecoration: 'none',
            }}>Get Started</Link>
          </div>
        </div>
      </nav>
      {content}
    </div>
  );
}

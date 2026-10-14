'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, Share2, ArrowLeft, Clock, Send, Loader2, BookOpen, Maximize2, Minimize2, X, ExternalLink, Trash2, Cpu, Layers, Database, ListTodo, Rocket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatDate, timeAgo, formatNumber } from '@/lib/utils';
import { renderLatex } from '@/lib/latex';
import { sanitizeRichHtml } from '@/lib/sanitize';
import RelatedPosts from '@/components/shared/RelatedPosts';
import SeriesNav from '@/components/shared/SeriesNav';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { marked } from 'marked';
import '@/components/editor/editor-blocks.css';
import { sanitizeMermaidCode } from '@/lib/mermaid-sanitize';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [related, setRelated] = useState([]);
  const [seriesCtx, setSeriesCtx] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [htmlFullScreen, setHtmlFullScreen] = useState(false);
  const [htmlTab, setHtmlTab] = useState('preview'); // 'preview' | 'code'
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);
  const [commentDeleteConfirm, setCommentDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'architecture' | 'techstack' | 'database' | 'devplan'
  const contentRef = useRef(null);

  // Redirect logged-in users to dashboard-wrapped view
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(`/dashboard/read/${params.slug}`);
    }
  }, [authLoading, user, params.slug, router]);

  useEffect(() => {
    fetch(`/api/posts/${params.slug}`).then(r => r.json()).then(data => {
      setPost(data.post); setLiked(data.userLiked); setBookmarked(data.userBookmarked); setRelated(data.relatedPosts || []); setSeriesCtx(data.seriesContext || null); setLoading(false);
    }).catch(() => setLoading(false));

    fetch(`/api/posts/${params.slug}/comments`).then(r => r.json()).then(data => {
      setComments(data.comments || []);
    }).catch(() => {});
  }, [params.slug]);

  // Auto-detect format — check LaTeX BEFORE markdown to avoid false positives
  const detectFormat = (content) => {
    if (!content) return 'richtext';
    if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html') || content.trim().startsWith('<body')) return 'html';
    if (/\\(documentclass|usepackage|title|section|begin|end|frac|int|sum|newcommand|definecolor|rule|textbf|textit)\b/.test(content) || /\$\$.+?\$\$/s.test(content)) return 'latex';
    if (/^#{1,6}\s/m.test(content) || /\*\*.+?\*\*/m.test(content) || /```/m.test(content) || /^-{3,}$/m.test(content)) return 'markdown';
    return 'richtext';
  };

  // Sanity-check 'richtext' against content — it may actually be LaTeX/Markdown stored with wrong format
  const format = post
    ? (post.format && post.format !== 'richtext' ? post.format : detectFormat(post.content))
    : 'richtext';

  const isHtmlFormat = format === 'html';

  // ── HTML fullscreen: Escape to exit + sidebar suppression ───────────────
  useEffect(() => {
    if (!htmlFullScreen) return;
    const onKey = (e) => { if (e.key === 'Escape') setHtmlFullScreen(false); };
    document.addEventListener('keydown', onKey);
    const style = document.createElement('style');
    style.id = 'html-fs-override';
    style.textContent = 'aside, header { display: none !important; } body, html { overflow: hidden !important; }';
    document.head.appendChild(style);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.getElementById('html-fs-override')?.remove();
    };
  }, [htmlFullScreen]);

  // ── Study Mode: Escape key exits ─────────────────────────────────────────
  useEffect(() => {
    if (!studyMode) return;
    const onKey = (e) => { if (e.key === 'Escape') setStudyMode(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [studyMode]);

  // ── Study Mode: hide sidebar ──────────────────────────────────────────────
  useEffect(() => {
    if (!studyMode) return;
    const style = document.createElement('style');
    style.id = 'study-mode-override';
    style.textContent = 'aside, header { display: none !important; } body, html { overflow: hidden !important; }';
    document.head.appendChild(style);
    return () => { document.getElementById('study-mode-override')?.remove(); };
  }, [studyMode]);

  // Post-process rendered content for richtext or product
  useEffect(() => {
    if (!contentRef.current || (format !== 'richtext' && format !== 'product')) return;
    const mathBlocks = contentRef.current.querySelectorAll('[data-math-block]');
    mathBlocks.forEach(el => {
      const latex = el.getAttribute('data-latex') || el.textContent;
      if (latex) {
        try {
          el.innerHTML = katex.renderToString(latex, { displayMode: true, throwOnError: false });
          el.style.cssText = 'padding:24px 20px;margin:1.5rem 0;border-radius:12px;background:var(--color-bg-tertiary);text-align:center;';
        } catch { el.innerHTML = '<span style="color:#ef4444">Invalid LaTeX</span>'; }
      }
    });

    const htmlEmbeds = contentRef.current.querySelectorAll('[data-html-embed]');
    htmlEmbeds.forEach(el => {
      const code = el.getAttribute('data-code');
      const height = el.getAttribute('data-height') || '200';
      if (code) {
        const decoded = code.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        const srcdoc = `<!DOCTYPE html><html><head><style>*{box-sizing:border-box;margin:0;padding:0}body{display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:transparent;overflow:hidden}</style></head><body>${decoded}</body></html>`;
        const iframe = document.createElement('iframe');
        iframe.srcdoc = srcdoc;
        iframe.style.cssText = `width:100%;height:${height}px;border:none;border-radius:12px;`;
        iframe.sandbox = 'allow-scripts';
        iframe.title = 'Interactive Embed';
        el.innerHTML = '';
        el.style.cssText = 'margin:1.5rem 0;border-radius:12px;overflow:hidden;background:var(--color-bg-tertiary);';
        el.appendChild(iframe);
      }
    });
  }, [post?.content, format]);

  // Post-process Mermaid diagrams
  useEffect(() => {
    if (!post?.content) return;
    
    let active = true;
    
    const renderMermaid = async () => {
      const elements = document.querySelectorAll('.blog-content pre code.language-mermaid');
      if (elements.length === 0) return;
      
      try {
        await document.fonts?.ready;
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          suppressErrorRendering: true,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          flowchart: {
            useMaxWidth: false,
            padding: 25,
            nodeSpacing: 50,
            rankSpacing: 60,
            htmlLabels: true,
          },
          themeVariables: {
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }
        });
        
        for (let i = 0; i < elements.length; i++) {
          if (!active) return;
          const el = elements[i];
          const pre = el.parentElement;
          
          if (pre.getAttribute('data-mermaid-rendered') === 'true') continue;
          
          const code = el.textContent;
          const sanitizedCode = sanitizeMermaidCode(code);
          const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
          
          try {
            const { svg } = await mermaid.render(id, sanitizedCode);
            if (!active) return;
            
            const container = document.createElement('div');
            container.className = 'mermaid-diagram-container flex justify-center my-6 p-4 rounded-xl border border-gray-100 bg-gray-50/50 overflow-x-auto';
            container.innerHTML = svg;
            
            pre.setAttribute('data-mermaid-rendered', 'true');
            pre.replaceWith(container);
          } catch (renderErr) {
            console.warn('Mermaid render error:', renderErr);
            const errDiv = document.createElement('div');
            errDiv.className = 'text-red-500 text-xs my-2 p-2 border border-red-200 bg-red-50 rounded-lg';
            errDiv.textContent = `Failed to render diagram: ${renderErr.message || renderErr}`;
            el.appendChild(errDiv);
          }
        }
      } catch (err) {
        console.error('Failed to load/initialize mermaid:', err);
      }
    };
    
    const timer = setTimeout(renderMermaid, 150);
    
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [post?.content, format, studyMode, htmlFullScreen, activeTab]);

  // Use the shared LaTeX renderer from lib/latex.js
  const renderLatexContent = (raw) => sanitizeRichHtml(renderLatex(raw));

  // Smart richtext renderer — auto-detects markdown and converts
  const renderRichtextContent = (raw) => {
    if (!raw) return '';
    const htmlBlockCount = (raw.match(/<(h[1-6]|p|ul|ol|blockquote)\b/gi) || []).length;
    const html = htmlBlockCount >= 2 ? raw : marked.parse(raw, { breaks: true });
    return sanitizeRichHtml(html);
  };


  const renderMarkdownContent = (raw) => {
    if (!raw) return '';
    let processed = raw;
    processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
      try { return `<div class="latex-display-block">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`; }
      catch { return `<div style="color:#ef4444">${math.substring(0, 40)}</div>`; }
    });
    processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_, math) => {
      try { return katex.renderToString(math, { displayMode: false, throwOnError: false }); }
      catch { return math; }
    });
    return sanitizeRichHtml(marked.parse(processed));
  };

  const handleLike = async () => {
    if (!user) return router.push('/login');
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, { method: 'POST' });
      const data = await res.json();
      setLiked(data.liked);
      setPost(prev => ({ ...prev, likesCount: data.likesCount }));
    } catch {}
  };

  const getSafeHtml = (html) => {
    if (!html) return '';
    if (html.includes('<base ')) return html;
    if (/<head>/i.test(html)) return html.replace(/<head>/i, '<head><base target="_blank">');
    return `<base target="_blank">\n${html}`;
  };

  const handleBookmark = async () => {
    if (!user) return router.push('/login');
    try {
      const res = await fetch(`/api/posts/${post._id}/bookmark`, { method: 'POST' });
      const data = await res.json();
      setBookmarked(data.bookmarked);
    } catch {}
  };

  const handleComment = async () => {
    if (!user) return router.push('/login');
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        setPost(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));
      }
    } catch {}
    setCommenting(false);
  };

  const handleDeleteCommentClick = (commentId, parentCommentId = null) => {
    setCommentDeleteConfirm({ commentId, parentCommentId });
  };

  const executeDeleteComment = async () => {
    if (!commentDeleteConfirm) return;
    const { commentId, parentCommentId } = commentDeleteConfirm;
    setCommentDeleteConfirm(null);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        // If parentCommentId is provided, we deleted a reply
        if (parentCommentId) {
          setComments(prev => prev.map(c => {
            if (c._id === parentCommentId) {
              return {
                ...c,
                replies: (c.replies || []).filter(r => r._id !== commentId)
              };
            }
            return c;
          }));
        } else {
          // We deleted a parent comment
          setComments(prev => prev.filter(c => c._id !== commentId));
        }
        
        // Decrement local commentsCount
        const decAmount = data.deletedCount || 1;
        setPost(prev => ({ ...prev, commentsCount: Math.max(0, (prev.commentsCount || 0) - decAmount) }));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };


  if (authLoading || loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
    </div>
  );

  if (!post) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Post not found</h1>
        <Link href="/explore" style={{ color: 'var(--color-brand)' }}>← Back to explore</Link>
      </div>
    </div>
  );


  // ── HTML format: split code / preview panel (sidebar stays visible) ─────

  if (isHtmlFormat) {
    // ── True fullscreen ────────────────────────────────────────────────────
    if (htmlFullScreen) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: '#000' }}>
          <iframe
            srcDoc={getSafeHtml(post.content)}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            sandbox="allow-scripts allow-forms allow-popups"
            title={post.title}
          />
          <button
            onClick={() => setHtmlFullScreen(false)}
            style={{
              position: 'fixed', top: 16, left: 16, zIndex: 1000000,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}>
            <Minimize2 size={14} /> Exit Full Screen
          </button>
        </div>
      );
    }

    // ── Sidebar-visible panel view ─────────────────────────────────────────
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh' }}>
        {/* ── Unified Sticky Toolbar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', gap: 16,
          borderBottom: '1px solid var(--color-border-primary)',
          background: 'var(--color-bg-card)',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}>
          {/* Left: Back + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
            <button onClick={() => router.push('/explore')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--color-bg-hover)', border: 'none',
                color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{
              fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {post.title}
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Engagement */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderRight: '1px solid var(--color-border-primary)', paddingRight: 20 }}>
              <button onClick={handleLike} title="Like"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
                  color: liked ? '#ef4444' : 'var(--color-text-muted)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Heart size={18} fill={liked ? '#ef4444' : 'none'} />
                {formatNumber(post.likesCount || 0)}
              </button>

              <button title="Comment" onClick={() => setIsCommentSidebarOpen(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: 'none', border: 'none', fontSize: 13,
                color: 'var(--color-text-muted)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <MessageCircle size={18} />
                {formatNumber(post.commentsCount || 0)}
              </button>

              <button onClick={handleBookmark} title="Bookmark"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: bookmarked ? '#f59e0b' : 'var(--color-text-muted)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Bookmark size={18} fill={bookmarked ? '#f59e0b' : 'none'} />
              </button>

              <button title="Share"
                onClick={() => navigator.clipboard?.writeText(window.location.href.replace('/dashboard/read/', '/blog/'))}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Share2 size={18} />
              </button>
            </div>

            {/* View Modes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setStudyMode(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(245,158,11,0.25)',
                  background: 'var(--color-brand-glow)', fontSize: 13, fontWeight: 700,
                  color: 'var(--color-brand)', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <BookOpen size={16} /> Study Mode
              </button>

              <button onClick={() => setHtmlFullScreen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                  background: 'var(--color-text-primary)', border: 'none',
                  color: 'var(--color-bg-card)', fontSize: 13, fontWeight: 700,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Maximize2 size={14} /> Full Screen
              </button>
            </div>
          </div>
        </div>

        {/* ── Preview ── */}
        <div style={{ flex: 1, background: '#fff' }}>
          <iframe
            srcDoc={getSafeHtml(post.content)}
            style={{ width: '100%', height: 'calc(100vh - 65px)', border: 'none', display: 'block' }}
            sandbox="allow-scripts allow-forms allow-popups"
            title={post.title}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Study Mode / Full Screen Overlay ─────────────────────────────────────────── */}
      {(studyMode || htmlFullScreen) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          overflowY: 'auto',
          background: 'var(--color-bg-primary)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Floating controls */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px',
            background: 'rgba(var(--color-bg-primary-rgb, 255,255,255), 0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--color-border-primary)',
          }}>
            <div className="flex items-center gap-2">
              {studyMode ? (
                <><BookOpen size={16} style={{ color: 'var(--color-brand)' }} /><span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Study Mode</span></>
              ) : (
                <><Maximize2 size={16} style={{ color: 'var(--color-brand)' }} /><span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Full Screen</span></>
              )}
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>— Press Esc to exit</span>
            </div>
            <button onClick={() => { setStudyMode(false); setHtmlFullScreen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: '999px', cursor: 'pointer',
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
                color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 600,
              }}>
              <X size={14} /> Exit
            </button>
          </div>

          {/* Content */}
          <div style={{ maxWidth: studyMode ? 780 : 1200, margin: '0 auto', padding: '48px 32px 80px', width: '100%' }}>
            <h1 style={{
              fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2,
              marginBottom: '2rem', color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}>{post.title}</h1>

            {format === 'richtext' && (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: renderRichtextContent(post.content) }} />
            )}
            {format === 'product' && (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: renderRichtextContent(post.content) }} />
            )}
            {format === 'latex' && (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: renderLatexContent(post.content) }} />
            )}
            {format === 'markdown' && (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: renderMarkdownContent(post.content) }} />
            )}
            {format === 'html' && (
              <iframe
                srcDoc={post.content}
                style={{ width: '100%', minHeight: '80vh', border: 'none', borderRadius: 12 }}
                sandbox="allow-scripts allow-forms"
                title={post.title}
              />
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* ── Unified Sticky Toolbar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', gap: 16,
          borderBottom: '1px solid var(--color-border-primary)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          {/* Left: Back + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
            <button onClick={() => router.back()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--color-bg-hover)', border: 'none',
                color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{
              fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {post.title}
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Engagement */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderRight: '1px solid var(--color-border-primary)', paddingRight: 20 }}>
              <button onClick={handleLike} title="Like"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
                  color: liked ? '#ef4444' : 'var(--color-text-muted)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Heart size={18} fill={liked ? '#ef4444' : 'none'} />
                {formatNumber(post.likesCount || 0)}
              </button>

              <button title="Comment" onClick={() => setIsCommentSidebarOpen(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: 'none', border: 'none', fontSize: 13,
                color: 'var(--color-text-muted)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <MessageCircle size={18} />
                {formatNumber(post.commentsCount || 0)}
              </button>

              <button onClick={handleBookmark} title="Bookmark"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: bookmarked ? '#f59e0b' : 'var(--color-text-muted)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Bookmark size={18} fill={bookmarked ? '#f59e0b' : 'none'} />
              </button>

              <button title="Share"
                onClick={() => navigator.clipboard?.writeText(window.location.href.replace('/dashboard/read/', '/blog/'))}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Share2 size={18} />
              </button>
            </div>

            {/* View Modes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setStudyMode(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(245,158,11,0.25)',
                  background: 'var(--color-brand-glow)', fontSize: 13, fontWeight: 700,
                  color: 'var(--color-brand)', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <BookOpen size={16} /> Study Mode
              </button>

              <button onClick={() => setHtmlFullScreen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '8px 16px', borderRadius: 10, border: 'none',
                  background: 'var(--color-text-primary)', fontSize: 13, fontWeight: 700,
                  color: 'var(--color-bg-card)', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Maximize2 size={14} /> Full Screen
              </button>
            </div>
          </div>
        </div>

        <article className="max-w-5xl mx-auto px-6 py-8 animate-fade-in w-full">

      {/* Cover Image */}
      {post.coverImage && (
        <div className="rounded-2xl overflow-hidden mb-8">
          <img src={post.coverImage} alt={post.title} className="w-full aspect-[2.2/1] object-cover" />
        </div>
      )}

      {/* Title */}
      <h1 className="text-[32px] md:text-[40px] font-bold leading-tight mb-4"
        style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif, Georgia, serif)', letterSpacing: '-0.02em' }}>
        {post.title}
      </h1>

      {/* ── App Store-style Product Launch Layout ── */}
      {format === 'product' && (
        <div className="mb-8 rounded-3xl overflow-hidden" style={{ border: '1px solid #e5e7eb', background: '#fff' }}>

          {/* Hero banner */}
          <div className="relative w-full overflow-hidden" style={{ minHeight: post.coverImage ? 220 : 120 }}>
            {post.coverImage ? (
              <img src={post.coverImage} alt={post.title} className="w-full object-cover" style={{ maxHeight: 280 }} />
            ) : (
              <div className="w-full" style={{ height: 120, background: 'linear-gradient(135deg,#fff7ed,#fef3c7 50%,#fce7f3)' }} />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,transparent 30%,rgba(255,255,255,0.97) 100%)' }} />
          </div>

          {/* Identity row */}
          <div className="px-8 pb-0 -mt-8 relative z-10 flex flex-col sm:flex-row sm:items-end gap-5">
            {/* App Icon — use detected icon or fallback to gradient rocket */}
            <div className="w-20 h-20 rounded-[22px] border-4 border-white shadow-xl flex items-center justify-center shrink-0 overflow-hidden select-none"
              style={{ background: post.appIcon ? '#fff' : post.isAiGenerated ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg,#f59e0b,#ea580c)' }}>
              {post.appIcon ? (
                <img src={post.appIcon} alt={post.appName || post.title} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display='none'; e.currentTarget.parentElement.style.background=post.isAiGenerated ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg,#f59e0b,#ea580c)'; }} />
              ) : (
                <span className="text-3xl font-black text-white">
                  {((post.appName || post.title)?.[0]?.toUpperCase() || '🚀')}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{post.appName || post.title}</h2>
              {post.appDescription && <p className="mt-1 text-[15px] text-gray-500 leading-relaxed">{post.appDescription}</p>}
            </div>
            {post.productUrl && !post.isAiGenerated && (
              <a href={post.productUrl} target="_blank" rel="noopener noreferrer"
                className="shrink-0 mb-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[14px] font-bold text-white shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }}>
                Visit App <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            )}
          </div>

          {/* Metadata chips */}
          {(post.pricing || post.launchDate) && (
            <div className="flex flex-wrap gap-2 px-8 mt-4">
              {post.pricing && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  {post.pricing}
                </span>
              )}
              {post.launchDate && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Launching {formatDate(post.launchDate)}
                </span>
              )}
            </div>
          )}

          {/* Screenshot Gallery */}
          {post.appImages?.length > 0 && (
            <div className="px-8 py-6 mt-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Screenshots</p>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                {post.appImages.map((img, i) => (
                  <div key={i} className="shrink-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ width: 220, height: 160 }}>
                    <img src={img} alt={`screenshot-${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="mx-8 mt-2 mb-0" style={{ borderBottom: '1px solid #f3f4f6' }} />
        </div>
      )}

      {/* Author Info */}
      <div className="flex items-center gap-3 mb-8 pb-8" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
        <Link href={post.author?.username ? `/profile/${post.author.username}` : '#'}>
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
              {post.author?.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </Link>
        <div>
          <Link href={post.author?.username ? `/profile/${post.author.username}` : '#'}
            className="text-[14px] font-semibold hover:underline" style={{ color: 'var(--color-text-primary)' }}>
            {post.author?.name || 'Anonymous'}
          </Link>
          <div className="flex items-center gap-3 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime || 1} min read</span>
            <span>👁 {formatNumber(post.viewCount || 0)}</span>
          </div>
        </div>
      </div>

      {/* Content — format-aware */}
      {format === 'richtext' && (
        <div ref={contentRef} className="blog-content mb-12" dangerouslySetInnerHTML={{ __html: renderRichtextContent(post.content) }} />
      )}
      {format === 'product' && post.content && (
        <div className="mb-12">
          {post.isAiGenerated && post.systemArchitecture ? (
            <div>
              {/* Glassmorphic Tab Selector */}
              <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} className="flex flex-wrap gap-2 p-1.5 rounded-2xl mb-8 sticky top-16 z-30">
                {[
                  { id: 'overview', label: 'Overview & Pitch', icon: Rocket, color: 'text-amber-500' },
                  { id: 'architecture', label: 'System Design', icon: Cpu, color: 'text-indigo-500' },
                  { id: 'techstack', label: 'Tech Stack', icon: Layers, color: 'text-violet-500' },
                  { id: 'database', label: 'DB & API Specs', icon: Database, color: 'text-emerald-500' },
                  { id: 'devplan', label: 'Implementation Guide', icon: ListTodo, color: 'text-blue-500' },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        // Trigger a small delay to re-render Mermaid after tab switches
                        setTimeout(() => {
                          const event = new Event('resize');
                          window.dispatchEvent(event);
                        }, 50);
                      }}
                      className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer"
                      style={{
                        background: isActive ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'transparent',
                        color: isActive ? '#ffffff' : '#4b5563',
                        boxShadow: isActive ? '0 4px 12px rgba(168, 85, 247, 0.25)' : 'none',
                      }}
                    >
                      <Icon size={14} className={isActive ? 'text-white' : tab.color} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Panels with Fade-in animation */}
              <div className="animate-fade-in duration-300">
                {activeTab === 'overview' && (
                  <div key="overview">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                      <Rocket size={12} className="text-amber-500" /> Pitch & Overview
                    </p>
                    <div ref={contentRef} className="blog-content" dangerouslySetInnerHTML={{ __html: renderRichtextContent(post.content) }} />
                  </div>
                )}
                {activeTab === 'architecture' && (
                  <div key="architecture">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                      <Cpu size={12} className="text-indigo-500" /> System Architecture & Flowchart
                    </p>
                    <div ref={contentRef} className="blog-content" dangerouslySetInnerHTML={{ __html: renderRichtextContent(post.systemArchitecture) }} />
                  </div>
                )}
                {activeTab === 'techstack' && (
                  <div key="techstack">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                      <Layers size={12} className="text-violet-500" /> Core Tech Stack & Requirements
                    </p>
                    <div ref={contentRef} className="blog-content" dangerouslySetInnerHTML={{ __html: renderRichtextContent(post.techStack) }} />
                  </div>
                )}
                {activeTab === 'database' && (
                  <div key="database">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                      <Database size={12} className="text-emerald-500" /> DB Schema & API Specification
                    </p>
                    <div ref={contentRef} className="blog-content">
                      <div dangerouslySetInnerHTML={{ __html: renderRichtextContent(post.dbSchema) }} />
                      <div className="mt-8" dangerouslySetInnerHTML={{ __html: renderRichtextContent(post.apiSpecs) }} />
                    </div>
                  </div>
                )}
                {activeTab === 'devplan' && (
                  <div key="devplan">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                      <ListTodo size={12} className="text-blue-500" /> Developer Implementation Roadmap
                    </p>
                    <div ref={contentRef} className="blog-content" dangerouslySetInnerHTML={{ __html: renderRichtextContent(post.devPlan) }} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">About this product</p>
              <div ref={contentRef} className="blog-content" dangerouslySetInnerHTML={{ __html: renderRichtextContent(post.content) }} />
            </div>
          )}
        </div>
      )}
      {format === 'latex' && (
        <div className="blog-content mb-12" dangerouslySetInnerHTML={{ __html: renderLatexContent(post.content) }} />
      )}
      {format === 'markdown' && (
        <div className="blog-content mb-12" dangerouslySetInnerHTML={{ __html: renderMarkdownContent(post.content) }} />
      )}
      {format === 'html' && (
        <div className="mb-12 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border-primary)' }}>
          <iframe
            srcDoc={getSafeHtml(post.content)}
            className="w-full border-none"
            style={{ minHeight: '600px' }}
            sandbox="allow-scripts allow-forms allow-popups"
            title="Blog Content"
          />
        </div>
      )}

      <SeriesNav series={seriesCtx} basePath="/blog" />

      <RelatedPosts posts={related} basePath="/blog" />

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {[...new Set(post.tags)].filter(Boolean).map(tag => (
            <Link key={tag} href={`/explore?tag=${encodeURIComponent(tag)}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:bg-[var(--color-bg-hover)]"
              style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* (Actions moved to unified sticky top toolbar) */}
      <hr className="my-8" style={{ borderColor: 'var(--color-border-primary)' }} />

    </article>
    </div>

    {/* ── Comment Sidebar ── */}
    {isCommentSidebarOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', justifyContent: 'flex-end' }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
        {/* Backdrop */}
        <div 
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out forwards' }}
          onClick={() => setIsCommentSidebarOpen(false)}
        />
        {/* Sidebar */}
        <div style={{ 
          position: 'relative', width: '100%', maxWidth: 420, background: 'var(--color-bg-primary)',
          display: 'flex', flexDirection: 'column', height: '100%',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.08)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          borderLeft: '1px solid var(--color-border-primary)'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-card)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Responses ({comments.length})</h3>
            <button onClick={() => setIsCommentSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {user ? (
              <div className="mb-8 p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <div className="flex gap-3 mb-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-[14px] font-semibold flex items-center" style={{ color: 'var(--color-text-primary)' }}>{user.name}</span>
                </div>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                  className="w-full p-0 text-[14px] resize-none focus:outline-none transition-all bg-transparent"
                  style={{ color: 'var(--color-text-primary)', minHeight: '60px' }}
                  placeholder="What are your thoughts?" />
                <div className="flex justify-end mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
                  <button onClick={handleComment} disabled={!newComment.trim() || commenting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold text-white disabled:opacity-50 transition-transform hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                    {commenting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Respond
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-6 rounded-xl text-center" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)' }}>
                <h4 className="text-[15px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Join the conversation</h4>
                <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-secondary)' }}>Log in to share your thoughts with the author and community.</p>
                <button onClick={() => router.push('/login')}
                  className="px-6 py-2 rounded-full text-[13px] font-semibold text-white transition-transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                  Log In
                </button>
              </div>
            )}

            <div className="space-y-8">
              {comments.map(comment => (
                <div key={comment._id} className="flex gap-3">
                  {comment.author?.avatar ? (
                    <img src={comment.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                      {comment.author?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{comment.author?.name || 'Anonymous'}</span>
                        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{timeAgo(comment.createdAt)}</span>
                      </div>
                      {user && (comment.author?._id === user.id || comment.author?._id === user._id) && (
                        <button 
                          onClick={() => handleDeleteCommentClick(comment._id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}
                          className="hover:text-red-500 transition-colors"
                          title="Delete response"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{comment.content}</p>

                    {comment.replies?.length > 0 && (
                      <div className="mt-4 space-y-4 pl-4" style={{ borderLeft: '2px solid var(--color-border-primary)' }}>
                        {comment.replies.map(reply => (
                          <div key={reply._id} className="flex gap-3">
                            {reply.author?.avatar ? (
                              <img src={reply.author.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 shadow-sm" />
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                                {reply.author?.name?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{reply.author?.name || 'Anonymous'}</span>
                                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{timeAgo(reply.createdAt)}</span>
                                </div>
                                {user && (reply.author?._id === user.id || reply.author?._id === user._id) && (
                                  <button 
                                    onClick={() => handleDeleteCommentClick(reply._id, comment._id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}
                                    className="hover:text-red-500 transition-colors"
                                    title="Delete response"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--color-text-primary)' }} />
                  <p className="text-[14px]" style={{ color: 'var(--color-text-muted)' }}>No responses yet.<br/>Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Custom Dialog Overlay */}
    {commentDeleteConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
        <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border-primary)] transition-all animate-scale-up"
          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
          <h3 className="text-[17px] font-bold mb-2.5" style={{ fontFamily: 'var(--font-serif)' }}>
            Delete Response
          </h3>
          <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Are you sure you want to delete this response? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setCommentDeleteConfirm(null)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--color-bg-hover)] cursor-pointer"
              style={{ border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={executeDeleteComment}
              className="px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

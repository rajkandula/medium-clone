'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDebounce } from '@/hooks/useDebounce';
import { Save, Send, Sparkles, Image as ImageIcon, X, Loader2, Tag, Plus, ArrowLeft, Clock, Eye, PenTool, LayoutTemplate, FileText, Hash, FlaskConical, Code2, Rocket, Globe } from 'lucide-react';
import CopilotChat from '@/components/editor/CopilotChat';
import { marked } from 'marked';
import ProductLaunchPreview from '@/components/editor/ProductLaunchPreview';

// Lazy load editors for code splitting
const BlogEditorContent = dynamic(() => import('@/components/editor/BlogEditor'), { 
  ssr: false,
  loading: () => <div className="skeleton w-full h-96 rounded-xl" />,
});

const CodeEditorContent = dynamic(() => import('@/components/editor/CodeEditor'), {
  ssr: false,
  loading: () => <div className="skeleton w-full h-96 rounded-xl" />,
});

// Detect if content is raw markdown (not HTML) — aggressive detection
function isMarkdownContent(text) {
  if (!text) return false;
  // If content is well-structured HTML (has block-level tags), skip conversion
  const htmlBlockCount = (text.match(/<(h[1-6]|p|div|ul|ol|blockquote|table|section)\b/gi) || []).length;
  // If there are many HTML block elements, it's already converted
  if (htmlBlockCount >= 3) return false;
  // Check for common markdown patterns — both at line start AND inline
  // Matches: # headings, **bold**, *italic*, - lists, 1. numbered, > blockquote, *** dividers, ### inline headings
  return /(^|\s)#{1,6}\s|\*\*[^*]+\*\*|^\s*[\-\*]\s|^\s*\d+\.\s|^\s*>\s|\*{3,}/m.test(text);
}

// Preview component for rendering richtext content with LaTeX, code highlighting, and HTML embeds
function PreviewContent({ content }) {
  const processContent = (raw) => {
    if (!raw) return '<p style="color:var(--color-text-muted)">Nothing to preview yet...</p>';

    let html = raw;

    // Always attempt markdown conversion if content doesn't look like proper HTML
    // Check: does it have enough HTML structure? If not, convert.
    const hasHtmlStructure = (html.match(/<(h[1-6]|p|ul|ol|blockquote)\b/gi) || []).length >= 2;
    if (!hasHtmlStructure) {
      // Even if it has some HTML, we try to convert markdown portions
      html = marked(html, { breaks: true });
    }

    // Process math blocks: render KaTeX
    let processed = html.replace(
      /<div[^>]*data-math-block[^>]*data-latex="([^"]*?)"[^>]*>.*?<\/div>/gs,
      (_, latex) => {
        try {
          const katex = require('katex');
          const decoded = latex.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
          return `<div class="math-block-rendered-preview">${katex.renderToString(decoded, { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<div class="math-block-rendered-preview" style="color:#ef4444">Invalid LaTeX</div>`;
        }
      }
    );

    // Process HTML embeds: render in sandboxed iframe
    processed = processed.replace(
      /<div[^>]*data-html-embed[^>]*data-code="([^"]*?)"[^>]*data-height="(\d+)"[^>]*>.*?<\/div>/gs,
      (_, code, height) => {
        const decoded = code.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        const srcdoc = `<!DOCTYPE html><html><head><style>*{box-sizing:border-box;margin:0;padding:0}body{display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:transparent;overflow:hidden}</style></head><body>${decoded}</body></html>`;
        return `<div class="html-embed-rendered-preview"><iframe srcdoc="${srcdoc.replace(/"/g, '&quot;')}" style="width:100%;height:${height}px;border:none" sandbox="allow-scripts" title="embed"></iframe></div>`;
      }
    );

    return processed;
  };

  return (
    <div className="p-6 min-h-[400px]">
      <div className="blog-content prose" dangerouslySetInnerHTML={{ __html: processContent(content) }} />
      <style jsx global>{`
        .math-block-rendered-preview {
          padding: 24px 20px;
          margin: 1.5rem 0;
          border-radius: 12px;
          background: var(--color-bg-tertiary);
          text-align: center;
        }
        .html-embed-rendered-preview {
          margin: 1.5rem 0;
          border-radius: 12px;
          overflow: hidden;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-primary);
        }
      `}</style>
    </div>
  );
}

// Format definitions
const FORMATS = [
  { id: 'richtext',  Icon: FileText,      label: 'Rich Text',      color: '#6366f1' },
  { id: 'markdown',  Icon: Hash,          label: 'Markdown',       color: '#f59e0b' },
  { id: 'latex',     Icon: FlaskConical,  label: 'LaTeX',          color: '#8b5cf6' },
  { id: 'html',      Icon: Code2,         label: 'HTML/CSS/JS',    color: '#06b6d4' },
];

// Detect the format an AI-generated draft is written in, so applying it can switch the
// editor to a mode that actually RENDERS its Mermaid diagrams, math, and HTML.
function detectAppliedFormat(raw) {
  const t = (raw || '').trim();
  if (!t) return null;
  if (/\\(documentclass|usepackage|begin\{(document|equation|align|itemize|enumerate|tabular)\}|section\*?\{|subsection\*?\{)/.test(t)) return 'latex';
  if (/<!DOCTYPE html|<html[\s>]|<body[\s>]|<style[\s>]|<script[\s>]/i.test(t)) return 'html';
  if (/```|\$\$|(^|\n)#{1,6}\s|(^|\n)\s*[-*+]\s|(^|\n)\d+\.\s|\|[^\n]+\|[^\n]+\|/.test(t)) return 'markdown';
  return null;
}

function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coverGenerating, setCoverGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [status, setStatus] = useState('draft');
  const [previewMode, setPreviewMode] = useState(false);

  // Custom confirmation modal states
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [showFormatConfirm, setShowFormatConfirm] = useState(false);
  const [pendingFormat, setPendingFormat] = useState(null);
  const [showAlert, setShowAlert] = useState(null);

  const [format, setFormat] = useState('richtext');
  const [formatLocked, setFormatLocked] = useState(false);
  const [productUrl, setProductUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [pricing, setPricing] = useState('');
  const [launchDate, setLaunchDate] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appImages, setAppImages] = useState([]);
  const [appIcon, setAppIcon] = useState(null);
  const [iconDetecting, setIconDetecting] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [viewMode, setViewMode] = useState('editor'); // Default to editor when editing existing post

  // Fetch data
  useEffect(() => {
    fetch(`/api/posts/${params.id}`).then(r => r.json()).then(data => {
      if (data.post) {
        const p = data.post;
        setTitle(p.title || '');
        // Auto-convert markdown to HTML for richtext posts
        let loadedContent = p.content || '';
        const fmt = p.format || 'richtext';
        if (fmt === 'richtext' && loadedContent && isMarkdownContent(loadedContent)) {
          loadedContent = marked(loadedContent, { breaks: true });
        }
        setContent(loadedContent);
        setExcerpt(p.excerpt || '');
        setCoverImage(p.coverImage || '');
        setTags(p.tags || []);
        setStatus(p.status || 'draft');
        setFormat(fmt);
        if (p.productUrl) setProductUrl(p.productUrl);
        if (p.appName) setAppName(p.appName);
        if (p.pricing) setPricing(p.pricing);
        if (p.appDescription) setAppDescription(p.appDescription);
        if (p.launchDate) setLaunchDate(new Date(p.launchDate).toISOString().split('T')[0]);
        if (p.appImages) setAppImages(p.appImages);
        if (p.appIcon) setAppIcon(p.appIcon);
        if (loadedContent && loadedContent.trim().length > 0) {
          setFormatLocked(true);
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  const debouncedContent = useDebounce(content, 30000); // Auto-save every 30s

  // Auto-save draft
  useEffect(() => {
    if (!loading && debouncedContent && title) {
      saveDraft(true);
    }
  }, [debouncedContent]);

  // Lock format once content is written
  useEffect(() => {
    if (content && content.trim().length > 0) {
      setFormatLocked(true);
    }
  }, [content]);

  const handleFormatChange = (newFormat) => {
    if (formatLocked && content.trim().length > 0) {
      setPendingFormat(newFormat);
      setShowFormatConfirm(true);
    } else {
      executeFormatChange(newFormat);
    }
    setShowFormatDropdown(false);
  };

  const executeFormatChange = (newFormat) => {
    setFormat(newFormat);
    setContent('');
    setPreviewMode(false);
    setFormatLocked(false);
  };

  // Auto-extract title from content
  const extractTitle = (raw, fmt) => {
    if (!raw) return 'Untitled Post';
    // Markdown heading (also catches mixed content that starts with a # heading)
    const mdMatch = raw.match(/^\s*#{1,3}\s+(.+)/m);
    if (mdMatch) return mdMatch[1].replace(/[*_`]/g, '').trim().slice(0, 120);
    // LaTeX title
    const texMatch = raw.match(/\\title\{(.+?)\}/);
    if (texMatch) return texMatch[1].trim().slice(0, 120);
    // HTML heading (h1/h2/h3) — strip any nested tags
    const hMatch = raw.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    if (hMatch) return hMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().slice(0, 120);
    // Fallback: first non-empty line, with any HTML tags / markdown markers stripped
    const firstLine = raw.replace(/<[^>]+>/g, ' ').replace(/[#*_`>]/g, ' ').split('\n').map(l => l.trim()).find(Boolean) || '';
    return firstLine.substring(0, 80) || 'Untitled Post';
  };

  // Auto-detect app icon from URL
  const detectIcon = async (url) => {
    if (!url?.trim()) return;
    setIconDetecting(true);
    try {
      const res = await fetch(`/api/favicon?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.icon) setAppIcon(data.icon);
    } catch {}
    setIconDetecting(false);
  };

  const uploadAppImages = async (images) => {
    const urls = [];
    for (const img of images) {
      if (img.startsWith('http')) { urls.push(img); continue; } // already a URL
      try {
        const blob = await fetch(img).then(r => r.blob());
        const fd = new FormData();
        fd.append('file', blob, 'screenshot.png');
        fd.append('folder', 'product-screenshots');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) urls.push(data.url);
      } catch { urls.push(img); } // fallback: keep as-is
    }
    return urls;
  };

  const saveDraft = async (silent = false) => {
    const effectiveTitle = extractTitle(content, format) || title;
    if (!effectiveTitle) return;
    if (!silent) setSaving(true);

    try {
      const productFields = format === 'product' ? {
        productUrl, appName, pricing, launchDate, appDescription, appIcon,
        appImages: await uploadAppImages(appImages),
      } : {};
      const res = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: effectiveTitle, content, excerpt, coverImage, tags, status, format, ...productFields }),
      });
      const data = await res.json();
      // Update appImages with uploaded URLs so future saves don't re-upload
      if (data.post?.appImages) setAppImages(data.post.appImages);
      setLastSaved(new Date());
    } catch (err) { console.error('Save failed:', err); }
    if (!silent) setSaving(false);
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      setShowAlert({ message: 'Content is required', type: 'error' });
      return;
    }
    const effectiveTitle = extractTitle(content, format) || title;
    setPublishing(true);

    try {
      const productFields = format === 'product' ? {
        productUrl, appName, pricing, launchDate, appDescription, appIcon,
        appImages: await uploadAppImages(appImages),
      } : {};
      const res = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: effectiveTitle, content, excerpt, coverImage, tags, status: 'published', format, ...productFields }),
      });
      const data = await res.json();
      if (data.post?.slug) router.push(`/blog/${data.post.slug}`);
      else router.push('/dashboard/profile');
    } catch (err) { console.error('Publish failed:', err); }
    setPublishing(false);
  };

  const handleRevertToDraft = () => {
    setShowRevertConfirm(true);
  };

  const executeRevertToDraft = async () => {
    setSaving(true);
    try {
      const productFields = format === 'product' ? {
        productUrl, appName, pricing, launchDate, appDescription, appIcon,
        appImages: await uploadAppImages(appImages),
      } : {};
      const res = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft', format, ...productFields }),
      });
      const data = await res.json();
      if (data.post) {
        setStatus('draft');
        setLastSaved(new Date());
        setShowAlert({ message: 'Post reverted to draft successfully.', type: 'success' });
      }
    } catch (err) {
      console.error('Revert to draft failed:', err);
    }
    setSaving(false);
  };


  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 6) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'covers');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setCoverImage(data.url);
    } catch (err) { console.error('Upload failed:', err); }
  };

  const handleAICover = async () => {
    const plain = (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    // The cover is generated FROM the post — base it on the title (or content), never a generic fallback.
    const topic = (title && title.trim()) || extractTitle(content, format) || plain.slice(0, 120);
    if (!topic || (topic.length < 4 && plain.length < 30)) {
      alert('Write a title or a few sentences first — the AI cover is based on what your post is about.');
      return;
    }
    setCoverGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cover-image', topic, content: plain.slice(0, 500), style: 'modern' }),
      });
      const data = await res.json();
      if (data.url) setCoverImage(data.url);
    } catch (err) { console.error('AI cover failed:', err); }
    setCoverGenerating(false);
  };

  // Only allow AI cover generation once there's a title or some content to base it on.
  const canGenerateCover = !!(
    (title && title.trim()) ||
    extractTitle(content, format) ||
    (content && content.replace(/<[^>]*>/g, '').trim().length >= 30)
  );

  const handleApplyCopilotContent = (newContent, isAuto = false) => {
    // On the edit page the user has an existing draft — don't let the background
    // auto-sync mutate it (and append duplicates). Only apply on an explicit click.
    if (isAuto) return;
    // Switch the editor to the format the AI wrote in so its diagrams/math/HTML render.
    const detected = detectAppliedFormat(newContent);
    const targetFormat = detected || format;
    if (detected && detected !== format) setFormat(detected);
    if (targetFormat === 'richtext') {
      // Convert markdown to HTML so the rich text editor renders headings, lists, etc.
      const html = marked(newContent, { breaks: true });
      setContent((prev) => (prev ? prev + '<br/>' + html : html));
    } else {
      setContent((prev) => prev + '\n\n' + newContent);
    }
    setViewMode('editor');
  };

  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const activeFormat = FORMATS.find(f => f.id === format);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 size={28} className="animate-spin text-amber-500" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      
      {/* Global Top Bar */}
      <div className="shrink-0 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 z-30" style={{
        background: 'var(--color-bg-primary)',
        borderBottom: '1px solid var(--color-border-primary)',
      }}>

        {/* Left: Back + Title + Mode Toggle */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()}
            className="shrink-0 p-1.5 rounded-lg transition-all hover:bg-[var(--color-bg-hover)]"
            style={{ color: 'var(--color-text-muted)', background: 'transparent' }}>
            <ArrowLeft size={17} />
          </button>

          <div className="min-w-0 hidden sm:block">
            <span className="text-[14px] font-semibold truncate block" style={{ color: 'var(--color-text-primary)' }}>Edit Post</span>
            {(lastSaved || wordCount > 0) && (
              <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {lastSaved && <span className="flex items-center gap-0.5"><Clock size={9} /> Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                {wordCount > 0 && <span>{wordCount}w · {readTime}min</span>}
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: status === 'published' ? '#dcfce7' : '#fef3c7', color: status === 'published' ? '#16a34a' : '#d97706' }}>
                  {status}
                </span>
              </div>
            )}
          </div>

          {/* Mode Toggle Pill */}
          <div className="flex items-center rounded-lg p-0.5 ml-1" style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-primary)',
          }}>
            <button onClick={() => setViewMode('chat')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all"
              style={viewMode === 'chat' ? { background: 'rgba(245,158,11,0.08)', color: '#d97706', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: 'var(--color-text-muted)' }}>
              <Sparkles size={12} /> AI
            </button>
            <button onClick={() => setViewMode('editor')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all"
              style={viewMode === 'editor' ? {
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              } : { color: 'var(--color-text-muted)' }}>
              <PenTool size={12} /> Editor
            </button>
          </div>
        </div>
        
        {/* Right: Format + Write/Preview + Draft + Publish */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Format Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowFormatDropdown(!showFormatDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-[var(--color-bg-hover)]"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-primary)',
                color: 'var(--color-text-secondary)',
              }}>
              {activeFormat?.Icon && <activeFormat.Icon size={13} style={{ color: activeFormat.color }} />}
              <span className="hidden sm:inline">{activeFormat?.label}</span>
            </button>
            
            {showFormatDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl overflow-hidden z-50" style={{
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border-primary)',
              }}>
                <div className="p-1">
                  {FORMATS.map(f => (
                    <button key={f.id} onClick={() => handleFormatChange(f.id)}
                      className={`w-full text-left px-3 py-2 text-[13px] rounded-lg flex items-center gap-2 transition-colors ${
                        format === f.id 
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 font-medium'
                          : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
                      }`}>
                      <f.Icon size={14} style={{ color: format === f.id ? f.color : f.color + '99' }} />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Write/Preview toggle (editor mode only) */}
          {viewMode === 'editor' && (format === 'richtext' || format === 'product') && (
            <div className="hidden sm:flex items-center p-0.5 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)' }}>
              <button onClick={() => setPreviewMode(false)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-all"
                style={!previewMode ? { background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: 'var(--color-text-muted)' }}>
                <PenTool size={11} /> Write
              </button>
              <button onClick={() => setPreviewMode(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-all"
                style={previewMode ? { background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: 'var(--color-text-muted)' }}>
                <Eye size={11} /> Preview
              </button>
            </div>
          )}


          {status === 'published' && (
            <button onClick={handleRevertToDraft} disabled={saving || publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              style={{
                border: '1px solid var(--color-border-primary)',
                color: 'var(--color-text-secondary)',
              }}>
              <PenTool size={11} className="text-red-500" />
              Revert to Draft
            </button>
          )}

          <button onClick={() => saveDraft(false)} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-[var(--color-bg-hover)]"
            style={{
              border: '1px solid var(--color-border-primary)',
              color: 'var(--color-text-secondary)',
            }}>
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
            Save
          </button>

          <button onClick={handlePublish} disabled={publishing || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
            {publishing ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
            {status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden relative" style={{ background: '#f9fafb' }}>
        {viewMode === 'chat' ? (
          <CopilotChat 
            editorContext={{ content, format }} 
            onApplyContent={handleApplyCopilotContent} 
          />
        ) : (
          /* ── Code-based editors: full page, no padding ── */
          (format === 'markdown' || format === 'latex' || format === 'html') ? (
            <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: '#fff' }}>
              <CodeEditorContent format={format} content={content} onChange={setContent} />
            </div>
          ) : (
            /* ── Rich Text / Product: full-page layout ── */
            <div className="h-full overflow-y-auto w-full" style={{ background: '#f9fafb' }}>
              <div className="w-full px-6 py-6 pb-16">

                {/* Cover Image */}
                {(format === 'richtext' || format === 'product') && (
                  <div className="mb-8">
                    {coverImage ? (
                      <div className="relative group rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
                        <img src={coverImage} alt="Cover" className="w-full aspect-[2.4/1] object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button onClick={() => setCoverImage('')}
                            className="p-2.5 rounded-xl text-white transition-all hover:scale-110 shadow-lg"
                            style={{ background: 'rgba(0,0,0,0.6)' }}>
                            <X size={16} />
                          </button>
                        </div>
                        {coverGenerating && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white shadow-xl">
                              <Loader2 size={14} className="animate-spin text-amber-500" />
                              <span className="text-[13px] font-medium text-gray-700">Generating cover...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <label className="flex-1 flex items-center justify-center gap-2.5 h-16 rounded-2xl cursor-pointer transition-all bg-white hover:bg-gray-50 border-2 border-dashed border-gray-200 hover:border-gray-300">
                          <ImageIcon size={18} className="text-gray-400" />
                          <span className="text-[13px] font-medium text-gray-500">Add a cover image</span>
                          <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                        </label>
                        <button onClick={handleAICover} disabled={coverGenerating || !canGenerateCover}
                          title={!canGenerateCover ? 'Write a title or some content first — the cover is based on your post' : 'Generate a cover from your post'}
                          className="flex flex-col items-center justify-center gap-1 px-6 h-16 rounded-2xl transition-all bg-amber-50 hover:bg-amber-100 border-2 border-dashed border-amber-200 text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          {coverGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          <span className="text-[11px] font-bold uppercase tracking-wider">{coverGenerating ? 'Generating' : 'AI Cover'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Launch Fields */}
                {format === 'product' && (
                  <div className="mb-8 rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e7eb', background: '#fff' }}>

                    {/* Header strip */}
                    <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #f3f4f6', background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm border border-amber-100">
                        <Rocket size={16} className="text-rose-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-800">Product Launch</p>
                        <p className="text-[11px] text-gray-400">Fill in your product details before writing</p>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">

                      {/* Row 1: App name + URL */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider text-gray-400">App / Product Name</label>
                          <input
                            value={appName} onChange={e => setAppName(e.target.value)}
                            placeholder="e.g. BlogWrite"
                            className="w-full px-4 py-2.5 rounded-xl text-[14px] font-medium focus:outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider text-gray-400">Product URL</label>
                          <div className="flex items-center gap-2">
                            {/* Detected icon preview */}
                            <div className="w-10 h-10 shrink-0 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                              {iconDetecting ? (
                                <Loader2 size={14} className="animate-spin text-gray-400" />
                              ) : appIcon ? (
                                <img src={appIcon} alt="icon" className="w-full h-full object-cover" onError={() => setAppIcon(null)} />
                              ) : (
                                <Globe size={18} className="text-gray-400" />
                              )}
                            </div>
                            <input
                              type="url" value={productUrl}
                              onChange={e => setProductUrl(e.target.value)}
                              onBlur={e => detectIcon(e.target.value)}
                              placeholder="https://yourapp.com"
                              className="flex-1 px-4 py-2.5 rounded-xl text-[14px] focus:outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Pricing + Launch Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider text-gray-400">Pricing</label>
                          <input
                            value={pricing} onChange={e => setPricing(e.target.value)}
                            placeholder="Free · $9/mo · $49 one-time"
                            className="w-full px-4 py-2.5 rounded-xl text-[14px] focus:outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider text-gray-400">Launch Date</label>
                          <input
                            type="date" value={launchDate} onChange={e => setLaunchDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-[14px] focus:outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Row 3: Short description */}
                      <div>
                        <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider text-gray-400">Short Description</label>
                        <textarea
                          value={appDescription} onChange={e => setAppDescription(e.target.value)}
                          placeholder="One or two sentences describing what your product does and who it's for..."
                          rows={2}
                          className="w-full px-4 py-2.5 rounded-xl text-[14px] focus:outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                        />
                      </div>

                      {/* Row 4: App screenshots */}
                      <div>
                        <label className="block text-[11px] font-bold mb-2 uppercase tracking-wider text-gray-400">App Screenshots / Designs</label>
                        <div className="flex flex-wrap gap-3">
                          {appImages.map((img, i) => (
                            <div key={i} className="relative group w-28 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                              <img src={img} alt={`screenshot-${i}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setAppImages(appImages.filter((_, j) => j !== i))}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={10} className="text-white" />
                              </button>
                            </div>
                          ))}
                          {appImages.length < 6 && (
                            <label className="w-28 h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-amber-50 group">
                              <ImageIcon size={18} className="text-gray-300 group-hover:text-amber-400 transition-colors mb-1" />
                              <span className="text-[10px] font-semibold text-gray-300 group-hover:text-amber-400 transition-colors">Add image</span>
                              <input
                                type="file" accept="image/*" multiple className="hidden"
                                onChange={e => {
                                  const files = Array.from(e.target.files || []);
                                  files.forEach(file => {
                                    const reader = new FileReader();
                                    reader.onload = ev => setAppImages(prev => [...prev, ev.target.result].slice(0, 6));
                                    reader.readAsDataURL(file);
                                  });
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          )}
                        </div>
                        <p className="mt-1.5 text-[11px] text-gray-400">Upload up to 6 screenshots or design mockups (PNG, JPG, WebP)</p>
                      </div>

                    </div>
                  </div>
                )}

                {/* Rich Text / Product Editor Canvas */}
                <div className="rounded-2xl overflow-hidden mb-6 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb', minHeight: 'calc(100vh - 220px)' }}>
                  {previewMode && format === 'product' ? (
                    <ProductLaunchPreview
                      appName={appName}
                      productUrl={productUrl}
                      pricing={pricing}
                      launchDate={launchDate}
                      appDescription={appDescription}
                      content={content}
                      appImages={appImages}
                      coverImage={coverImage}
                    />
                  ) : previewMode ? (
                    <PreviewContent content={content} />
                  ) : (
                    <BlogEditorContent content={content} onChange={setContent} />
                  )}
                </div>

                {/* Tags Section */}
                <div className="pt-6" style={{ borderTop: '1px solid #e5e7eb' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Tag size={16} className="text-gray-400" />
                    <span className="text-[14px] font-semibold text-gray-700">Tags</span>
                    <span className="text-[12px] text-gray-400">({tags.length}/6)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {tags.map(tag => (
                      <span key={tag}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all bg-amber-50 text-amber-700 border border-amber-200">
                        #{tag}
                        <button onClick={() => setTags(tags.filter(t => t !== tag))}
                          className="hover:text-red-500 transition-colors ml-1">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center">
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                        className="px-4 py-2 rounded-full text-[13px] focus:outline-none w-32 transition-all focus:w-48 bg-gray-50 text-gray-800 border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                        placeholder="Add a tag..."
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}} />
                      {tagInput.trim() && (
                        <button onClick={addTag}
                          className="ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )
        )}
      </div>

      {/* Custom Dialog Overlay */}
      {(showRevertConfirm || showFormatConfirm || showAlert) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          {showRevertConfirm && (
            <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border-primary)] transition-all animate-scale-up"
              style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
              <h3 className="text-[17px] font-bold mb-2.5" style={{ fontFamily: 'var(--font-serif)' }}>
                Revert to Draft
              </h3>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Are you sure you want to revert this published post back to a draft? It will no longer be visible to the public.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowRevertConfirm(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--color-bg-hover)] cursor-pointer"
                  style={{ border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowRevertConfirm(false);
                    executeRevertToDraft();
                  }}
                  className="px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}

          {showFormatConfirm && (
            <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border-primary)] transition-all animate-scale-up"
              style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
              <h3 className="text-[17px] font-bold mb-2.5" style={{ fontFamily: 'var(--font-serif)' }}>
                Switch Format
              </h3>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Switching formats will clear your content. Are you sure you want to continue?
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => {
                    setShowFormatConfirm(false);
                    setPendingFormat(null);
                  }}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--color-bg-hover)] cursor-pointer"
                  style={{ border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowFormatConfirm(false);
                    executeFormatChange(pendingFormat);
                  }}
                  className="px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {showAlert && (
            <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border-primary)] transition-all animate-scale-up"
              style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
              <h3 className="text-[17px] font-bold mb-2.5" style={{ fontFamily: 'var(--font-serif)' }}>
                {showAlert.type === 'error' ? 'Error' : 'Success'}
              </h3>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                {showAlert.message}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowAlert(null);
                  }}
                  className="px-5 py-2 rounded-xl text-[13px] font-bold text-white transition-all bg-amber-500 hover:bg-amber-600 shadow-md cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EditPostPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" /></div>}>
      <EditPostPage />
    </Suspense>
  );
}

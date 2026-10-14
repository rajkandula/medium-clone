'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Maximize2, Minimize2, Copy, Check } from 'lucide-react';
import './editor-blocks.css';

import { renderLatex } from '@/lib/latex';
import { sanitizeMermaidCode } from '@/lib/mermaid-sanitize';


// ─── Markdown Renderer ───────────────────────────────────────────────────────
function renderMarkdown(code) {
  if (!code.trim()) return '<p style="color:var(--color-text-muted);text-align:center;padding:40px">Start writing Markdown...</p>';
  let processed = code;
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try { return `<div class="latex-display-block">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`; }
    catch { return `<div style="color:#ef4444">Error: ${math.substring(0, 40)}</div>`; }
  });
  processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_, math) => {
    try { return katex.renderToString(math, { displayMode: false, throwOnError: false }); }
    catch { return `<span style="color:#ef4444">${math}</span>`; }
  });
  return marked.parse(processed);
}

// ─── HTML Renderer ───────────────────────────────────────────────────────────
function buildHtmlSrcdoc(code) {
  if (!code.trim()) return '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#999"><p>Start writing HTML...</p></body></html>';
  
  const injectBase = (html) => {
    if (html.includes('<base ')) return html;
    if (/<head>/i.test(html)) return html.replace(/<head>/i, '<head><base target="_blank">');
    return `<base target="_blank">\n${html}`;
  };

  if (code.includes('<html') || code.includes('<body') || code.includes('<!DOCTYPE')) {
    return injectBase(code);
  }
  return `<!DOCTYPE html><html><head><base target="_blank"><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,sans-serif}</style></head><body>${code}</body></html>`;
}

function LineNumbers({ count }) {
  return (
    <div className="select-none text-right pr-3 pt-4 pb-4" style={{ color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: '1.65', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", minWidth: '36px' }}>
      {Array.from({ length: Math.max(count, 20) }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

export default function CodeEditor({ format, content, onChange }) {
  const [code, setCode] = useState(content || '');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const iframeRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (content !== undefined && content !== code) setCode(content);
  }, [content]);

  const handleChange = useCallback((val) => {
    setCode(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange?.(val), 300);
  }, [onChange]);

  useEffect(() => {
    if (format === 'html' && iframeRef.current) iframeRef.current.srcdoc = buildHtmlSrcdoc(code);
  }, [code, format]);

  // Post-process Mermaid diagrams in editor preview
  useEffect(() => {
    if (format !== 'markdown') return;
    
    let active = true;
    const renderMermaid = async () => {
      const elements = previewRef.current?.querySelectorAll('pre code.language-mermaid');
      if (!elements || elements.length === 0) return;
      
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
          
          const codeText = el.textContent;
          const sanitizedCode = sanitizeMermaidCode(codeText);
          const id = `mermaid-editor-${Math.random().toString(36).substring(2, 11)}`;
          
          try {
            const { svg } = await mermaid.render(id, sanitizedCode);
            if (!active) return;
            
            const container = document.createElement('div');
            container.className = 'mermaid-diagram-container flex justify-center my-6 p-4 rounded-xl border border-gray-100 bg-gray-50/50 overflow-x-auto';
            container.innerHTML = svg;
            
            pre.setAttribute('data-mermaid-rendered', 'true');
            pre.replaceWith(container);
          } catch (renderErr) {
            console.warn('Mermaid render error in editor:', renderErr);
          }
        }
      } catch (err) {
        console.error('Failed to load/initialize mermaid in editor:', err);
      }
    };
    
    const timer = setTimeout(renderMermaid, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [code, format]);

  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleTab = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newVal = code.substring(0, selectionStart) + '  ' + code.substring(selectionEnd);
      handleChange(newVal);
      requestAnimationFrame(() => { e.target.selectionStart = e.target.selectionEnd = selectionStart + 2; });
    }
  };

  const lineCount = code.split('\n').length;
  const formatConfig = {
    latex: { label: 'LaTeX', icon: '📐', color: '#8b5cf6', placeholder: `\\title{My Blog Post}\n\n\\section{Introduction}\n\nThis is a paragraph with inline math $E = mc^2$.\n\n$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$\n\n\\section{Conclusion}\n\nFinal thoughts here.` },
    markdown: { label: 'Markdown', icon: '📝', color: '#06b6d4', placeholder: `# My Blog Post\n\n## Introduction\n\nWrite in **Markdown** with *rich formatting*.\n\n\`\`\`javascript\nconst hello = () => console.log('Hello');\n\`\`\`\n\n> Blockquotes work too!\n\n- List item 1\n- List item 2` },
    html: { label: 'HTML / CSS / JS', icon: '🌐', color: '#f59e0b', placeholder: `<style>\n  .container { display:flex; align-items:center; justify-content:center; min-height:100vh; background:linear-gradient(135deg,#667eea,#764ba2); font-family:system-ui; }\n  h1 { color:white; font-size:3rem; }\n</style>\n<div class="container"><h1>Hello World ✨</h1></div>` },
  };
  const cfg = formatConfig[format] || formatConfig.markdown;

  return (
    <div className={`code-editor-root ${fullscreen ? 'code-editor-fullscreen' : ''}`} style={{ '--accent': cfg.color }}>
      <div className="code-editor-header">
        <div className="flex items-center gap-2">
          <span className="text-sm">{cfg.icon}</span>
          <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}15`, color: cfg.color }}>{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="p-1.5 rounded-md transition-all text-xs" style={{ color: copied ? '#16a34a' : 'var(--color-text-muted)' }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded-md transition-all" style={{ color: 'var(--color-text-muted)' }}>
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>
      <div className="code-editor-split">
        <div className="code-editor-code">
          <div className="code-editor-code-inner">
            <LineNumbers count={lineCount} />
            <textarea ref={textareaRef} value={code} onChange={e => handleChange(e.target.value)} onKeyDown={handleTab}
              placeholder={cfg.placeholder} className="code-editor-textarea" spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
          </div>
        </div>
        <div className="code-editor-divider" />
        <div className="code-editor-preview">
          <div className="code-editor-preview-label"><span>Preview</span></div>
          <div className="code-editor-preview-content" ref={previewRef}>
            {format === 'html' ? (
              <iframe ref={iframeRef} className="code-editor-iframe" sandbox="allow-scripts" title="HTML Preview" />
            ) : (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: format === 'latex' ? renderLatex(code) : renderMarkdown(code) }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEditor, EditorContent as TipTapContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Node, mergeAttributes } from '@tiptap/core';
import { common, createLowlight } from 'lowlight';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './editor-blocks.css';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Minus, Undo, Redo,
  Sigma, FileCode2, Play, Palette, X, Check
} from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';

const lowlight = createLowlight(common);

// ─── Code Block Component ────────────────────────────────────────────────────
const LANGUAGES = [
  { value: '', label: 'Auto' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'xml', label: 'XML' },
];

function CodeBlockView({ node, updateAttributes, extension }) {
  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div className="code-block-header">
        <div className="code-block-dots">
          <span /><span /><span />
        </div>
        <select
          contentEditable={false}
          value={node.attrs.language || ''}
          onChange={e => updateAttributes({ language: e.target.value })}
          className="code-block-lang-select"
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

// ─── Math Block Extension ────────────────────────────────────────────────────
const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  
  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: el => el.getAttribute('data-latex') || '',
        renderHTML: attrs => ({ 'data-latex': attrs.latex }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-math-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-math-block': '', class: 'math-block-container' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView);
  },
});

function MathBlockView({ node, updateAttributes, selected }) {
  const [editing, setEditing] = useState(!node.attrs.latex);
  const [latex, setLatex] = useState(node.attrs.latex || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const renderMath = useCallback(() => {
    try {
      return katex.renderToString(latex || 'E = mc^2', {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return '<span style="color:#ef4444">Invalid LaTeX</span>';
    }
  }, [latex]);

  const handleSave = () => {
    updateAttributes({ latex });
    setEditing(false);
  };

  return (
    <NodeViewWrapper className="math-block-wrapper">
      {editing ? (
        <div className="math-block-editor">
          <div className="math-block-editor-header">
            <Sigma size={14} />
            <span>LaTeX Math Block</span>
          </div>
          <textarea
            ref={textareaRef}
            value={latex}
            onChange={e => setLatex(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSave();
              }
            }}
            className="math-block-textarea"
            placeholder="Enter LaTeX: E = mc^2, \int_0^1 x^2 dx, \frac{a}{b}..."
            rows={3}
          />
          <div className="math-block-editor-footer">
            <span className="math-block-hint">⌘+Enter to save</span>
            <button onClick={handleSave} className="math-block-save-btn">
              <Play size={12} /> Render
            </button>
          </div>
          {latex && (
            <div className="math-block-preview">
              <span className="math-block-preview-label">Preview</span>
              <div dangerouslySetInnerHTML={{ __html: renderMath() }} />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`math-block-rendered ${selected ? 'selected' : ''}`}
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          <div dangerouslySetInnerHTML={{ __html: renderMath() }} />
        </div>
      )}
    </NodeViewWrapper>
  );
}

// ─── HTML Embed Extension ────────────────────────────────────────────────────
const HtmlEmbed = Node.create({
  name: 'htmlEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: {
        default: '',
        parseHTML: el => el.getAttribute('data-code') || '',
        renderHTML: attrs => ({ 'data-code': attrs.code }),
      },
      height: {
        default: '200',
        parseHTML: el => el.getAttribute('data-height') || '200',
        renderHTML: attrs => ({ 'data-height': attrs.height }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-html-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-html-embed': '', class: 'html-embed-container' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlEmbedView);
  },
});

function HtmlEmbedView({ node, updateAttributes, selected }) {
  const [editing, setEditing] = useState(!node.attrs.code);
  const [code, setCode] = useState(node.attrs.code || '');
  const [height, setHeight] = useState(node.attrs.height || '200');
  const iframeRef = useRef(null);

  const getSrcdoc = useCallback(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; background: transparent; overflow: hidden; }
  </style>
</head>
<body>${code}</body>
</html>`;
  }, [code]);

  const handleSave = () => {
    updateAttributes({ code, height });
    setEditing(false);
  };

  return (
    <NodeViewWrapper className="html-embed-wrapper">
      {editing ? (
        <div className="html-embed-editor">
          <div className="html-embed-editor-header">
            <FileCode2 size={14} />
            <span>HTML / SVG / CSS Embed</span>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="html-embed-textarea"
            placeholder={`Paste HTML, SVG, or CSS animations here...\n\nExample:\n<svg width="100" height="100">\n  <circle cx="50" cy="50" r="40" fill="#f59e0b"/>\n</svg>\n\nOr animated:\n<style>\n  @keyframes spin { to { transform: rotate(360deg) } }\n  .box { width:60px; height:60px; background:#f59e0b; animation: spin 2s linear infinite; }\n</style>\n<div class="box"></div>`}
            rows={10}
            spellCheck={false}
          />
          <div className="html-embed-editor-footer">
            <div className="html-embed-height-control">
              <label>Height:</label>
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                min="100"
                max="800"
                step="50"
              />
              <span>px</span>
            </div>
            <button onClick={handleSave} className="html-embed-save-btn">
              <Play size={12} /> Preview
            </button>
          </div>
          {code && (
            <div className="html-embed-live-preview">
              <span className="html-embed-preview-label">Live Preview</span>
              <iframe
                srcDoc={getSrcdoc()}
                style={{ width: '100%', height: `${height}px`, border: 'none', borderRadius: '8px' }}
                sandbox="allow-scripts"
                title="HTML Preview"
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`html-embed-rendered ${selected ? 'selected' : ''}`}
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          <iframe
            ref={iframeRef}
            srcDoc={getSrcdoc()}
            style={{ width: '100%', height: `${height}px`, border: 'none', pointerEvents: 'none' }}
            sandbox="allow-scripts"
            title="HTML Embed"
          />
          <div className="html-embed-overlay">
            <FileCode2 size={14} />
            <span>Click to edit</span>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

// ─── Toolbar Button ──────────────────────────────────────────────────────────
function ToolbarButton({ onClick, active, children, title }) {
  return (
    <button onClick={onClick} title={title}
      className="p-2 rounded-md transition-colors"
      style={{
        background: active ? 'var(--color-brand-glow)' : 'transparent',
        color: active ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
      }}>
      {children}
    </button>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────
export default function BlogEditor({ content, onChange }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false, // Disable default, use lowlight version
      }),
      LinkExt.configure({ openOnClick: false }),
      ImageExt,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing your story...' }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView);
        },
      }).configure({ lowlight }),
      MathBlock,
      HtmlEmbed,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: { class: 'ProseMirror focus:outline-none min-h-[400px]' },
    },
  });

  const [urlPopover, setUrlPopover] = useState(null); // 'link' | 'image' | null
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content, false);
    }
  }, [content]);

  if (!editor) return null;

  const addImage = () => {
    if (urlPopover === 'image') { setUrlPopover(null); return; }
    setUrlInput('');
    setUrlPopover('image');
  };

  const addLink = () => {
    if (urlPopover === 'link') { setUrlPopover(null); return; }
    setUrlInput('');
    setUrlPopover('link');
  };

  const submitUrl = () => {
    if (!urlInput.trim()) { setUrlPopover(null); return; }
    if (urlPopover === 'image') {
      editor.chain().focus().setImage({ src: urlInput.trim() }).run();
    } else if (urlPopover === 'link') {
      editor.chain().focus().setLink({ href: urlInput.trim() }).run();
    }
    setUrlInput('');
    setUrlPopover(null);
  };

  const addMathBlock = () => {
    editor.chain().focus().insertContent({
      type: 'mathBlock',
      attrs: { latex: '' },
    }).run();
  };

  const addHtmlEmbed = () => {
    editor.chain().focus().insertContent({
      type: 'htmlEmbed',
      attrs: { code: '', height: '200' },
    }).run();
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={16} />
        </ToolbarButton>
        <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border-primary)' }} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={16} />
        </ToolbarButton>
        <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border-primary)' }} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <Code size={16} />
        </ToolbarButton>
        <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border-primary)' }} />
        <ToolbarButton onClick={addMathBlock} title="LaTeX Math Block">
          <Sigma size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={addHtmlEmbed} title="HTML / SVG Embed">
          <FileCode2 size={16} />
        </ToolbarButton>
        <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border-primary)' }} />
        <ToolbarButton onClick={addLink} title="Add Link">
          <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Add Image">
          <ImageIcon size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus size={16} />
        </ToolbarButton>
        <div className="flex-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo size={16} />
        </ToolbarButton>
      </div>

      {/* URL Input Popover */}
      {urlPopover && (
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--color-border-primary)', background: 'var(--color-bg-tertiary)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            {urlPopover === 'image' ? '🖼 Image URL' : '🔗 Link URL'}
          </span>
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitUrl(); if (e.key === 'Escape') setUrlPopover(null); }}
            placeholder={urlPopover === 'image' ? 'https://example.com/image.jpg' : 'https://example.com'}
            autoFocus
            className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
          />
          <button onClick={submitUrl}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: '#16a34a', background: 'rgba(22,163,74,0.1)' }}>
            <Check size={14} />
          </button>
          <button onClick={() => setUrlPopover(null)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-hover)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Editor */}
      <TipTapContent editor={editor} />
    </div>
  );
}

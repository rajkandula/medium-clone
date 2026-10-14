'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Send, Sparkles, ArrowRightSquare, Zap, BookOpen, Lightbulb, Rocket,
  Plus, X, FileText, Link2, Image, Clipboard, AlignLeft, Wand2,
  PenLine, Search
} from 'lucide-react';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { sanitizeRichHtml } from '@/lib/sanitize';
import { sanitizeMermaidCode } from '@/lib/mermaid-sanitize';

// Render assistant markdown with KaTeX math + safe rich HTML. Mermaid ```mermaid code
// blocks survive sanitization (pre/code + class) and are turned into diagrams by a
// post-render effect.
function renderRichMarkup(raw) {
  let processed = raw || '';
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try { return `<div class="katex-block">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`; }
    catch { return math; }
  });
  processed = processed.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (_, math) => {
    try { return katex.renderToString(math, { displayMode: false, throwOnError: false }); }
    catch { return math; }
  });
  return sanitizeRichHtml(marked.parse(processed, { breaks: true }));
}

const SUGGESTIONS = [
  { icon: PenLine,    text: 'Write a blog post from scratch'       },
  { icon: Rocket,     text: 'Draft a product launch announcement'  },
  { icon: Search,     text: 'Research a topic and summarize it'   },
  { icon: Lightbulb,  text: 'Generate content ideas for my niche' },
];

// Quick actions that appear in the + menu
const QUICK_ACTIONS = [
  {
    icon: AlignLeft,
    label: 'Use template',
    description: 'Start from a structured template',
    action: 'template',
  },
  {
    icon: Clipboard,
    label: 'Paste context',
    description: 'Share notes or background info',
    action: 'context',
  },
  {
    icon: Link2,
    label: 'Add URL',
    description: 'Summarize or write about a link',
    action: 'url',
  },
  {
    icon: Wand2,
    label: 'Improve draft',
    description: 'Polish my current editor content',
    action: 'improve',
  },
];

const TEMPLATES = [
  { label: 'How-to guide',         prompt: 'Write a step-by-step how-to guide about ' },
  { label: 'Product announcement', prompt: 'Write a compelling product announcement for ' },
  { label: 'Opinion essay',        prompt: 'Write an opinion essay arguing that '         },
  { label: 'Case study',           prompt: 'Write a detailed case study about '           },
  { label: 'Newsletter intro',     prompt: 'Write a newsletter introduction about '       },
];

// Extract text content from a message (v3 uses parts-based messages)
const getMessageText = (m) => {
  if (!m) return '';
  if (typeof m.content === 'string') return m.content;
  if (m.parts) {
    return m.parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('');
  }
  return '';
};

// Regex to find [GENERATE_IMAGE: prompt] markers
const IMAGE_MARKER_RE = /\[GENERATE_IMAGE:\s*(.+?)\]/g;

// Extract image prompts from text
const extractImagePrompts = (text) => {
  const prompts = [];
  let match;
  const re = new RegExp(IMAGE_MARKER_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    prompts.push(match[1].trim());
  }
  return prompts;
};

export default function CopilotChat({ editorContext, onApplyContent }) {
  const [dynamicSuggestions, setDynamicSuggestions] = useState(SUGGESTIONS);
  const [inputValue, setInputValue] = useState('');
  const [showPlusMenu,    setShowPlusMenu]    = useState(false);
  const [plusMode,        setPlusMode]        = useState(null); // 'template' | 'url' | 'context' | null
  const [urlDraft,        setUrlDraft]        = useState('');
  const [contextDraft,    setContextDraft]    = useState('');

  // Image generation state
  const [generatingImages, setGeneratingImages] = useState({}); // { [prompt]: true/false }
  const [generatedImages,  setGeneratedImages]  = useState({}); // { [prompt]: url }

  // Refs
  const lastProcessedMessageIdRef = useRef(null);
  const messagesEndRef  = useRef(null);
  const chatBodyRef     = useRef(null);
  const textareaRef     = useRef(null);
  const plusMenuRef     = useRef(null);
  const urlInputRef     = useRef(null);
  const processedPromptsRef = useRef(new Set());

  const setInput = (value) => setInputValue(value);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/copilot/topics');
        const data = await res.json();
        if (data.success && data.topics) {
          const getCategoryIcon = (category) => {
            const c = category?.toLowerCase() || '';
            if (c.includes('ai') || c.includes('machine learning')) return Sparkles;
            if (c.includes('dev') || c.includes('coding') || c.includes('programming') || c.includes('web')) return Zap;
            if (c.includes('startup') || c.includes('business')) return Rocket;
            if (c.includes('career') || c.includes('productivity')) return Zap;
            if (c.includes('design') || c.includes('ux')) return Lightbulb;
            return BookOpen;
          };

          const dynamicList = data.topics.slice(0, 4).map(t => ({
            text: `Write about: ${t.topic}`,
            icon: getCategoryIcon(t.category),
            badge: t.category
          }));

          setDynamicSuggestions([
            { icon: PenLine, text: 'Write a blog post from scratch' },
            { icon: Search, text: 'Research a topic and summarize it' },
            ...dynamicList
          ]);
        }
      } catch (err) {
        console.error('Failed to load dynamic suggestions:', err);
      }
    };
    fetchSuggestions();
  }, []);

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/copilot',
    body: {
      editorContext: {
        content: editorContext?.content || '',
        format:  editorContext?.format  || 'Rich Text',
      },
    },
  }), [editorContext?.content, editorContext?.format]);

  const {
    messages, sendMessage, setMessages, status, error,
  } = useChat({
    id: 'copilot-chat',
    transport,
  });

  // Derive isLoading from status for backward compat in the template
  const isLoading = status === 'submitted' || status === 'streaming';

  // Automatically sync the latest assistant message to the editor content in the background
  useEffect(() => {
    if (isLoading || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant') {
      const text = getMessageText(lastMsg);
      if (!text) return;

      // Find the user's last prompt before this assistant message
      const userMessages = messages.filter(m => m.role === 'user');
      const lastUserMsg = userMessages[userMessages.length - 1];
      const lastUserPrompt = lastUserMsg ? getMessageText(lastUserMsg).trim().toLowerCase() : '';

      // Auto-apply when the AI produced something that actually LOOKS like a draft
      // (long or structured) — this catches "how to…", "explain…", "guide to…" etc.
      // without brittle keyword matching — plus the explicit "content ideas" requests.
      const plainWords = text.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
      const headingCount = (text.match(/(^|\n)#{1,3}\s|<h[1-3]\b/gi) || []).length;
      const looksLikeDraft = plainWords >= 100 || headingCount >= 2;
      const isTopicRequest =
        lastUserPrompt.includes('content ideas') ||
        lastUserPrompt.includes('brainstorm') ||
        lastUserPrompt.includes('suggest some topics') ||
        lastUserPrompt.includes('suggest topics');
      const isGenerationCommand = looksLikeDraft || isTopicRequest;

      if (isGenerationCommand) {
        const imagePrompts = extractImagePrompts(text);
        let fullContent = text;
        
        imagePrompts.forEach((prompt) => {
          const url = generatedImages[prompt];
          if (url) {
            const escapedPrompt = prompt.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const markerRegex = new RegExp(`\\[GENERATE_IMAGE:\\s*${escapedPrompt}\\s*\\]`, 'g');
            if (markerRegex.test(fullContent)) {
              fullContent = fullContent.replace(markerRegex, `![${prompt}](${url})`);
            } else {
              fullContent += `\n\n![${prompt}](${url})\n\n`;
            }
          }
        });

        // Call onApplyContent with isAuto=true
        onApplyContent?.(fullContent, true);
      }
    }
  }, [messages, isLoading, generatedImages, onApplyContent]);

  // Close plus menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setShowPlusMenu(false);
        setPlusMode(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const isImageGenerating = Object.values(generatingImages).some(Boolean);
    const scrollBehavior = (isLoading || isImageGenerating) ? 'auto' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior });
  }, [messages, isLoading, generatingImages]);

  useEffect(() => {
    if (plusMode === 'url') setTimeout(() => urlInputRef.current?.focus(), 50);
  }, [plusMode]);

  const renderMarkdown = (content) => {
    return { __html: renderRichMarkup(content) };
  };

  // Helper functions moved to top-level

  // Generate image from prompt
  const generateImage = async (prompt) => {
    if (generatingImages[prompt] || generatedImages[prompt]) return;
    setGeneratingImages(prev => ({ ...prev, [prompt]: true }));
    try {
      const res = await fetch('/api/copilot/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.url) {
        setGeneratedImages(prev => ({ ...prev, [prompt]: data.url }));
      }
    } catch (err) {
      console.error('Image generation failed:', err);
    }
    setGeneratingImages(prev => ({ ...prev, [prompt]: false }));
  };

  // Auto-detect image markers in assistant messages and trigger generation
  useEffect(() => {
    if (isLoading) return; // Wait until response is complete
    for (const m of messages) {
      if (m.role !== 'assistant') continue;
      const text = getMessageText(m);
      const prompts = extractImagePrompts(text);
      for (const prompt of prompts) {
        if (!processedPromptsRef.current.has(prompt)) {
          processedPromptsRef.current.add(prompt);
          generateImage(prompt);
        }
      }
    }
  }, [messages, isLoading]);

  // Turn Mermaid code blocks in the chat into rendered diagrams, so you see the visual before applying.
  useEffect(() => {
    if (isLoading) return;
    const root = chatBodyRef.current;
    if (!root) return;
    let active = true;
    const run = async () => {
      const els = root.querySelectorAll('pre code.language-mermaid');
      if (!els.length) return;
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose', suppressErrorRendering: true });
        for (let i = 0; i < els.length; i++) {
          if (!active) return;
          const el = els[i];
          const pre = el.parentElement;
          if (!pre || pre.getAttribute('data-mermaid-done') === '1') continue;
          const code = sanitizeMermaidCode(el.textContent || '');
          const id = `copilot-mmd-${i}-${Math.random().toString(36).slice(2, 9)}`;
          try {
            const { svg } = await mermaid.render(id, code);
            if (!active) return;
            const box = document.createElement('div');
            box.style.cssText = 'margin:10px 0;overflow-x:auto;';
            box.innerHTML = svg;
            pre.setAttribute('data-mermaid-done', '1');
            pre.replaceWith(box);
          } catch {}
        }
      } catch {}
    };
    const t = setTimeout(run, 200);
    return () => { active = false; clearTimeout(t); };
  }, [messages, isLoading]);

  // Render message text, replacing image markers with inline images or loading placeholders
  const renderMessageContent = (text) => {
    const parts = text.split(IMAGE_MARKER_RE);
    // parts = [text, prompt, text, prompt, ...]
    if (parts.length <= 1) return renderMarkdown(text);

    return { __html: parts.map((part, i) => {
      if (i % 2 === 0) {
        // Normal text — render with KaTeX math + safe rich HTML.
        return renderRichMarkup(part);
      } else {
        // This is an image prompt
        const prompt = part.trim();
        const url = generatedImages[prompt];
        const loading = generatingImages[prompt];
        if (url) {
          return `<div class="copilot-generated-image" data-prompt="${prompt.replace(/"/g, '&quot;')}">
            <img src="${url}" alt="${prompt.replace(/"/g, '&quot;')}" style="width:100%;border-radius:12px;margin:12px 0;" />
          </div>`;
        } else if (loading) {
          return `<div style="display:flex;align-items:center;gap:8px;padding:16px 20px;margin:12px 0;border-radius:12px;background:#fffbeb;border:1px solid #fde68a;">
            <div style="width:16px;height:16px;border:2px solid #f59e0b;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite"></div>
            <span style="font-size:13px;color:#92400e;font-weight:500;">Generating image...</span>
          </div>`;
        } else {
          return `<div style="display:flex;align-items:center;gap:8px;padding:16px 20px;margin:12px 0;border-radius:12px;background:#f3f4f6;border:1px solid #e5e7eb;">
            <span style="font-size:13px;color:#6b7280;">Image: ${prompt}</span>
          </div>`;
        }
      }
    }).join('') };
  };

  const handleSuggestion = (text) => {
    setInput(text);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handlePlusAction = (action) => {
    if (action === 'improve') {
      const draft = editorContext?.content
        ? 'Please improve and polish my current draft. Make it more engaging, clear, and professional.'
        : 'Help me improve my writing. Ask me what I have so far.';
      setInput(draft);
      setShowPlusMenu(false);
      setPlusMode(null);
      setTimeout(() => textareaRef.current?.focus(), 0);
    } else {
      setPlusMode(action);
    }
  };

  const applyUrl = () => {
    if (!urlDraft.trim()) return;
    setInput(`Summarize and write a blog post about this URL: ${urlDraft.trim()}`);
    setUrlDraft('');
    setShowPlusMenu(false);
    setPlusMode(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const applyContext = () => {
    if (!contextDraft.trim()) return;
    setInput(`Here is some background context for my blog post:\n\n${contextDraft.trim()}\n\nPlease help me write a compelling blog post based on this.`);
    setContextDraft('');
    setShowPlusMenu(false);
    setPlusMode(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const applyTemplate = (prompt) => {
    setInput(prompt);
    setShowPlusMenu(false);
    setPlusMode(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue.trim();
    setInputValue('');
    if (textareaRef.current) { textareaRef.current.style.height = '52px'; }
    await sendMessage({ text });
  };

  return (
    <div className="flex flex-col h-full relative bg-white">

      {/* Clear Chat */}
      {messages.length > 0 && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setMessages([])}
            className="text-xs font-medium px-3 py-1.5 rounded-full transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Messages / Empty State ── */}
      <div
        ref={chatBodyRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 pb-44 pt-6"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
      >
        <div className="max-w-2xl mx-auto w-full">

          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Icon mark */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-50 border border-amber-100 shadow-sm">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  What would you like to create?
                </h2>
                <p className="text-[15px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Write blogs, research topics, draft product launches, or generate fresh content ideas — all in one place.
                </p>
              </div>

              {/* Suggestion chips */}
              <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
                {dynamicSuggestions.map(({ icon: Icon, text, badge }) => (
                  <button
                    key={text}
                    onClick={() => handleSuggestion(text)}
                    className="flex flex-col items-start gap-1 px-4 py-3 rounded-xl text-left text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all hover:shadow-sm active:scale-[0.98] relative group"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="w-4 h-4 shrink-0 text-amber-500 group-hover:scale-110 transition-transform" />
                      <span className="line-clamp-2 leading-snug">{text}</span>
                    </div>
                    {badge && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md mt-1 font-semibold tracking-wide uppercase">
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          ) : (
            /* Message Thread */
            <div className="space-y-6 pt-4">
              {messages.map((m) => {
                const text = getMessageText(m);
                const imagePrompts = m.role === 'assistant' ? extractImagePrompts(text) : [];
                return (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                  {/* AI avatar */}
                  {m.role === 'assistant' && (
                    <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-amber-50 border border-amber-100 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[88%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>

                    {m.role === 'user' ? (
                      /* User bubble */
                      <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-[15px] leading-relaxed whitespace-pre-wrap bg-gray-100 text-gray-800">
                        {text}
                      </div>
                    ) : (
                      <>
                        {/* AI response */}
                        <div
                          className="text-[15px] leading-relaxed text-gray-800 prose prose-sm max-w-none prose-p:my-2 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-code:text-amber-600 prose-code:bg-amber-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-xl prose-img:rounded-xl prose-img:shadow-md"
                          dangerouslySetInnerHTML={renderMessageContent(text)}
                        />

                        {/* Action buttons */}
                        {!isLoading && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => {
                                // Combine text with any generated images
                                let fullContent = text;
                                imagePrompts.forEach((prompt) => {
                                  const url = generatedImages[prompt];
                                  if (url) {
                                    const escapedPrompt = prompt.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                                    const markerRegex = new RegExp(`\\[GENERATE_IMAGE:\\s*${escapedPrompt}\\s*\\]`, 'g');
                                    if (markerRegex.test(fullContent)) {
                                      fullContent = fullContent.replace(markerRegex, `![${prompt}](${url})`);
                                    } else {
                                      fullContent += `\n\n![${prompt}](${url})\n\n`;
                                    }
                                  }
                                });
                                onApplyContent?.(fullContent);
                              }}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97]"
                            >
                              <ArrowRightSquare className="w-3.5 h-3.5" />
                              Apply to Editor
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-amber-50 border border-amber-100">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="flex items-center gap-1.5 py-3">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Error notice — shown instead of the indicator silently vanishing */}
              {error && !isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 border border-red-100">
                    <Sparkles className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div className="max-w-md p-3 rounded-2xl border border-red-100 bg-red-50/60 text-[13px] font-medium text-red-700">
                    {error.message || 'Something went wrong generating a response. Please try again.'}
                  </div>
                </div>
              )}

              {/* Reasoning & Actions Log */}
              {(() => {
                const isImageGenerating = Object.values(generatingImages).some(Boolean);
                if (!isLoading && !isImageGenerating) return null;
                return (
                  <div className="p-4 mt-4 rounded-2xl border border-amber-100 bg-amber-50/40 text-[13px] font-medium text-amber-800 space-y-2 max-w-md animate-fade-in shadow-xs">
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-100/50">
                      <Sparkles size={14} className="text-amber-500 animate-pulse" />
                      <span className="font-bold">Agent Execution Plan & Reasoning</span>
                    </div>
                    
                    <div className="space-y-2.5">
                      {/* Step 1: Context Analysis */}
                      <div className="flex items-center gap-2">
                        {status === 'submitted' ? (
                          <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-white text-[9px] font-bold">✓</div>
                        )}
                        <span className={status === 'submitted' ? 'text-amber-900 font-semibold' : 'text-gray-400 font-normal line-through'}>
                          Analyzing request and editor context...
                        </span>
                      </div>

                      {/* Step 2: Content Drafting */}
                      <div className="flex items-center gap-2">
                        {status === 'streaming' ? (
                          <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : status === 'submitted' ? (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-white text-[9px] font-bold">✓</div>
                        )}
                        <span className={status === 'streaming' ? 'text-amber-900 font-semibold' : status === 'submitted' ? 'text-gray-300' : 'text-gray-400 font-normal line-through'}>
                          Streaming structured markdown draft...
                        </span>
                      </div>

                      {/* Step 3: Math and Diagrams rendering */}
                      <div className="flex items-center gap-2">
                        {isLoading ? (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
                        ) : isImageGenerating ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-white text-[9px] font-bold">✓</div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
                        )}
                        <span className={isLoading ? 'text-gray-300' : 'text-amber-900'}>
                          Rendering LaTeX formulas & Mermaid flowcharts...
                        </span>
                      </div>

                      {/* Step 4: Asset Generation */}
                      {(() => {
                        const text = messages.length > 0 ? getMessageText(messages[messages.length - 1]) : '';
                        const imagePrompts = extractImagePrompts(text);
                        if (imagePrompts.length === 0 && !isLoading) return null;
                        
                        return (
                          <div className="flex items-center gap-2">
                            {isImageGenerating ? (
                              <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                            ) : Object.keys(generatedImages).length > 0 ? (
                              <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-white text-[9px] font-bold">✓</div>
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
                            )}
                            <span className={isImageGenerating ? 'text-amber-900 font-semibold' : Object.keys(generatedImages).length > 0 ? 'text-gray-400 font-normal line-through' : 'text-gray-300'}>
                              Generating requested graphic assets...
                            </span>
                          </div>
                        );
                      })()}

                      {/* Step 5: Editor Sync */}
                      <div className="flex items-center gap-2">
                        {isLoading || isImageGenerating ? (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-white text-[9px] font-bold">✓</div>
                        )}
                        <span className={isLoading || isImageGenerating ? 'text-gray-300' : 'text-gray-400 font-normal line-through'}>
                          Syncing completed draft with workspace editor...
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Input ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-6 pb-5 pt-4"
        style={{ background: 'linear-gradient(to top, #fff 70%, transparent)' }}
      >
        <div className="max-w-2xl mx-auto">

          {/* + Action Menu popover */}
          {showPlusMenu && (
            <div
              ref={plusMenuRef}
              className="mb-2 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
            >
              {/* Default: action list */}
              {!plusMode && (
                <div className="p-2">
                  {QUICK_ACTIONS.map(({ icon: Icon, label, description, action }) => (
                    <button
                      key={action}
                      onClick={() => handlePlusAction(action)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 group-hover:bg-amber-50 transition-colors shrink-0">
                        <Icon className="w-4 h-4 text-gray-500 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-800">{label}</p>
                        <p className="text-[11px] text-gray-400">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Template picker */}
              {plusMode === 'template' && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 mb-1">
                    <button onClick={() => setPlusMode(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Choose a template</span>
                  </div>
                  {TEMPLATES.map(({ label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => applyTemplate(prompt)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-[13px] font-medium text-gray-700">{label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* URL input */}
              {plusMode === 'url' && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => setPlusMode(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Add a URL</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={urlInputRef}
                      type="url"
                      value={urlDraft}
                      onChange={e => setUrlDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applyUrl()}
                      placeholder="https://example.com/article"
                      className="flex-1 px-3 py-2 rounded-xl text-[13px] border border-gray-200 bg-gray-50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-gray-800"
                    />
                    <button
                      onClick={applyUrl}
                      className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Context / notes input */}
              {plusMode === 'context' && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => setPlusMode(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Paste background context</span>
                  </div>
                  <textarea
                    value={contextDraft}
                    onChange={e => setContextDraft(e.target.value)}
                    placeholder="Paste notes, outlines, research, or any background info..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl text-[13px] border border-gray-200 bg-gray-50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 resize-none text-gray-800 placeholder:text-gray-400"
                  />
                  <button
                    onClick={applyContext}
                    className="mt-2 w-full py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                  >
                    Use this context
                  </button>
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            className="relative flex items-end rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            {/* + button */}
            <button
              type="button"
              onClick={() => { setShowPlusMenu(v => !v); setPlusMode(null); }}
              className="shrink-0 self-end mb-2.5 ml-2.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{
                background: showPlusMenu ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : '#f3f4f6',
                color: showPlusMenu ? 'white' : '#6b7280',
              }}
              title="Add content or template"
            >
              {showPlusMenu
                ? <X className="w-3.5 h-3.5" />
                : <Plus className="w-3.5 h-3.5" />
              }
            </button>

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); autoResize(e); }}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent py-3.5 pl-3 pr-14 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none resize-none"
              style={{ minHeight: '52px', maxHeight: '160px' }}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputValue.trim() && !isLoading) e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
              style={{
                background: inputValue.trim() ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : '#f3f4f6',
                color: inputValue.trim() ? 'white' : '#9ca3af',
              }}
            >
              <Send className="w-3.5 h-3.5 translate-x-[0.5px] translate-y-[-0.5px]" />
            </button>
          </form>
          <p className="text-center mt-2 text-[10px] tracking-widest font-medium text-gray-300">
            AI CAN MAKE MISTAKES. VERIFY IMPORTANT INFORMATION.
          </p>
        </div>
      </div>
    </div>
  );
}

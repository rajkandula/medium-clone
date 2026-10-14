'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, Send, ArrowLeft, Loader2, ChevronDown, ChevronUp,
  Image as ImageIcon, FileText, Check, Save, Eye, RefreshCw,
  Wand2, Tag, Type, AlignLeft, Palette, X
} from 'lucide-react';

const TONES = ['Professional', 'Casual', 'Academic', 'Conversational', 'Witty', 'Inspirational'];
const LENGTHS = [
  { value: 'short', label: 'Short (~500 words)', icon: '📝' },
  { value: 'medium', label: 'Medium (~1200 words)', icon: '📄' },
  { value: 'long', label: 'Long (~2500 words)', icon: '📖' },
];
const IMAGE_STYLES = ['modern', 'minimal', 'tech', 'illustration', 'abstract', 'cinematic', 'flat', '3d'];

export default function AIGeneratePage() {
  const [step, setStep] = useState('config'); // 'config' | 'generating' | 'preview'
  const [showOptions, setShowOptions] = useState(false);

  // Config fields
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('medium');
  const [tags, setTags] = useState('');
  const [generateImage, setGenerateImage] = useState(true);
  const [imageStyle, setImageStyle] = useState('modern');
  const [customPrompt, setCustomPrompt] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genStage, setGenStage] = useState(''); // 'topic' | 'content' | 'image' | 'done'
  const [generated, setGenerated] = useState(null);

  // Publishing
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(null);

  const previewRef = useRef(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setStep('generating');
    setGenStage(topic ? 'content' : 'topic');

    try {
      // Simulate stage progression for UX
      if (!topic) {
        setGenStage('topic');
        await new Promise(r => setTimeout(r, 500));
      }
      setGenStage('content');

      const res = await fetch('/api/admin/automation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          topic: topic || undefined,
          tone: tone.toLowerCase(),
          length,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          generateImage,
          imageStyle,
          customPrompt: customPrompt || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      setGenStage('image');
      const data = await res.json();
      setGenerated(data.generated);
      setGenStage('done');

      // Small delay to show "done" before transitioning
      await new Promise(r => setTimeout(r, 600));
      setStep('preview');
    } catch (err) {
      alert(err.message || 'Generation failed');
      setStep('config');
    }

    setGenerating(false);
  };

  const handlePublish = async (status = 'published') => {
    if (!generated) return;
    setPublishing(true);

    try {
      const res = await fetch('/api/admin/automation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          status,
          ...generated,
        }),
      });

      if (!res.ok) throw new Error('Publish failed');
      const data = await res.json();
      setPublished(data.post);
    } catch (err) {
      alert(err.message || 'Publish failed');
    }

    setPublishing(false);
  };

  const handleRegenerate = () => {
    setGenerated(null);
    setPublished(null);
    setStep('config');
  };

  // CONFIG STEP
  if (step === 'config') {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <Link href="/admin/automation" style={{
            width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
            color: 'var(--color-text-secondary)', textDecoration: 'none',
          }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              AI Content Generator
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
              Fill in what you want, or just hit Generate and let AI handle everything
            </p>
          </div>
        </div>

        {/* Main card */}
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
          borderRadius: '20px', overflow: 'hidden',
        }}>
          {/* Topic input */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-border-primary)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
              <Wand2 size={14} />
              Topic
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional — leave blank for AI to pick)</span>
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. How AI is transforming healthcare in 2026..."
              rows={2}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px', fontSize: '15px',
                border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)', resize: 'none', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.5,
              }}
            />
          </div>

          {/* Custom prompt */}
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--color-border-primary)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
              <AlignLeft size={14} />
              Custom Instructions
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="e.g. Focus on practical examples, include code snippets, target senior developers..."
              rows={2}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px', fontSize: '14px',
                border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)', resize: 'none', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.5,
              }}
            />
          </div>

          {/* Optional fields toggle */}
          <button onClick={() => setShowOptions(!showOptions)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
            padding: '16px 28px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: showOptions ? '1px solid var(--color-border-primary)' : 'none',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Advanced Options
            </span>
            {showOptions ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
          </button>

          {showOptions && (
            <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Tone */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                  Tone
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {TONES.map(t => (
                    <button key={t} onClick={() => setTone(t)} style={{
                      padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                      border: `1px solid ${tone === t ? 'var(--color-brand)' : 'var(--color-border-primary)'}`,
                      background: tone === t ? 'var(--color-brand-glow)' : 'var(--color-bg-primary)',
                      color: tone === t ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                  Length
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {LENGTHS.map(l => (
                    <button key={l.value} onClick={() => setLength(l.value)} style={{
                      flex: 1, padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                      border: `1px solid ${length === l.value ? 'var(--color-brand)' : 'var(--color-border-primary)'}`,
                      background: length === l.value ? 'var(--color-brand-glow)' : 'var(--color-bg-primary)',
                      color: length === l.value ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                    }}>
                      <span style={{ fontSize: '16px' }}>{l.icon}</span>
                      <div style={{ marginTop: '4px' }}>{l.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  <Tag size={12} /> Tags (comma-separated)
                </label>
                <input
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g. ai, web-dev, tutorial"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
                    border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)', outline: 'none',
                  }}
                />
              </div>

              {/* Cover Image */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    <ImageIcon size={12} /> Generate Cover Image
                  </label>
                  <button onClick={() => setGenerateImage(!generateImage)} style={{
                    width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                    background: generateImage ? '#22c55e' : 'var(--color-bg-tertiary)',
                    position: 'relative', transition: 'background 0.3s',
                  }}>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                      position: 'absolute', top: '3px',
                      left: generateImage ? '21px' : '3px',
                      transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
                {generateImage && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {IMAGE_STYLES.map(s => (
                      <button key={s} onClick={() => setImageStyle(s)} style={{
                        padding: '5px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 600,
                        border: `1px solid ${imageStyle === s ? '#8b5cf6' : 'var(--color-border-primary)'}`,
                        background: imageStyle === s ? 'rgba(139,92,246,0.1)' : 'var(--color-bg-primary)',
                        color: imageStyle === s ? '#8b5cf6' : 'var(--color-text-muted)',
                        cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s',
                      }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generate button */}
          <div style={{ padding: '20px 28px' }}>
            <button onClick={handleGenerate} disabled={generating} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '16px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white',
              fontSize: '16px', fontWeight: 700,
              boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
              transition: 'all 0.2s',
            }}>
              <Sparkles size={20} />
              {topic ? 'Generate Blog Post' : 'Let AI Pick & Generate'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GENERATING STEP
  if (step === 'generating') {
    const stages = [
      { key: 'topic', label: 'Picking trending topic...', icon: '🎯' },
      { key: 'content', label: 'Writing blog post with AI...', icon: '✍️' },
      { key: 'image', label: 'Generating cover image...', icon: '🖼️' },
      { key: 'done', label: 'Complete!', icon: '✅' },
    ];

    const stageOrder = ['topic', 'content', 'image', 'done'];
    const currentIdx = stageOrder.indexOf(genStage);

    return (
      <div className="max-w-lg mx-auto animate-fade-in" style={{ paddingTop: '60px' }}>
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
          borderRadius: '20px', padding: '40px', textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 2s infinite',
          }}>
            <Sparkles size={32} color="white" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '32px' }}>
            Generating Your Post
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {stages.map((s, i) => {
              const idx = stageOrder.indexOf(s.key);
              const isActive = idx === currentIdx;
              const isDone = idx < currentIdx;
              const isPending = idx > currentIdx;

              // Skip topic stage if user provided a topic
              if (s.key === 'topic' && topic) return null;
              // Skip image stage if user disabled it
              if (s.key === 'image' && !generateImage) return null;

              return (
                <div key={s.key} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 18px', borderRadius: '12px',
                  background: isActive ? 'var(--color-brand-glow)' : 'var(--color-bg-primary)',
                  border: isActive ? '1px solid var(--color-brand)' : '1px solid transparent',
                  opacity: isPending ? 0.4 : 1, transition: 'all 0.5s',
                }}>
                  <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>
                    {isDone ? '✅' : isActive ? s.icon : '⏳'}
                  </span>
                  <span style={{
                    fontSize: '14px', fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                  }}>
                    {s.label}
                  </span>
                  {isActive && <Loader2 size={16} className="animate-spin" style={{ marginLeft: 'auto', color: 'var(--color-brand)' }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW STEP
  if (step === 'preview' && generated) {
    if (published) {
      return (
        <div className="max-w-lg mx-auto animate-fade-in" style={{ paddingTop: '60px' }}>
          <div style={{
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
            borderRadius: '20px', padding: '40px', textAlign: 'center',
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Check size={36} style={{ color: '#22c55e' }} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              {published.status === 'published' ? 'Published!' : 'Saved as Draft!'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              "{published.title}" has been {published.status === 'published' ? 'published' : 'saved as a draft'}.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Link href={`/${published.slug}`} style={{
                padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                background: 'var(--color-brand)', color: 'white', textDecoration: 'none',
              }}>
                View Post
              </Link>
              <button onClick={handleRegenerate} style={{
                padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-card)',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
              }}>
                Generate Another
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleRegenerate} style={{
              width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border-primary)',
              background: 'var(--color-bg-card)', cursor: 'pointer', color: 'var(--color-text-secondary)',
            }}>
              <ArrowLeft size={16} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Preview Generated Post
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleRegenerate} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-card)',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
            }}>
              <RefreshCw size={14} /> Re-generate
            </button>
            <button onClick={() => handlePublish('draft')} disabled={publishing} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-card)',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
            }}>
              <Save size={14} /> Save Draft
            </button>
            <button onClick={() => handlePublish('published')} disabled={publishing} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
              border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white', cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(34,197,94,0.3)',
            }}>
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Publish Now
            </button>
          </div>
        </div>

        {/* AI Reasoning */}
        {generated.topicReasoning && (
          <div style={{
            padding: '14px 18px', borderRadius: '12px', marginBottom: '16px',
            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{ fontSize: '16px' }}>🧠</span>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>AI Topic Selection</span>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                Topic: "{generated.topic}" — {generated.topicReasoning}
              </p>
            </div>
          </div>
        )}

        {/* Preview card */}
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          {/* Cover image */}
          {generated.coverImage && (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '21/9', overflow: 'hidden' }}>
              <img src={generated.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', bottom: '12px', right: '12px',
                padding: '4px 10px', borderRadius: '6px',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                fontSize: '11px', fontWeight: 600, color: 'white',
              }}>
                🖼️ AI-Generated • {generated.imageStyle} style
              </div>
            </div>
          )}

          <div style={{ padding: '32px 36px' }} ref={previewRef}>
            {/* Tags */}
            {generated.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {generated.tags.map((tag, i) => (
                  <span key={i} style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                    background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)',
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.3, marginBottom: '12px', letterSpacing: '-0.02em' }}>
              {generated.title}
            </h1>

            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '28px', fontStyle: 'italic' }}>
              {generated.excerpt}
            </p>

            <div style={{ borderTop: '1px solid var(--color-border-primary)', paddingTop: '24px' }}>
              <div
                className="prose-content"
                dangerouslySetInnerHTML={{ __html: generated.content }}
                style={{
                  fontSize: '15px', lineHeight: 1.8, color: 'var(--color-text-secondary)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

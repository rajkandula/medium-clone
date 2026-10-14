'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Star, MessageSquare, ArrowLeft, Send, Sparkles, AlertCircle, Heart, User, Mail, ShieldAlert } from 'lucide-react';

export default function PublicFeedbackPage() {
  const { user } = useAuth();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('general');
  const [sentiment, setSentiment] = useState('neutral');
  const [text, setText] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRatingClick = (val) => {
    setRating(val);
    // Auto adjust sentiment based on rating
    if (val >= 4) setSentiment('happy');
    else if (val <= 2) setSentiment('sad');
    else setSentiment('neutral');
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg('Please select a star rating first.');
      return;
    }
    if (!text.trim()) {
      setErrorMsg('Please write your feedback comments.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, rating, text, name, email, sentiment }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(data.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="max-w-md w-full p-8 rounded-2xl text-center space-y-6 animate-scale-up"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-[rgba(34,197,94,0.1)] border border-[#22c55e]">
            <Sparkles size={28} className="text-green-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Feedback Submitted!</h1>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Thank you for sharing your thoughts. Your rating and remarks have been forwarded directly to our product administrators to help shape BlogWrite.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/" className="inline-block w-full py-2.5 rounded-lg text-xs font-semibold text-white gradient-brand text-center shadow-lg transition-transform hover:scale-[1.01]">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Back button */}
      <Link href="/" className="mb-6 flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
        <ArrowLeft size={12} /> Back to Homepage
      </Link>

      <div className="max-w-lg w-full rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        
        {/* Decorative ambient background glows */}
        <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-[80px]" style={{ background: 'var(--color-brand)' }}></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full blur-[80px]" style={{ background: 'var(--color-brand)' }}></div>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center gradient-brand"><MessageSquare size={20} className="text-white" /></div>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>Send Platform Feedback</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Encountered a bug, have billing questions, or want to suggest a new feature? We read every response.</p>
        </div>

        <form onSubmit={handleFeedbackSubmit} className="space-y-4 relative">
          {errorMsg && (
            <div className="p-3 rounded-lg text-xs font-medium flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)' }}>
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          {/* User Details (if Guest) */}
          {!user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Your Name</label>
                <div className="relative">
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none"
                    style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                    placeholder="E.g. John Doe" />
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Your Email</label>
                <div className="relative">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none"
                    style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                    placeholder="E.g. john@example.com" />
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </div>
          )}

          {/* Category selection */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Feedback Category</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 'general', label: 'General' },
                { val: 'bug', label: 'Bugs' },
                { val: 'billing', label: 'Billing' },
                { val: 'feature', label: 'Features' }
              ].map(c => {
                const isSelected = category === c.val;
                return (
                  <button key={c.val} type="button" onClick={() => setCategory(c.val)}
                    className="py-2.5 rounded-lg text-[10px] font-bold text-center border transition-all"
                    style={{
                      background: isSelected ? 'var(--color-brand-glow)' : 'var(--color-bg-input)',
                      borderColor: isSelected ? 'var(--color-brand)' : 'var(--color-border-primary)',
                      color: isSelected ? 'var(--color-brand)' : 'var(--color-text-secondary)'
                    }}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Star rating selector */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--color-text-tertiary)' }}>Star Rating</label>
            <div className="flex items-center gap-1.5 p-3 rounded-lg justify-center" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)' }}>
              {[1, 2, 3, 4, 5].map((val) => {
                const isFilled = val <= (hoverRating || rating);
                return (
                  <button key={val} type="button"
                    onClick={() => handleRatingClick(val)}
                    onMouseEnter={() => setHoverRating(val)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform duration-100 hover:scale-125 focus:outline-none">
                    <Star size={24} fill={isFilled ? '#f59e0b' : 'none'} stroke={isFilled ? '#f59e0b' : 'var(--color-text-muted)'} className="stroke-[2px]" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sentiment indicator */}
          {rating > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--color-text-tertiary)' }}>Simulated Sentiment Analysis</label>
              <div className="flex gap-2 justify-center">
                {[
                  { val: 'happy', label: 'Happy 😊' },
                  { val: 'neutral', label: 'Neutral 😐' },
                  { val: 'sad', label: 'Sad 😢' }
                ].map(s => {
                  const isSelected = sentiment === s.val;
                  return (
                    <button key={s.val} type="button" onClick={() => setSentiment(s.val)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                      style={{
                        background: isSelected ? 'var(--color-bg-tertiary)' : 'transparent',
                        borderColor: isSelected ? 'var(--color-brand)' : 'var(--color-border-primary)',
                        color: isSelected ? 'var(--color-brand)' : 'var(--color-text-muted)'
                      }}>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Text comments */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Comments & Remarks</label>
            <textarea value={text} onChange={e => setText(e.target.value)} required rows={4} maxLength={1000}
              className="w-full px-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none leading-relaxed"
              style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
              placeholder="What can we improve? Please be as descriptive as possible..." />
            <div className="text-[10px] text-right" style={{ color: 'var(--color-text-muted)' }}>
              {text.length}/1000 characters
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isSubmitting}
            className="w-full py-3.5 rounded-lg text-xs font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-70 gradient-brand">
            {isSubmitting ? 'Sending Feedbacks...' : <><Send size={12} /> Submit Feedback</>}
          </button>
        </form>
      </div>
    </div>
  );
}

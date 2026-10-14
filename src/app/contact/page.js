'use client';

import { useState } from 'react';
import PublicLayout from '@/components/shared/PublicLayout';
import { Mail, Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: form.name,
          senderEmail: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setError(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <PublicLayout>
      <div className="py-20 px-6 max-w-lg mx-auto">
        <div className="text-center mb-12">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 bg-amber-50">
            <Mail size={20} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-black mb-3 tracking-tight text-gray-900">
            Get in Touch
          </h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Have questions about BlogWrite, Claude connectors, billing, or enterprise options? 
            Drop us a message and we'll get back to you shortly.
          </p>
        </div>

        {success ? (
          <div className="p-8 rounded-2xl border border-emerald-100 bg-emerald-50/50 text-center animate-fade-in">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Message Sent!</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Thank you for contacting BlogWrite. Our support administration team has been notified and will review your inquiry shortly.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand hover:opacity-90 transition-opacity"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-7 rounded-3xl border border-gray-100 bg-white shadow-sm space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl text-xs flex items-center gap-2 border border-red-100 bg-red-50/50 text-red-500">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Your Name *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Your Email *
              </label>
              <input
                type="email"
                required
                maxLength={200}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Subject
              </label>
              <input
                type="text"
                maxLength={200}
                placeholder="What's this about?"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Message *
              </label>
              <textarea
                required
                rows={5}
                maxLength={5000}
                placeholder="Write your message here..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-gray-900 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white gradient-brand hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}

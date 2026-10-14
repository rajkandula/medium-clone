'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { HelpCircle, ChevronDown, ChevronUp, Search, Mail, Send, CheckCircle2, User, Info, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function HelpPage() {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const faqs = [
    {
      q: 'What is the difference between Free and Writer Plans?',
      a: 'The Free Tier allows you to create up to 3 blog posts with 50MB of storage. The Writer Pro Plan ($1/mo) unlocks unlimited blog posts, 5GB of storage, 500 monthly AI Copilot calls, profile customizations, and in-depth readers/article views analytics.'
    },
    {
      q: 'How do I upgrade to the Writer Plan?',
      a: 'Navigate to your Dashboard menu, select Billing, click "Upgrade to Writer Pro" and follow the payment simulator instructions. It takes less than 30 seconds!'
    },
    {
      q: 'Is my billing payment details secure?',
      a: 'Yes, absolutely! We do not store credit card credentials on our servers. All transactions are securely processed and simulated via Stripe Checkout encryption.'
    },
    {
      q: 'Can I cancel my active subscription at any time?',
      a: 'Yes! You can manage or cancel your Writer plan directly in the Billing dashboard at any time. Your benefits will remain active until the end of your billing cycle.'
    },
    {
      q: 'How does the AI Writing Copilot work?',
      a: 'Our AI Writing Copilot runs on open-source large language models. It helps you outline paragraphs, rephrase copy, generate titles, and improve spelling right within the blog content editor!'
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please enter a message first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName: name, senderEmail: email, subject, message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setSubject('');
        setMessage('');
      } else {
        setErrorMsg(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-start items-center px-4 py-12" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Header section */}
      <div className="max-w-4xl w-full text-center space-y-4 mb-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={12} /> Back to Homepage
        </Link>
        <h1 className="text-3xl font-extrabold flex items-center justify-center gap-2 mt-2" style={{ color: 'var(--color-text-primary)' }}>
          <HelpCircle size={28} style={{ color: 'var(--color-brand)' }} /> Help & Support Center
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
          Need assistance with BlogWrite? Search our frequently asked questions or submit a direct inquiry to the administrative support team.
        </p>

        {/* Search FAQ */}
        <div className="max-w-md mx-auto relative pt-4">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium focus:outline-none focus-ring shadow-md"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
            placeholder="Search help topics, FAQs, tutorials..." />
          <Search size={14} className="absolute left-3.5 bottom-3.5" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* FAQs accordion */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold flex items-center gap-2 mb-4" style={{ color: 'var(--color-text-primary)' }}>
            <Info size={16} style={{ color: 'var(--color-brand)' }} /> Frequently Asked Questions
          </h2>
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-xs" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-muted)' }}>
              No matches found for your search query.
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="rounded-xl overflow-hidden transition-all duration-300"
                  style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
                  <button onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 flex items-center justify-between text-left focus:outline-none hover:bg-[var(--color-bg-hover)] transition-colors">
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{faq.q}</span>
                    {isOpen ? <ChevronUp size={14} style={{ color: 'var(--color-brand)' }} /> : <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs leading-relaxed transition-all" style={{ color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-bg-input)' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact Ticket Form */}
        <div className="rounded-xl p-6 sm:p-8 space-y-6 shadow-xl"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Mail size={16} style={{ color: 'var(--color-brand)' }} /> Open Support Ticket
          </h2>

          {isSuccess ? (
            <div className="p-5 text-center space-y-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)' }}>
              <CheckCircle2 size={24} style={{ color: '#22c55e' }} className="mx-auto animate-bounce-slow" />
              <div>
                <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Inquiry Dispatched!</h4>
                <p className="text-[10px] leading-relaxed mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Your support message was routed successfully. An administrator will review your query and reply shortly.
                </p>
              </div>
              <button onClick={() => setIsSuccess(false)} className="px-4 py-2 rounded-lg text-[10px] font-bold text-white gradient-brand shadow-md">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/20">
                  {errorMsg}
                </div>
              )}

              {/* Guest Details */}
              {!user && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Your Name</label>
                    <div className="relative">
                      <input type="text" value={name} onChange={e => setName(e.target.value)} required
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none"
                        style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                        placeholder="John Doe" />
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Your Email</label>
                    <div className="relative">
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none"
                        style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                        placeholder="john@example.com" />
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Subject / Topic</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none"
                  style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                  placeholder="E.g. Billing inquiry, Account issues..." />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Detailed Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} maxLength={5000}
                  className="w-full px-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none leading-relaxed"
                  style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                  placeholder="Describe your request in detail..." />
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-lg text-xs font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-70 gradient-brand">
                {isSubmitting ? 'Dispatching ticket...' : <><Send size={12} /> Submit Support Inquiry</>}
              </button>
            </form>
          )}

          {/* Secure Trust Badge */}
          <div className="p-4 flex items-center justify-center gap-1.5" style={{ borderTop: '1px solid var(--color-border-primary)', background: 'var(--color-bg-tertiary)' }}>
            <ShieldCheck size={14} style={{ color: '#22c55e' }} />
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Administrative direct message integration</span>
          </div>
        </div>
      </div>
    </div>
  );
}

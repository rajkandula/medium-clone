'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Loader2, Archive, CheckCheck, Inbox, ArrowLeft, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/contact/inbox?filter=${filter}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setUnreadCount(data.unread || 0);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMessages();
  }, [filter]);

  const handleAction = async (messageIds, action) => {
    try {
      await fetch('/api/contact/inbox', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds, action }),
      });
      fetchMessages();
    } catch (err) {
      console.error('Action error:', err);
    }
  };

  const handleMarkAllRead = () => handleAction([], 'read_all');

  const toggleExpand = (msg) => {
    if (expandedId === msg._id) {
      setExpandedId(null);
    } else {
      setExpandedId(msg._id);
      if (!msg.isRead) {
        handleAction([msg._id], 'read');
      }
    }
  };

  const filters = [
    { key: 'all', label: 'All Messages' },
    { key: 'unread', label: 'Unread' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Messages</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Messages from your profile contact form
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead}
            className="text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-[var(--color-bg-hover)]"
            style={{ color: 'var(--color-brand)' }}>
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--color-bg-tertiary)' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5"
            style={{
              background: filter === f.key ? 'var(--color-bg-card)' : 'transparent',
              color: filter === f.key ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              boxShadow: filter === f.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            {f.label}
            {f.key === 'unread' && unreadCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--color-brand)' }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-2">
          {messages.map(msg => {
            const isExpanded = expandedId === msg._id;
            return (
              <div key={msg._id}
                className="rounded-xl border transition-all overflow-hidden"
                style={{
                  background: msg.isRead ? 'var(--color-bg-card)' : 'var(--color-brand-glow)',
                  borderColor: 'var(--color-border-primary)',
                }}>
                {/* Message Header — clickable to expand */}
                <button onClick={() => toggleExpand(msg)}
                  className="w-full flex items-start gap-3 p-4 text-left transition-all hover:bg-[var(--color-bg-hover)]">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                    {msg.senderName?.[0]?.toUpperCase() || '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-[14px] truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {msg.senderName}
                      </span>
                      {!msg.isRead && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-brand)' }} />
                      )}
                    </div>
                    <p className="text-[12px] mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      {msg.senderEmail}
                    </p>
                    {msg.subject && (
                      <p className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {msg.subject}
                      </p>
                    )}
                    {!isExpanded && (
                      <p className="text-[13px] truncate mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                        {msg.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                      <Clock size={10} />
                      {timeAgo(msg.createdAt)}
                    </span>
                    {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />}
                  </div>
                </button>

                {/* Expanded message body */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
                    <div className="pt-4 pb-3">
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                        {msg.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
                      <a href={`mailto:${msg.senderEmail}?subject=Re: ${msg.subject || 'Your message on BlogWrite'}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all text-white"
                        style={{ background: 'var(--color-brand)' }}>
                        <Mail size={12} />
                        Reply via Email
                      </a>
                      {!msg.isArchived && (
                        <button onClick={(e) => { e.stopPropagation(); handleAction([msg._id], 'archive'); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                          style={{ color: 'var(--color-text-tertiary)', background: 'var(--color-bg-tertiary)' }}>
                          <Archive size={12} />
                          Archive
                        </button>
                      )}
                      {msg.isArchived && (
                        <button onClick={(e) => { e.stopPropagation(); handleAction([msg._id], 'unarchive'); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                          style={{ color: 'var(--color-text-tertiary)', background: 'var(--color-bg-tertiary)' }}>
                          <Inbox size={12} />
                          Unarchive
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--color-bg-tertiary)' }}>
            <Mail size={28} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {filter === 'archived' ? 'No archived messages' : filter === 'unread' ? 'All caught up!' : 'No messages yet'}
          </h3>
          <p className="text-[14px] max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
            {filter === 'unread'
              ? "You've read all your messages."
              : 'When someone contacts you through your profile, their messages will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
}

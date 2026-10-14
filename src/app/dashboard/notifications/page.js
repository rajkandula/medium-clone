'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Heart, MessageCircle, UserPlus, Award, AtSign, Loader2, Mail, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/lib/utils';

const ICON_MAP = {
  like: { icon: Heart, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  comment: { icon: MessageCircle, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  follow: { icon: UserPlus, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  mention: { icon: AtSign, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  achievement: { icon: Award, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  contact_message: { icon: Mail, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  new_post: { icon: FileText, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Try fetching real notifications, fall back to empty
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
  ];

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PUT' });
      if (!res.ok) throw new Error('Failed');
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
      // Dispatch event so sidebar badge updates too
      window.dispatchEvent(new CustomEvent('notifications-read'));
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed');
      setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
      window.dispatchEvent(new CustomEvent('notifications-read'));
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const handleRowClick = async (e, notif) => {
    if (e.target.closest('a') || e.target.closest('button')) {
      if (!notif.isRead) {
        markAsRead(notif._id);
      }
      return;
    }

    if (!notif.isRead) {
      await markAsRead(notif._id);
    }

    if (notif.type === 'follow' && notif.actor?.username) {
      router.push(`/profile/${notif.actor.username}`);
    } else if (notif.post?.slug) {
      router.push(`/blog/${notif.post.slug}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead}
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
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all"
            style={{
              background: filter === f.key ? 'var(--color-bg-card)' : 'transparent',
              color: filter === f.key ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              boxShadow: filter === f.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-1">
          {filteredNotifications.map((notif, i) => {
            const config = ICON_MAP[notif.type] || ICON_MAP.mention;
            const Icon = config.icon;
            const isContact = notif.type === 'contact_message' && notif.contactMessage;
            
            const renderNotificationText = () => {
              if (isContact) return 'contacted you';
              if (notif.message) return notif.message;

              const postLink = notif.post?.slug ? (
                <Link href={`/blog/${notif.post.slug}`} className="font-semibold hover:underline" style={{ color: 'var(--color-brand)' }}>
                  "{notif.post.title}"
                </Link>
              ) : null;

              switch (notif.type) {
                case 'like':
                  return <span>liked your post {postLink || 'your post'}</span>;
                case 'comment':
                  return <span>commented on your post {postLink || 'your post'}</span>;
                case 'follow':
                  return 'started following you';
                case 'mention':
                  return <span>mentioned you in {postLink || 'a post'}</span>;
                case 'new_post':
                  return <span>published a new post {postLink}</span>;
                default:
                  return 'interacted with your post';
              }
            };

            return (
              <div key={notif._id || i}
                onClick={(e) => handleRowClick(e, notif)}
                className={`flex items-start gap-3 p-4 rounded-xl transition-all hover:bg-[var(--color-bg-hover)] ${(notif.type === 'follow' || notif.post?.slug) ? 'cursor-pointer' : ''}`}
                style={{
                  background: notif.isRead ? 'transparent' : 'var(--color-brand-glow)',
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: config.bg }}>
                  <Icon size={16} style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                    {isContact ? (
                      <span className="font-semibold">{notif.contactMessage.senderName}</span>
                    ) : notif.actor?.username ? (
                      <Link href={`/profile/${notif.actor.username}`} className="font-semibold hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                        {notif.actor.name}
                      </Link>
                    ) : (
                      <span className="font-semibold">{notif.actor?.name || 'Someone'}</span>
                    )}{' '}
                    <span style={{ color: 'var(--color-text-secondary)' }}>{renderNotificationText()}</span>
                  </p>
                  {isContact && (
                    <div className="mt-2 p-3 rounded-lg space-y-1.5" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)' }}>
                      <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                        <Mail size={11} />
                        <span>{notif.contactMessage.senderEmail}</span>
                      </div>
                      {notif.contactMessage.subject && (
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {notif.contactMessage.subject}
                        </p>
                      )}
                      <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-text-secondary)' }}>
                        {notif.contactMessage.message}
                      </p>
                    </div>
                  )}
                  <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: 'var(--color-brand)' }} />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--color-bg-tertiary)' }}>
            <Bell size={28} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </h3>
          <p className="text-[14px] max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
            {filter === 'unread'
              ? 'You\'ve read all your notifications.'
              : 'When someone likes, comments, or follows you, you\'ll see it here.'}
          </p>
          <Link href="/explore"
            className="inline-block mt-6 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:shadow-md"
            style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg-primary)' }}>
            Discover stories
          </Link>
        </div>
      )}
    </div>
  );
}

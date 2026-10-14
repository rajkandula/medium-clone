'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  Home, Library, FileText, BarChart3, 
  LogOut, Search, SquarePen, Bell, Plus, Moon, Sun, Settings, User,
  ChevronLeft, ChevronRight, Menu, X, Heart, MessageCircle, UserPlus, ArrowRight, CreditCard,
  HelpCircle, MessageSquare, MoreHorizontal, Palette, Zap, Mail, Rocket, ChevronDown, BookOpen,
  Shield, Key, GraduationCap
} from 'lucide-react';
import Feather from '@/components/shared/FeatherIcon';
import { timeAgo } from '@/lib/utils';

const sidebarNav = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/product-launch', icon: Rocket, label: 'Startup Concepts' },
  { href: '/dashboard/research', icon: BookOpen, label: 'Research Paper' },
  { href: '/pulse', icon: Zap, label: 'Pulse' },
  { href: '/dashboard/explore', icon: Search, label: 'Explore' },
  { href: '/learn', icon: GraduationCap, label: 'Learn' },
  { href: '/dashboard/notifications', icon: Heart, label: 'Notifications' },
];

const contentSubNav = [
  { href: '/dashboard/posts', icon: FileText, label: 'My Posts' },
  { href: '/dashboard/bookmarks', icon: Library, label: 'Saved Posts' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'My Stats' },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [contentMenuOpen, setContentMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const moreMenuRef = useRef(null);

  // Fetch notifications
  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(d => {
      setNotifications(d.notifications || []);
    }).catch(() => {});

    // Listen for mark-all-read from notifications page
    const onRead = () => setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    window.addEventListener('notifications-read', onRead);
    return () => window.removeEventListener('notifications-read', onRead);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setMoreMenuOpen(false);
    };
    if (notifOpen || moreMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen, moreMenuOpen]);

  const NOTIF_ICONS = {
    like: { icon: Heart, color: '#ef4444' },
    comment: { icon: MessageCircle, color: '#3b82f6' },
    follow: { icon: UserPlus, color: '#8b5cf6' },
    contact_message: { icon: Mail, color: '#06b6d4' },
    new_post: { icon: FileText, color: '#22c55e' },
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Mobile header - minimal */}
      <header className="sticky top-0 z-50 md:hidden" style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border-primary)' }}>
        <div className="px-4 h-[52px] flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl transition-all hover:bg-[var(--color-bg-hover)]"
            style={{ color: 'var(--color-text-secondary)' }}>
            <Menu size={20} />
          </button>
          <Link href="/">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
              <Feather size={14} className="text-white" />
            </div>
          </Link>
          <div className="w-9" />
        </div>
      </header>

      <div className="w-full flex">
        {/* Left Sidebar - Desktop */}
        <aside
          className="hidden md:flex flex-col shrink-0 sticky top-0 h-screen py-6 px-3"
          style={{
            width: sidebarOpen ? 260 : 72,
            transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            borderRight: '1px solid var(--color-border-primary)',
            overflow: 'hidden',
          }}
        >
          {/* Logo — aligns with nav icons */}
          <Link href="/" className="flex items-center overflow-hidden whitespace-nowrap mb-6"
            style={{
              gap: sidebarOpen ? 12 : 0,
              padding: sidebarOpen ? '8px 12px' : '8px 0',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              borderRadius: 14,
              transition: 'padding 0.25s, gap 0.25s',
              textDecoration: 'none',
            }}>
            <img 
              src="/favicon.png" 
              alt="BlogWrite Logo" 
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                objectFit: 'cover'
              }} 
            />
            <span style={{
              fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em',
              opacity: sidebarOpen ? 1 : 0,
              width: sidebarOpen ? 'auto' : 0,
              overflow: 'hidden',
              transition: 'opacity 0.2s, width 0.2s',
              color: 'var(--color-text-primary)',
            }}>
              Blog<span style={{ color: '#f59e0b' }}>Write</span>
            </span>
          </Link>

          <nav className="flex flex-col gap-1">
            {sidebarNav.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  title={!sidebarOpen ? item.label : undefined}
                  className="flex items-center rounded-xl transition-all group overflow-hidden whitespace-nowrap"
                  style={{
                    gap: sidebarOpen ? 16 : 0,
                    padding: sidebarOpen ? '14px 16px' : '14px 0',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    background: isActive ? 'var(--color-bg-hover)' : 'transparent',
                  }}>
                  <div className="relative shrink-0">
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 1.8} className="transition-transform group-hover:scale-110" />
                    {item.label === 'Notifications' && notifications.some(n => !n.isRead) && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-[8px] font-bold text-white flex items-center justify-center" style={{ background: '#ef4444' }}>
                        {notifications.filter(n => !n.isRead).length || ''}
                      </span>
                    )}
                  </div>
                  <span className="transition-all" style={{
                    fontSize: 16,
                    fontWeight: isActive ? 700 : 400,
                    opacity: sidebarOpen ? 1 : 0,
                    width: sidebarOpen ? 'auto' : 0,
                    overflow: 'hidden',
                    transition: 'opacity 0.2s, width 0.2s',
                  }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* My Content Dropdown */}
            <div>
              <button onClick={() => setContentMenuOpen(!contentMenuOpen)}
                title={!sidebarOpen ? 'My Content' : undefined}
                className="flex items-center w-full rounded-xl transition-all group overflow-hidden whitespace-nowrap"
                style={{
                  gap: sidebarOpen ? 16 : 0,
                  padding: sidebarOpen ? '14px 16px' : '14px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  color: contentSubNav.some(s => pathname === s.href || pathname.startsWith(s.href)) ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  background: contentSubNav.some(s => pathname === s.href || pathname.startsWith(s.href)) ? 'var(--color-bg-hover)' : 'transparent',
                }}>
                <div className="relative shrink-0">
                  <FileText size={24} strokeWidth={contentSubNav.some(s => pathname === s.href || pathname.startsWith(s.href)) ? 2.5 : 1.8} className="transition-transform group-hover:scale-110" />
                </div>
                <span className="transition-all text-left" style={{
                  flex: sidebarOpen ? 1 : 0,
                  fontSize: 16,
                  fontWeight: contentSubNav.some(s => pathname === s.href || pathname.startsWith(s.href)) ? 700 : 400,
                  opacity: sidebarOpen ? 1 : 0,
                  width: sidebarOpen ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'opacity 0.2s, width 0.2s',
                }}>
                  My Content
                </span>
                {sidebarOpen && (
                  <ChevronDown size={16} className="shrink-0 transition-transform" style={{
                    transform: contentMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
                    color: 'var(--color-text-muted)',
                  }} />
                )}
              </button>

              {/* Sub-items — only when sidebar is open and expanded */}
              {contentMenuOpen && sidebarOpen && (
                <div className="flex flex-col gap-0.5" style={{ marginLeft: 20, marginTop: 2 }}>
                  {contentSubNav.map(item => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href);
                    return (
                      <Link key={item.href} href={item.href}
                        title={!sidebarOpen ? item.label : undefined}
                        className="flex items-center rounded-xl transition-all group overflow-hidden whitespace-nowrap"
                        style={{
                          gap: sidebarOpen ? 12 : 0,
                          padding: sidebarOpen ? '10px 14px' : '12px 0',
                          justifyContent: sidebarOpen ? 'flex-start' : 'center',
                          color: isActive ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
                          background: isActive ? 'var(--color-brand-glow)' : 'transparent',
                          fontSize: 14,
                        }}>
                        <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.6} className="shrink-0 transition-transform group-hover:scale-110" />
                        <span style={{
                          fontWeight: isActive ? 600 : 400,
                          opacity: sidebarOpen ? 1 : 0,
                          width: sidebarOpen ? 'auto' : 0,
                          overflow: 'hidden',
                          transition: 'opacity 0.2s, width 0.2s',
                        }}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>



            {/* Create */}
            <Link href="/dashboard/posts/new"
              title={!sidebarOpen ? 'Create' : undefined}
              className="flex items-center rounded-xl transition-all group overflow-hidden whitespace-nowrap"
              style={{
                gap: sidebarOpen ? 16 : 0,
                padding: sidebarOpen ? '14px 16px' : '14px 0',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: 'var(--color-text-secondary)',
              }}>
              <div className="relative shrink-0">
                <Plus size={24} strokeWidth={1.8} className="transition-transform group-hover:scale-110" />
              </div>
              <span className="transition-all" style={{
                fontSize: 16,
                fontWeight: 400,
                opacity: sidebarOpen ? 1 : 0,
                width: sidebarOpen ? 'auto' : 0,
                overflow: 'hidden',
                transition: 'opacity 0.2s, width 0.2s',
              }}>
                Create
              </span>
            </Link>

            {/* My Site with avatar */}
            <Link href={user?.username ? `/profile/${user.username}` : "/dashboard/profile"}
              title={!sidebarOpen ? 'My Site' : undefined}
              className="flex items-center rounded-xl transition-all group overflow-hidden whitespace-nowrap hover:bg-[var(--color-bg-hover)]"
              style={{
                gap: sidebarOpen ? 16 : 0,
                padding: sidebarOpen ? '12px 16px' : '12px 0',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: 'var(--color-text-secondary)',
              }}>
              <div className="relative shrink-0 flex items-center justify-center w-6 h-6">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[var(--color-text-muted)] transition-all" />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                    {user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <span className="transition-all" style={{
                fontSize: 16,
                fontWeight: 400,
                opacity: sidebarOpen ? 1 : 0,
                width: sidebarOpen ? 'auto' : 0,
                overflow: 'hidden',
                transition: 'opacity 0.2s, width 0.2s',
              }}>
                My Site
              </span>
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin"
                title={!sidebarOpen ? 'Admin Console' : undefined}
                className="flex items-center rounded-xl transition-all group overflow-hidden whitespace-nowrap"
                style={{
                  gap: sidebarOpen ? 16 : 0,
                  padding: sidebarOpen ? '14px 16px' : '14px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  color: 'var(--color-error)',
                  background: pathname.startsWith('/admin') ? 'var(--color-bg-hover)' : 'transparent',
                  border: '1px dashed rgba(239, 68, 68, 0.2)',
                  marginTop: '4px'
                }}>
                <div className="relative shrink-0 flex items-center justify-center w-6 h-6">
                  <Shield size={20} className="transition-transform group-hover:scale-110" style={{ color: 'var(--color-error)' }} />
                </div>
                <span className="transition-all" style={{
                  fontSize: 16,
                  fontWeight: 700,
                  opacity: sidebarOpen ? 1 : 0,
                  width: sidebarOpen ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'opacity 0.2s, width 0.2s',
                  color: 'var(--color-error)'
                }}>
                  Admin Console
                </span>
              </Link>
            )}
          </nav>

          {/* Bottom section with More menu & Collapse toggle */}
          <div className="mt-auto space-y-1">
            <div className="relative" ref={moreMenuRef}>
              <button onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                title={!sidebarOpen ? 'More' : undefined}
                className="flex items-center rounded-xl transition-all group overflow-hidden whitespace-nowrap hover:bg-[var(--color-bg-hover)] w-full"
                style={{
                  gap: sidebarOpen ? 16 : 0,
                  padding: sidebarOpen ? '14px 16px' : '14px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  color: moreMenuOpen ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                }}>
                <div className="relative shrink-0">
                  <MoreHorizontal size={24} strokeWidth={moreMenuOpen ? 2.5 : 1.8} className="transition-transform group-hover:scale-110" />
                </div>
                <span className="transition-all" style={{
                  fontSize: 16,
                  fontWeight: moreMenuOpen ? 700 : 400,
                  opacity: sidebarOpen ? 1 : 0,
                  width: sidebarOpen ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'opacity 0.2s, width 0.2s',
                }}>
                  More
                </span>
              </button>

              {/* More Menu Popover */}
              {moreMenuOpen && (
                <div 
                  className="absolute z-50 py-2 rounded-2xl shadow-xl border overflow-hidden animate-fade-in"
                  style={{ 
                    bottom: '100%', 
                    left: sidebarOpen ? '0' : '50%',
                    transform: sidebarOpen ? 'translateY(-8px)' : 'translateX(-50%) translateY(-8px)',
                    width: '240px',
                    background: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border-primary)',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
                  }}
                >
                  {user?.role === 'admin' && (
                    <>
                      <Link href="/admin" onClick={() => setMoreMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors"
                        style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>
                        <Shield size={20} strokeWidth={1.8} />
                        <span className="text-[15px]">Admin Console</span>
                      </Link>
                      <div className="h-px w-full my-1" style={{ background: 'var(--color-border-primary)' }} />
                    </>
                  )}
                  <Link href="/dashboard/settings" onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}>
                    <Settings size={20} strokeWidth={1.8} />
                    <span className="text-[15px]">Settings</span>
                  </Link>
                  <Link href="/dashboard/billing" onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}>
                    <CreditCard size={20} strokeWidth={1.8} />
                    <span className="text-[15px]">Billing</span>
                  </Link>
                  <Link href="/dashboard/support" onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}>
                    <HelpCircle size={20} strokeWidth={1.8} />
                    <span className="text-[15px]">Help & Support</span>
                  </Link>
                  <Link href="/dashboard/feedback" onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}>
                    <MessageSquare size={20} strokeWidth={1.8} />
                    <span className="text-[15px]">Send Feedback</span>
                  </Link>
                  
                  <div className="h-px w-full my-1" style={{ background: 'var(--color-border-primary)' }} />
                  
                  <button onClick={() => { logout(); setMoreMenuOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}>
                    <LogOut size={20} strokeWidth={1.8} />
                    <span className="text-[15px]">Sign out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Collapse toggle button */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
              className="flex items-center rounded-xl transition-all group overflow-hidden whitespace-nowrap hover:bg-[var(--color-bg-hover)] w-full"
              style={{
                gap: sidebarOpen ? 16 : 0,
                padding: sidebarOpen ? '14px 16px' : '14px 0',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: 'var(--color-text-secondary)',
              }}>
              <div className="relative shrink-0">
                {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
              </div>
              <span className="transition-all" style={{
                fontSize: 16,
                fontWeight: 400,
                opacity: sidebarOpen ? 1 : 0,
                width: sidebarOpen ? 'auto' : 0,
                overflow: 'hidden',
                transition: 'opacity 0.2s, width 0.2s',
              }}>
                Collapse
              </span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-[260px] py-6 px-4 flex flex-col"
            style={{ background: 'var(--color-bg-card)', boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center justify-between mb-6 px-2">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                  <Feather size={16} className="text-white" />
                </div>
                <span className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                  Blog<span style={{ color: '#f59e0b' }}>Write</span>
                </span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)]"
                style={{ color: 'var(--color-text-tertiary)' }}>
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-1">
              {sidebarNav.map(item => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] transition-all"
                    style={{
                      fontWeight: isActive ? '600' : '450',
                      color: isActive ? '#f59e0b' : 'var(--color-text-secondary)',
                      background: isActive ? 'var(--color-brand-glow)' : 'transparent',
                    }}>
                    <item.icon size={19} strokeWidth={isActive ? 2.2 : 1.6} />
                    {item.label}
                  </Link>
                );
              })}
              {user?.role === 'admin' && (
                <Link href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] transition-all"
                  style={{
                    fontWeight: '700',
                    color: 'var(--color-error)',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px dashed rgba(239, 68, 68, 0.2)',
                    marginTop: '8px'
                  }}>
                  <Shield size={19} style={{ color: 'var(--color-error)' }} />
                  Admin Console
                </Link>
              )}
            </nav>

            <div className="my-5 mx-3 h-px" style={{ background: 'var(--color-border-primary)' }} />

            <div className="px-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--color-text-muted)' }}>Following</p>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                Follow writers to see their stories here.
              </p>
              <Link href="/dashboard/explore" onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-1 text-[12px] font-semibold mt-2 hover:underline" style={{ color: 'var(--color-success)' }}>
                See suggestions
              </Link>
            </div>

            <div className="mt-auto pt-4">
              <button onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-[13px] transition-all hover:bg-[var(--color-bg-hover)]"
                style={{ color: 'var(--color-text-tertiary)' }}>
                <LogOut size={17} strokeWidth={1.5} /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-3 px-2"
        style={{ background: 'var(--color-bg-card)', borderTop: '1px solid var(--color-border-primary)' }}>
        {sidebarNav.slice(0, 4).map(item => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 p-1"
              style={{ color: isActive ? '#f59e0b' : 'var(--color-text-muted)' }}>
              <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link href="/dashboard/posts/new" className="flex flex-col items-center gap-1 p-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-text-primary)' }}>
            <Plus size={16} style={{ color: 'var(--color-bg-primary)' }} />
          </div>
        </Link>
      </nav>
    </div>
  );
}

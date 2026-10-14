'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Mail,
  MessageSquare,
  ArrowLeft,
  Bot,
  Sparkles
} from 'lucide-react';
import Feather from '@/components/shared/FeatherIcon';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/automation', icon: Bot, label: 'Automation' },
  { href: '/admin/automation/generate', icon: Sparkles, label: 'AI Generate' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/posts', icon: FileText, label: 'Posts' },
  { href: '/admin/billing', icon: DollarSign, label: 'Billing' },
  { href: '/admin/contacts', icon: Mail, label: 'Contacts' },
  { href: '/admin/feedback', icon: MessageSquare, label: 'Feedback' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--color-brand)' }}></div>
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Verifying credentials...</span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center p-8 rounded-xl max-w-sm" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
          <h1 className="text-2xl font-bold mb-2 animate-pulse" style={{ color: 'var(--color-error)' }}>Access Denied</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>You need administrator privileges to access this console.</p>
          <Link href="/dashboard" className="inline-block px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90" style={{ background: 'var(--color-brand)', color: 'white' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Sidebar Navigation */}
      <aside className="w-56 fixed top-0 left-0 h-full hidden md:flex flex-col"
        style={{ background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border-primary)' }}>
        <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <Feather size={14} className="text-white animate-bounce-slow" />
          </div>
          <div>
            <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Admin Suite</span>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>BlogWrite Platform</p>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group duration-200"
                style={{
                  background: isActive ? 'var(--color-brand-glow)' : 'transparent',
                  color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)'
                }}>
                <item.icon size={16} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'stroke-[2.5px]' : ''}`} /> 
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--color-bg-hover)]"
            style={{ color: 'var(--color-text-tertiary)' }}>
            <ArrowLeft size={16} /> User Panel
          </Link>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-56 p-6 min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
        {children}
      </main>
    </div>
  );
}

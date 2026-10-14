'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, ArrowRight } from 'lucide-react';
import Feather from './FeatherIcon';

export default function PublicLayout({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ 
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid #e8e8e8' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
              <Feather size={14} className="text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
              Blog<span style={{ color: '#f59e0b' }}>Write</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium transition-colors text-gray-500 hover:text-gray-900">Features</Link>
            <Link href="/#pricing" className="text-sm font-medium transition-colors text-gray-500 hover:text-gray-900">Pricing</Link>
            <Link href="/dashboard/explore" className="text-sm font-medium transition-colors text-gray-500 hover:text-gray-900">Explore</Link>
            <Link href="/learn" className="text-sm font-medium transition-colors text-gray-500 hover:text-gray-900">Learn</Link>
            <Link href="/about" className="text-sm font-medium transition-colors text-gray-500 hover:text-gray-900">About</Link>
            <Link href="/contact" className="text-sm font-medium transition-colors text-gray-500 hover:text-gray-900">Contact</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {authLoading ? (
              <div className="w-24 h-10" />
            ) : user ? (
              <Link href="/dashboard"
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white gradient-brand hover:opacity-90 transition-opacity">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login"
                  className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors hover:bg-gray-50 text-gray-900">
                  Sign in
                </Link>
                <Link href="/signup"
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#1a1a1a' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden animate-slide-down bg-white" style={{ borderTop: '1px solid #e8e8e8' }}>
            <div className="px-6 py-4 space-y-3">
              <Link href="/#features" className="block py-2 text-sm text-gray-500" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link href="/#pricing" className="block py-2 text-sm text-gray-500" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/dashboard/explore" className="block py-2 text-sm text-gray-500" onClick={() => setMobileMenuOpen(false)}>Explore</Link>
              <Link href="/learn" className="block py-2 text-sm text-gray-500" onClick={() => setMobileMenuOpen(false)}>Learn</Link>
              <Link href="/about" className="block py-2 text-sm text-gray-500" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link href="/contact" className="block py-2 text-sm text-gray-500" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              <div className="flex gap-3 pt-2">
                {authLoading ? (
                  <div className="w-full h-10 bg-gray-100 rounded-full animate-pulse" />
                ) : user ? (
                  <Link href="/dashboard" className="flex-1 text-center py-2.5 rounded-full text-sm font-semibold text-white gradient-brand" onClick={() => setMobileMenuOpen(false)}>Go to Dashboard</Link>
                ) : (
                  <>
                    <Link href="/login" className="flex-1 text-center py-2.5 rounded-full text-sm font-medium border border-gray-300 text-gray-900" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                    <Link href="/signup" className="flex-1 text-center py-2.5 rounded-full text-sm font-semibold text-white" style={{ background: '#1a1a1a' }} onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="flex-grow pt-24">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                  <Feather size={14} className="text-white" />
                </div>
                <span className="text-lg font-bold" style={{ color: '#1a1a1a' }}>
                  Blog<span style={{ color: '#f59e0b' }}>Write</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-gray-400">
                The modern platform for writers and readers.
              </p>
            </div>
            {[
              { title: 'Product', links: [{ label: 'Features', href: '/#features' }, { label: 'Pricing', href: '/#pricing' }, { label: 'Explore', href: '/dashboard/explore' }, { label: 'Learn', href: '/learn' }] },
              { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/dashboard/explore' }, { label: 'Contact', href: '/contact' }] },
              { title: 'Legal', links: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Cookies', href: '/cookies' }] },
            ].map((section) => (
              <div key={section.title}>
                <div className="text-sm font-semibold mb-4 text-gray-900">{section.title}</div>
                <ul className="space-y-2.5">
                  {section.links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm transition-colors text-gray-400 hover:text-gray-900">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-200">
            <span className="text-xs text-gray-400">
              © {new Date().getFullYear()} BlogWrite. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

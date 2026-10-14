'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatNumber } from '@/lib/utils';
import { 
  PenTool, Sparkles, TrendingUp, BookOpen, Zap, Users, 
  ArrowRight, Check, Copy, Star, Menu, X, ChevronRight,
  Brain, BarChart3, Globe, Shield, Palette, Rocket,
  MessageSquare, Search, FileText, BarChart2, Radio
} from 'lucide-react';
import { MCP_URL } from '@/lib/siteUrl';

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copiedMcpUrl, setCopiedMcpUrl] = useState(false);
  const [stats, setStats] = useState({ activeWriters: null, storiesPublished: null, monthlyReaders: null });

  const copyMcpUrl = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopiedMcpUrl(true);
    setTimeout(() => setCopiedMcpUrl(false), 2000);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch platform stats:', err);
      }
    }
    fetchStats();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
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
            <img src="/favicon.png" alt="BlogWrite" className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-sm" />
            <span className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
              Blog<span style={{ color: '#f59e0b' }}>Write</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium transition-colors hover:text-[#1a1a1a]" style={{ color: '#737373' }}>Features</a>
            <a href="#pricing" className="text-sm font-medium transition-colors hover:text-[#1a1a1a]" style={{ color: '#737373' }}>Pricing</a>
            <Link href="/dashboard/explore" className="text-sm font-medium transition-colors hover:text-[#1a1a1a]" style={{ color: '#737373' }}>Explore</Link>
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
                  className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors hover:bg-[#f5f5f5]"
                  style={{ color: '#1a1a1a' }}>
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

          <button className="md:hidden p-2 rounded-lg hover:bg-[#f5f5f5]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden animate-slide-down" style={{ background: '#fff', borderTop: '1px solid #e8e8e8' }}>
            <div className="px-6 py-4 space-y-3">
              <a href="#features" className="block py-2 text-sm" style={{ color: '#737373' }}>Features</a>
              <a href="#pricing" className="block py-2 text-sm" style={{ color: '#737373' }}>Pricing</a>
              <Link href="/dashboard/explore" className="block py-2 text-sm" style={{ color: '#737373' }}>Explore</Link>
              <div className="flex gap-3 pt-2">
                {authLoading ? (
                  <div className="w-full h-10 bg-gray-100 rounded-full animate-pulse" />
                ) : user ? (
                  <Link href="/dashboard" className="flex-1 text-center py-2.5 rounded-full text-sm font-semibold text-white gradient-brand">Go to Dashboard</Link>
                ) : (
                  <>
                    <Link href="/login" className="flex-1 text-center py-2.5 rounded-full text-sm font-medium" style={{ border: '1px solid #d4d4d4', color: '#1a1a1a' }}>Sign in</Link>
                    <Link href="/signup" className="flex-1 text-center py-2.5 rounded-full text-sm font-semibold text-white" style={{ background: '#1a1a1a' }}>Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden" style={{ background: '#ffffff' }}>
        {/* Subtle ambient gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight animate-slide-up" style={{ color: '#1a1a1a' }}>
            Where Ideas
            <br />
            <span style={{ color: '#f59e0b' }}>Come to Life</span>
          </h1>

          <p className="text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed animate-slide-up" style={{ color: '#6b7280', animationDelay: '0.1s' }}>
            The modern blogging platform that combines beautiful writing tools with the power of AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {authLoading ? (
              <div className="px-8 py-4 w-48 h-14 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <Link href="/dashboard"
                className="group px-8 py-4 rounded-full text-base font-semibold text-white transition-all hover:shadow-lg flex items-center gap-2 gradient-brand">
                Go to Dashboard
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link href="/signup"
                className="group px-8 py-4 rounded-full text-base font-semibold text-white transition-all hover:shadow-lg flex items-center gap-2"
                style={{ background: '#1a1a1a' }}>
                Start Writing — It's Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <Link href="/dashboard/explore"
              className="px-8 py-4 rounded-full text-base font-medium transition-all flex items-center gap-2 hover:bg-[#f9fafb]"
              style={{ border: '1px solid #d4d4d4', color: '#374151' }}>
              <BookOpen size={18} />
              Explore Stories
            </Link>
          </div>

          {/* Stats: live counts from /api/stats only, never placeholder numbers. Hidden until they load. */}
          {stats.activeWriters !== null && (
          <div className="flex flex-wrap justify-center gap-16 mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { value: formatNumber(stats.activeWriters), label: 'Writers' },
              { value: formatNumber(stats.storiesPublished), label: 'Stories Published' },
              { value: formatNumber(stats.monthlyReaders), label: 'Story Views' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold transition-all duration-300" style={{ color: '#1a1a1a' }}>{stat.value}</div>
                <div className="text-sm mt-1" style={{ color: '#9ca3af' }}>{stat.label}</div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto h-px" style={{ background: '#e5e7eb' }} />

      {/* Features Section */}
      <section id="features" className="py-24 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#f59e0b' }}>Features</span>
            <h2 className="text-3xl md:text-[42px] font-bold mt-3 mb-4 tracking-tight" style={{ color: '#1a1a1a' }}>
              Everything you need to write & grow
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: '#6b7280' }}>
              Powerful tools designed for writers who want to focus on creating great content.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: 'AI Writing Assistant', desc: 'Generate content, improve your writing, and get title suggestions powered by open-source AI models.', color: '#8b5cf6', bg: '#f5f3ff' },
              { icon: Palette, title: 'Rich Editor', desc: 'Beautiful TipTap editor with code blocks, images, embeds, and real-time preview.', color: '#ec4899', bg: '#fdf2f8' },
              { icon: TrendingUp, title: 'Smart Feed', desc: 'Personalized content discovery based on your interests, powered by our ranking algorithm.', color: '#f59e0b', bg: '#fffbeb' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track views, reads, engagement rates, and referral sources for every post.', color: '#10b981', bg: '#ecfdf5' },
              { icon: Globe, title: 'SEO Optimized', desc: 'Auto-generated meta tags, sitemaps, and structured data for maximum visibility.', color: '#3b82f6', bg: '#eff6ff' },
              { icon: Shield, title: 'Built for Scale', desc: 'MongoDB backend, S3-compatible object storage for media, and a standalone Node server you can run anywhere.', color: '#ef4444', bg: '#fef2f2' },
            ].map((feature) => (
              <div key={feature.title}
                className="group p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{ border: '1px solid #f3f4f6' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ background: feature.bg }}>
                  <feature.icon size={22} style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a1a1a' }}>{feature.title}</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: '#6b7280' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6" style={{ background: '#fafafa' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#f59e0b' }}>How It Works</span>
            <h2 className="text-3xl md:text-[42px] font-bold mt-3 tracking-tight" style={{ color: '#1a1a1a' }}>
              Start writing in 3 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Create Your Account', desc: 'Sign up in seconds with your email. Set your interests and customize your profile.' },
              { step: '02', title: 'Write & Publish', desc: 'Use our rich editor or AI assistant to craft your story. Publish with one click.' },
              { step: '03', title: 'Grow Your Audience', desc: 'Your content reaches readers through our smart feed algorithm and SEO optimization.' },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center group">
                <div className="text-7xl font-black mb-6 transition-colors group-hover:text-[#f59e0b]"
                  style={{ color: '#e5e7eb' }}>
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#1a1a1a' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{item.desc}</p>
                {i < 2 && (
                  <ChevronRight size={24} className="hidden md:block absolute top-10 -right-6" style={{ color: '#d1d5db' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Claude MCP Integration Section */}
      <section className="py-24 px-6" style={{ background: 'linear-gradient(180deg, #fafafa, #ffffff)', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#f59e0b' }}>AI Integration</span>
            <h2 className="text-3xl md:text-[42px] font-bold mt-3 mb-4 tracking-tight" style={{ color: '#1a1a1a' }}>
              Supercharge Claude with BlogWrite
            </h2>
            <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: '#6b7280' }}>
              Connect BlogWrite directly to Claude.ai or your Claude Desktop app using the Model Context Protocol (MCP) for a unified writing workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: What Claude Can Do */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6" style={{ color: '#1a1a1a' }}>
                Claude gains superpowers in your workspace
              </h3>
              
              <div className="space-y-4">
                {[
                  {
                    title: "Draft & Publish Posts",
                    desc: 'Prompt Claude to "outline an article about quantum computing", "write a draft", or "publish my story" with full write permissions.',
                    icon: FileText,
                    color: '#f59e0b',
                    bg: '#fffbeb',
                  },
                  {
                    title: "Moderate Comments",
                    desc: 'Read, reply to, or delete user feedback: "show me recent comments on my spintronics post".',
                    icon: MessageSquare,
                    color: '#3b82f6',
                    bg: '#eff6ff',
                  },
                  {
                    title: "Access the Research Desk",
                    desc: 'Let Claude browse curated academic research papers database to draft highly accurate copy.',
                    icon: Search,
                    color: '#10b981',
                    bg: '#ecfdf5',
                  },
                  {
                    title: "Pulse News & Tech Trends",
                    desc: 'Let Claude scan trending tech articles and Pulse insights: "what is currently trending in developer news?".',
                    icon: Radio,
                    color: '#a855f7',
                    bg: '#faf5ff',
                  },
                  {
                    title: "Startup Concepts",
                    desc: 'Explore AI-generated startup concepts, each with a full technical blueprint — architecture, stack, schema, and dev plan.',
                    icon: Rocket,
                    color: '#ef4444',
                    bg: '#fef2f2',
                  },
                  {
                    title: "Monitor Live Stats",
                    desc: 'Ask Claude for a quick summary of your views, reads, and engagement metrics inside your chat.',
                    icon: BarChart2,
                    color: '#06b6d4',
                    bg: '#f0fdfa',
                  }
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4 p-4.5 rounded-2xl bg-white border border-[#f3f4f6] transition-shadow hover:shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: item.bg, color: item.color }}>
                        <IconComp size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm mb-0.5" style={{ color: '#1a1a1a' }}>{item.title}</h4>
                        <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: How to Connect */}
            <div className="p-8 rounded-3xl bg-white border border-[#e5e7eb] shadow-sm relative overflow-hidden">
              {/* Decorative gradient sphere */}
              <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 75%)' }} />
              
              <h3 className="text-lg font-bold mb-6" style={{ color: '#1a1a1a' }}>
                Quick Connect Steps
              </h3>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-1">Step 1: Add to Claude</h4>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: '#374151' }}>
                      In Claude.ai settings under <strong className="font-semibold text-black">Connectors</strong>, click <strong className="font-semibold text-black">Add Connector</strong> (the <strong className="font-semibold text-black">+</strong> icon), name it <strong className="font-semibold text-black">BlogWrite</strong>, and set the Remote MCP server URL to:
                    </p>
                    <div className="relative group/copy max-w-full">
                      <pre className="px-3.5 py-2.5 pr-10 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-xs font-mono text-[#374151] mb-2 overflow-auto">
                        {MCP_URL}
                      </pre>
                      <button 
                        onClick={copyMcpUrl}
                        className="absolute right-2 top-2 p-1.5 rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:text-[#1a1a1a] transition-all hover:shadow-sm"
                        title="Copy MCP Link"
                      >
                        {copiedMcpUrl ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-1">Step 2: Connect & Authorize</h4>
                    <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                      Once added, click the <strong className="font-semibold text-black">Connect</strong> button. You will be redirected to securely approve the connector.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-1">Step 3: Start Chatting</h4>
                    <p className="text-sm leading-relaxed mb-2" style={{ color: '#374151' }}>
                      That's it! You can now prompt Claude inside your chat. Try these examples:
                    </p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5" style={{ color: '#4b5563' }}>
                      <li>
                        <strong className="text-black">Retrieve posts:</strong> <code className="bg-[#f3f4f6] px-1 py-0.5 rounded font-mono">&quot;list my recent blog posts from blogwrite&quot;</code>
                      </li>
                      <li>
                        <strong className="text-black">Write a blog:</strong> <code className="bg-[#f3f4f6] px-1 py-0.5 rounded font-mono">&quot;write a blog post about future robotics and how it will take over the world&quot;</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#f59e0b' }}>Pricing</span>
            <h2 className="text-3xl md:text-[42px] font-bold mt-3 mb-4 tracking-tight" style={{ color: '#1a1a1a' }}>
              Simple, affordable pricing
            </h2>
            <p className="text-base" style={{ color: '#6b7280' }}>
              Start free, upgrade when you need more power.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-2xl" style={{ border: '1px solid #e5e7eb' }}>
              <div className="text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Free</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-bold" style={{ color: '#1a1a1a' }}>$0</span>
                <span className="text-sm" style={{ color: '#9ca3af' }}>/forever</span>
              </div>
              <p className="text-sm mb-8" style={{ color: '#6b7280' }}>Perfect for getting started</p>
              <ul className="space-y-3 mb-8">
                {[
                  '3 published posts (Rich text & Markdown)',
                  'Basic post editor',
                  '50MB media storage',
                  'Standard profile page',
                  'Claude.ai MCP Integration',
                  'Community support'
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm" style={{ color: '#4b5563' }}>
                    <Check size={16} style={{ color: '#10b981' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={user ? "/dashboard" : "/signup"}
                className="block w-full text-center py-3.5 rounded-full text-sm font-semibold transition-colors hover:bg-[#f9fafb]"
                style={{ border: '1px solid #d4d4d4', color: '#1a1a1a' }}>
                {user ? "Go to Dashboard" : "Get Started Free"}
              </Link>
            </div>

            {/* Writer Plan */}
            <div className="p-8 rounded-2xl relative overflow-hidden"
              style={{ border: '2px solid #1a1a1a', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: '#1a1a1a' }}>
                Popular
              </div>
              <div className="text-sm font-medium mb-2" style={{ color: '#f59e0b' }}>Writer</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-bold" style={{ color: '#1a1a1a' }}>$1</span>
                <span className="text-sm" style={{ color: '#9ca3af' }}>/month</span>
              </div>
              <p className="text-sm mb-8" style={{ color: '#6b7280' }}>For serious writers</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited posts (Rich text, LaTeX, HTML, Markdown)',
                  'AI Chat Assistant & Writing Copilot',
                  'Pulse daily tech news trends',
                  'Diverse Academic Research Desk',
                  'AI Startup Concepts hub',
                  'Custom profile as a personal portfolio',
                  'Advanced statistics & reader analytics',
                  '5GB secure media storage',
                  'Custom SEO fields override',
                  'Claude.ai MCP Integration',
                  'Writer badge ✨',
                  'Priority support'
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm" style={{ color: '#4b5563' }}>
                    <Check size={16} style={{ color: '#f59e0b' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={user ? "/dashboard/billing" : "/signup"}
                className="block w-full text-center py-3.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#1a1a1a' }}>
                {user ? (user?.subscription?.plan === 'writer' ? "Go to Dashboard" : "Upgrade to Pro →") : "Start Writing →"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6" style={{ background: '#1a1a1a' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-[42px] font-bold mb-5 tracking-tight text-white">
            Ready to share your story?
          </h2>
          <p className="text-base mb-10" style={{ color: '#9ca3af' }}>
            Share your ideas with the world. No credit card required.
          </p>
          <Link href={user ? "/dashboard" : "/signup"}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all group"
            style={{ background: '#ffffff', color: '#1a1a1a' }}>
            {user ? "Go to Dashboard" : "Create Your Free Account"}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/favicon.png" alt="BlogWrite" className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm" />
                <span className="text-lg font-bold" style={{ color: '#1a1a1a' }}>
                  Blog<span style={{ color: '#f59e0b' }}>Write</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
                The modern platform for writers and readers.
              </p>
            </div>
             {[
              { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Explore', href: '/dashboard/explore' }] },
              { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/dashboard/explore' }, { label: 'Contact', href: '/contact' }] },
              { title: 'Legal', links: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Cookies', href: '/cookies' }] },
            ].map((section) => (
              <div key={section.title}>
                <div className="text-sm font-semibold mb-4" style={{ color: '#1a1a1a' }}>{section.title}</div>
                <ul className="space-y-2.5">
                  {section.links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm transition-colors hover:text-[#1a1a1a]" style={{ color: '#9ca3af' }}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid #e5e7eb' }}>
            <span className="text-xs" style={{ color: '#9ca3af' }}>
              © {new Date().getFullYear()} BlogWrite. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

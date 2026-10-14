'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Puzzle, ArrowRight, Terminal, Globe, BookOpen, Sparkles, Cpu, CheckCircle2, MessageSquare, Key, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { MCP_URL } from '@/lib/siteUrl';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('web'); // 'web' | 'desktop'

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
      {/* Page Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold flex items-center justify-center md:justify-start gap-2.5 mb-3" style={{ color: 'var(--color-text-primary)' }}>
          <Puzzle size={28} style={{ color: 'var(--color-brand)' }} />
          Integrate Claude with BlogWrite
        </h1>
        <p className="text-[15px] leading-relaxed max-w-2xl" style={{ color: 'var(--color-text-secondary)' }}>
          Supercharge your workflow by connecting Claude directly to your blog workspace. 
          Manage drafts, publish stories, view analytics, and query research papers via the Model Context Protocol (MCP).
        </p>
      </div>

      {/* Grid: What Claude Can Do */}
      <div className="mb-12">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Sparkles size={18} style={{ color: '#f59e0b' }} />
          What Claude Can Do For You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              title: 'Draft & Publish Posts',
              desc: 'Ask Claude to "write a draft about spintronics", "edit post 123", or "publish my latest draft". Claude has full write permissions to manage your blog posts.',
              icon: BookOpen,
              color: '#3b82f6',
              bg: 'rgba(59,130,246,0.06)'
            },
            {
              title: 'Moderate Comments',
              desc: 'Read, reply to, and delete comments on your articles right from the chat: "list comments for post 456" or "delete comment 789".',
              icon: MessageSquare,
              color: '#10b981',
              bg: 'rgba(16,185,129,0.06)'
            },
            {
              title: 'Feed & Research Curation',
              desc: 'Access your homepage feeds, trending Pulse news, and the academic Research Desk: "search research papers on neural networks" or "what is trending?".',
              icon: Cpu,
              color: '#a855f7',
              bg: 'rgba(168,85,247,0.06)'
            },
            {
              title: 'Insights & Analytics',
              desc: 'Stay on top of your metrics: "show my analytics overview", "how many views does my latest post have?", or "update my bio details".',
              icon: ShieldCheck,
              color: '#f59e0b',
              bg: 'rgba(245,158,11,0.06)'
            }
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-primary)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: item.bg }}>
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{item.title}</h3>
              <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Section: Setup Guides */}
      <div className="mb-12 rounded-2xl border overflow-hidden"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-primary)' }}>
        
        {/* Tab Headers */}
        <div className="flex border-b" style={{ borderColor: 'var(--color-border-primary)', background: 'var(--color-bg-secondary)' }}>
          <button 
            onClick={() => setActiveTab('web')}
            className={`flex-1 py-4 px-6 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'web' 
                ? 'border-[var(--color-brand)] text-[var(--color-brand)] bg-[var(--color-bg-primary)]' 
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Globe size={15} />
            Claude.ai Web App (Beta)
          </button>
          <button 
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-4 px-6 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'desktop' 
                ? 'border-[var(--color-brand)] text-[var(--color-brand)] bg-[var(--color-bg-primary)]' 
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Terminal size={15} />
            Claude Desktop App
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'web' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Connecting Claude.ai Web Interface</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Claude.ai on the web supports remote **Custom Connectors** using Server-Sent Events (SSE). 
                  Our server is securely integrated with OAuth 2.0 so you can connect directly in a single click without managing API keys or custom headers.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: '01',
                    text: <>Navigate to your <strong style={{ color: 'var(--color-text-primary)' }}>Claude.ai Settings</strong> (click your profile avatar in the bottom-left corner) &gt; <strong style={{ color: 'var(--color-text-primary)' }}>Custom Connectors</strong>.</>
                  },
                  {
                    step: '02',
                    text: <>Click <strong style={{ color: 'var(--color-text-primary)' }}>Add Connector</strong> (the <strong style={{ color: 'var(--color-text-primary)' }}>+</strong> icon), name it <strong>&quot;BlogWrite&quot;</strong>, and set the URL to <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] font-mono text-[11px]">{MCP_URL}</code>.</>
                  },
                  {
                    step: '03',
                    text: <>Click <strong style={{ color: 'var(--color-text-primary)' }}>Add</strong> to create the connector.</>
                  },
                  {
                    step: '04',
                    text: <>Under the newly created connector, click <strong style={{ color: 'var(--color-text-primary)' }}>Connect</strong>. You will be redirected to approve the connection. Once connected, start chatting immediately! Try asking:
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                        <li><strong>&quot;list my recent blog posts from blogwrite&quot;</strong></li>
                        <li><strong>&quot;write a blog post about future robotics and how it will take over the world&quot;</strong></li>
                      </ul>
                    </>
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                      {item.step}
                    </div>
                    <div className="text-[13px] leading-relaxed pt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Connecting Claude Desktop App</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Claude Desktop utilizes a local configuration JSON file to automatically run Model Context Protocol (MCP) servers locally using standard input/output (stdio).
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: '01',
                    text: <>Go to the <Link href="/dashboard/api-keys" className="font-semibold underline hover:text-[var(--color-brand)]">Settings / API Keys</Link> page and generate a key named <strong>&quot;Claude Desktop&quot;</strong>.</>
                  },
                  {
                    step: '02',
                    text: <>Copy the generated <strong>Claude Desktop Config JSON</strong> code snippet block.</>
                  },
                  {
                    step: '03',
                    text: <>Open your local Claude Desktop config file in a text editor:
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                        <li><strong>macOS:</strong> <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] font-mono text-[11px]">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
                        <li><strong>Windows:</strong> <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] font-mono text-[11px]">%APPDATA%\Claude\claude_desktop_config.json</code></li>
                      </ul>
                    </>
                  },
                  {
                    step: '04',
                    text: <>Merge the copied JSON configuration block inside the <code className="px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[11px]">&quot;mcpServers&quot;</code> object of your configuration file.</>
                  },
                  {
                    step: '05',
                    text: <>Restart the Claude Desktop application. Look for the 🔨 hammer icon in Claude&apos;s chat input bar to verify BlogWrite is connected!</>
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                      {item.step}
                    </div>
                    <div className="text-[13px] leading-relaxed pt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action: API Keys Link */}
      <div className="p-8 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-md"
        style={{ background: 'linear-gradient(135deg, var(--color-bg-card), var(--color-bg-secondary))', borderColor: 'var(--color-border-primary)' }}>
        <div className="space-y-1.5 text-center md:text-left">
          <h3 className="text-sm font-bold flex items-center justify-center md:justify-start gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
            <Key size={16} style={{ color: 'var(--color-brand)' }} />
            Ready to Connect Claude?
          </h3>
          <p className="text-[12.5px]" style={{ color: 'var(--color-text-muted)' }}>
            Generate your secure integration API key to configure the Custom Connector or Claude Desktop config.
          </p>
        </div>
        <Link href="/dashboard/api-keys"
          className="flex items-center gap-1.5 px-6 py-3 rounded-full text-xs font-bold text-white transition-transform hover:scale-105 shadow-md shrink-0"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
          Manage API Keys
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

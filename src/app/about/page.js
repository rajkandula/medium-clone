'use client';

import PublicLayout from '@/components/shared/PublicLayout';

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#f59e0b' }}>Our Story</span>
          <h1 className="text-4xl md:text-5xl font-black mt-3 mb-6 tracking-tight" style={{ color: '#1a1a1a' }}>
            To Give Ideas a Voice
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto text-gray-500">
            BlogWrite was born out of a simple idea: that writing is a deeply personal form of creation, 
            and modern technology should amplify your voice, not obscure it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Why BlogWrite?</h2>
            <div className="space-y-4 text-sm leading-relaxed text-gray-600">
              <p>
                In a crowded landscape of social media feeds and quick notifications, deep-dive writing remains 
                the most powerful way to share knowledge. Whether you are explaining complex physics or documenting 
                a personal journey, your thoughts deserve a dedicated space.
              </p>
              <p>
                We built BlogWrite to bridge the gap between traditional blogging and the future of editing. 
                By providing clean, structured markdown editing, AI co-writing assistants, and integration with 
                academic research desks, we empower creators to write higher-quality articles in less time.
              </p>
            </div>
          </div>
          <div className="p-8 rounded-2xl border border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-sm mb-4 text-gray-900">Our Core Principles</h3>
            <ul className="space-y-3.5">
              {[
                { title: 'Privacy First', desc: 'Your drafts are yours alone. We never train public models on your private data.' },
                { title: 'Developer-Friendly', desc: 'Deep support for Markdown, LaTeX math formatting, and code syntax highlighting.' },
                { title: 'Open Integrations', desc: 'Model Context Protocol (MCP) support to connect your favorite AI assistants directly.' },
              ].map(item => (
                <li key={item.title}>
                  <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wide">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Core Values grid */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-8 text-center text-gray-900">Empowering Every Writer</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { val: 'Your own page', desc: 'Every writer gets a public profile that gathers their published stories.' },
              { val: 'Any format', desc: 'Write in rich text, Markdown, LaTeX, or HTML, on science, design, engineering, tech, or anything else.' },
              { val: 'Ad-free', desc: 'No ads in the reading experience, for every visitor.' },
            ].map(v => (
              <div key={v.val} className="p-6 rounded-xl border border-gray-100 text-center">
                <div className="text-2xl font-bold text-amber-500 mb-2">{v.val}</div>
                <div className="text-xs leading-relaxed text-gray-500">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

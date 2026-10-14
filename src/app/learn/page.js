'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PublicLayout from '@/components/shared/PublicLayout';
import DashboardLayout from '@/app/dashboard/layout';

export default function LearnIndexPage() {
  const { user, loading: authLoading } = useAuth();
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/series?limit=24')
      .then(r => r.json())
      .then(d => { setSeries(d.series || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const content = (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Learning Paths
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Curated, ordered sequences that take you from beginner to advanced — one lesson at a time.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border-primary)' }}>
              <div className="aspect-[16/9]" style={{ background: 'var(--color-bg-tertiary)' }} />
              <div className="p-4 h-24" style={{ background: 'var(--color-bg-card)' }} />
            </div>
          ))}
        </div>
      ) : series.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No learning paths yet — check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.map(s => (
            <Link
              key={s._id}
              href={`/learn/${s.slug}`}
              className="group flex flex-col rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}
            >
              {s.coverImage ? (
                <div className="aspect-[16/9] overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
                  <img
                    src={s.coverImage}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : null}
              <div className="flex flex-col flex-1 p-4">
                {s.category?.name ? (
                  <span className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: s.category.color || 'var(--color-brand)' }}>
                    {s.category.name}
                  </span>
                ) : null}
                <h3 className="text-sm font-bold leading-snug line-clamp-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {s.title}
                </h3>
                {s.description ? (
                  <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {s.description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  <Layers size={12} /> {s.postCount || 0} lessons · {s.level}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  // Avoid flashing the wrong chrome before we know who the user is.
  if (authLoading) {
    return <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }} />;
  }
  // Logged-in users keep the app shell (left sidebar); visitors get the marketing layout.
  if (user) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }
  return <PublicLayout>{content}</PublicLayout>;
}

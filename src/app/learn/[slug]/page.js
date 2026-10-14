'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Clock, Layers, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PublicLayout from '@/components/shared/PublicLayout';
import DashboardLayout from '@/app/dashboard/layout';

export default function SeriesDetailPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/series/${params.slug}`)
      .then(r => r.json())
      .then(d => { setSeries(d.series || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.slug]);

  // Logged-in users read lessons inside the app shell; visitors get the public post page.
  const readBase = user ? '/dashboard/read' : '/blog';

  let content;
  if (loading) {
    content = (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
      </div>
    );
  } else if (!series) {
    content = (
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Path not found</h1>
        <Link href="/learn" style={{ color: 'var(--color-brand)' }}>← Back to learning paths</Link>
      </div>
    );
  } else {
    const posts = series.posts || [];
    content = (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/learn" className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          ← Learning Paths
        </Link>

        <header className="mt-4 mb-8">
          {series.category?.name ? (
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: series.category.color || 'var(--color-brand)' }}>
              {series.category.name}
            </span>
          ) : null}
          <h1 className="text-3xl font-black tracking-tight mt-1" style={{ color: 'var(--color-text-primary)' }}>
            {series.title}
          </h1>
          {series.description ? (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {series.description}
            </p>
          ) : null}
          <div className="mt-4 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            <Layers size={13} /> {posts.length} lessons · {series.level}
          </div>
        </header>

        {posts.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>This path has no available lessons right now.</p>
        ) : (
          <ol className="relative space-y-3">
            {posts.map((p, i) => (
              <li key={p._id}>
                <Link
                  href={`${readBase}/${p.slug}`}
                  className="group flex items-start gap-4 rounded-2xl p-4 transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}
                >
                  <span
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      Part {i + 1} of {posts.length}
                    </div>
                    <h3 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                      {p.title}
                    </h3>
                    {p.excerpt ? (
                      <p className="text-xs leading-relaxed line-clamp-2 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {p.excerpt}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      <Clock size={12} /> {p.readTime || 1} min read
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  }

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

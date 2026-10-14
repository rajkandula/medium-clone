'use client';
import Link from 'next/link';
import { Layers, ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * In-post "Part X of N" banner with prev/next links.
 * `series` is the seriesContext object from GET /api/posts/[id].
 * `basePath` is '/blog' (public) or '/dashboard/read' (in-app).
 */
export default function SeriesNav({ series, basePath = '/blog' }) {
  if (!series) return null;

  return (
    <section
      className="my-8 rounded-2xl p-5"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Layers size={16} style={{ color: 'var(--color-brand)' }} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Part {series.part} of {series.total}
        </span>
        <Link
          href={`/learn/${series.slug}`}
          className="text-sm font-bold hover:underline ml-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {series.title}
        </Link>
      </div>
      <div className="flex items-stretch gap-3">
        {series.prev ? (
          <Link
            href={`${basePath}/${series.prev.slug}`}
            className="flex-1 flex items-center gap-2 rounded-xl p-3 transition-all hover:-translate-y-0.5"
            style={{ border: '1px solid var(--color-border-primary)' }}
          >
            <ArrowLeft size={16} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
              {series.prev.title}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {series.next ? (
          <Link
            href={`${basePath}/${series.next.slug}`}
            className="flex-1 flex items-center justify-end gap-2 rounded-xl p-3 transition-all hover:-translate-y-0.5"
            style={{ border: '1px solid var(--color-border-primary)' }}
          >
            <span className="text-xs line-clamp-1 text-right" style={{ color: 'var(--color-text-secondary)' }}>
              {series.next.title}
            </span>
            <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </section>
  );
}

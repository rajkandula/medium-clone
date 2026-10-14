'use client';
import Link from 'next/link';
import { Clock } from 'lucide-react';

/**
 * "Continue learning" — related posts by category / shared tags.
 * `basePath` is '/blog' for the public reader and '/dashboard/read' inside the app.
 */
export default function RelatedPosts({ posts, basePath = '/blog' }) {
  if (!posts || posts.length === 0) return null;
  const items = posts.slice(0, 6);

  return (
    <section className="mt-14 mb-10">
      <h2 className="text-lg font-black tracking-tight mb-5" style={{ color: 'var(--color-text-primary)' }}>
        Continue learning
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(p => (
          <Link
            key={p._id}
            href={`${basePath}/${p.slug}`}
            className="group flex flex-col rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}
          >
            {p.coverImage ? (
              <div className="aspect-[16/9] overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
                <img
                  src={p.coverImage}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : null}
            <div className="flex flex-col flex-1 p-4">
              {p.category?.name ? (
                <span
                  className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: p.category.color || 'var(--color-brand)' }}
                >
                  {p.category.name}
                </span>
              ) : null}
              <h3
                className="text-sm font-bold leading-snug line-clamp-2 mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {p.format === 'product' && p.appName ? p.appName : p.title}
              </h3>
              {p.excerpt ? (
                <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  {p.excerpt}
                </p>
              ) : null}
              <div className="mt-auto flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                <Clock size={12} /> {p.readTime || 1} min read
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

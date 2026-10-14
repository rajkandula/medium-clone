'use client';

import { ExternalLink, Calendar, Tag, DollarSign, Rocket, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export default function ProductLaunchPreview({
  appName, productUrl, pricing, launchDate,
  appDescription, content, appImages = [], coverImage,
}) {
  const [activeImg, setActiveImg] = useState(0);

  const hasAny = appName || productUrl || pricing || launchDate || appDescription || content || appImages.length > 0 || coverImage;

  const renderContent = (raw) => {
    if (!raw) return null;
    const html = marked(raw.startsWith('<') ? raw : raw); // handle both HTML and markdown
    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1','h2','h3','pre','code','span','img']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class','style'] },
    });
  };

  const formattedDate = launchDate
    ? new Date(launchDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
          <Rocket className="w-6 h-6 text-rose-400" />
        </div>
        <p className="text-[15px] font-semibold text-gray-500">Your product launch preview will appear here</p>
        <p className="text-[13px] text-gray-400 mt-1">Fill in the product details above to see a live preview</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">

      {/* ── Hero / Cover ── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: coverImage ? 260 : 180 }}>
        {coverImage ? (
          <img src={coverImage} alt="Cover" className="w-full object-cover" style={{ maxHeight: 320 }} />
        ) : (
          <div className="w-full h-44" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #fce7f3 100%)' }} />
        )}
        {/* Gradient fade */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.95) 100%)' }} />
      </div>

      {/* ── App identity ── */}
      <div className="px-8 sm:px-12 pb-0 -mt-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">

          {/* App icon placeholder */}
          <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center shrink-0 select-none"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            {appName ? (
              <span className="text-2xl font-black text-white">
                {appName.trim()[0].toUpperCase()}
              </span>
            ) : (
              <Rocket className="w-7 h-7 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {appName && (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {appName}
              </h1>
            )}
            {appDescription && (
              <p className="mt-1 text-[15px] text-gray-500 leading-relaxed max-w-2xl">{appDescription}</p>
            )}
          </div>

          {/* CTA */}
          {productUrl && (
            <a
              href={productUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] shadow-sm active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
            >
              Visit Product <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* ── Metadata chips ── */}
        {(pricing || formattedDate) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {pricing && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <DollarSign className="w-3 h-3" /> {pricing}
              </div>
            )}
            {formattedDate && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Calendar className="w-3 h-3" /> Launching {formattedDate}
              </div>
            )}
          </div>
        )}

        <div className="mt-6" style={{ borderBottom: '1px solid #f3f4f6' }} />
      </div>

      {/* ── Screenshots gallery ── */}
      {appImages.length > 0 && (
        <div className="px-8 sm:px-12 py-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">Screenshots</p>

          {/* Main image */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 mb-3"
            style={{ maxHeight: 420 }}>
            <img
              src={appImages[activeImg]}
              alt={`Screenshot ${activeImg + 1}`}
              className="w-full object-cover"
              style={{ maxHeight: 420 }}
            />
            {appImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg(i => (i - 1 + appImages.length) % appImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setActiveImg(i => (i + 1) % appImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {appImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {appImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeImg ? 'border-amber-400 shadow-sm' : 'border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Written content ── */}
      {content && (
        <div className="px-8 sm:px-12 py-8" style={{ borderTop: appImages.length > 0 ? '1px solid #f3f4f6' : 'none' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6">About this product</p>
          <div
            className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-amber-600 prose-strong:text-gray-900 prose-code:text-amber-600 prose-code:bg-amber-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
            dangerouslySetInnerHTML={{ __html: renderContent(content) }}
          />
        </div>
      )}

    </div>
  );
}

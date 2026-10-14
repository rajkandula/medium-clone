/**
 * SEO utilities for dynamic metadata and structured data
 */

import { SITE_URL } from '@/lib/siteUrl';

const SITE_NAME = 'BlogWrite';

/**
 * Generate page metadata for a blog post
 */
export function generatePostMetadata(post) {
  const title = `${post.seoTitle || post.title} | ${SITE_NAME}`;
  const description = post.seoDescription || post.excerpt || post.title;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.coverImage || `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    openGraph: {
      title: post.seoTitle || post.title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author?.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  };
}

/**
 * Generate JSON-LD structured data for an article
 */
export function generateArticleJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    author: {
      '@type': 'Person',
      name: post.author?.name,
      url: `${SITE_URL}/profile/${post.author?.username}`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    wordCount: post.content?.split(/\s+/).length,
    articleSection: post.category?.name,
    keywords: post.tags?.join(', '),
  };
}

/**
 * Generate JSON-LD for a person profile
 */
export function generatePersonJsonLd(user) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.name,
    url: `${SITE_URL}/profile/${user.username}`,
    image: user.avatar,
    description: user.bio,
    sameAs: [
      user.socialLinks?.twitter,
      user.socialLinks?.github,
      user.socialLinks?.linkedin,
      user.socialLinks?.website,
    ].filter(Boolean),
  };
}

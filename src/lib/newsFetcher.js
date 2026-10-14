import RSSParser from 'rss-parser';
import newsSources from './newsSources.json';

const parser = new RSSParser({
  timeout: 10000,
  headers: { 'User-Agent': 'BlogWrite/1.0 (News Aggregator)' },
});

/**
 * Fetch articles from all configured RSS sources
 * Returns raw articles with source metadata attached
 */
export async function fetchAllSources() {
  const results = [];

  for (const source of newsSources) {
    try {
      const feed = await parser.parseURL(source.url);
      const articles = (feed.items || []).slice(0, 10).map(item => ({
        title: item.title?.trim() || '',
        link: item.link || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        content: item.contentSnippet || item.content || '',
        imageUrl: extractImage(item),
        sourceName: source.name,
        sourceIcon: source.icon,
        sourceCategory: source.category,
      }));
      results.push(...articles);
    } catch (err) {
      console.warn(`Failed to fetch ${source.name}:`, err.message);
    }
  }

  return results;
}

/**
 * Extract the first image from an RSS item
 */
function extractImage(item) {
  // Check enclosure
  if (item.enclosure?.url) return item.enclosure.url;
  // Check media:content
  if (item['media:content']?.$.url) return item['media:content'].$.url;
  // Try to extract from content HTML
  const imgMatch = (item.content || '').match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1];
  return null;
}

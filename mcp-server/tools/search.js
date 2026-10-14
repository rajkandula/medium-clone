import { z } from 'zod';

/**
 * Search tools (1 tool)
 */
export function registerSearchTools(server, api) {

  // ─── search_posts ───
  server.tool(
    'search_posts',
    'Full-text search across all published blog posts on BlogWrite. Searches titles, content, and tags.',
    {
      query: z.string().describe('Search query (min 2 characters)'),
      page: z.number().optional().describe('Page number (default: 1)'),
      limit: z.number().optional().describe('Results per page (default: 12)'),
    },
    async ({ query, page, limit }) => {
      try {
        const data = await api.get('/api/search', {
          q: query,
          page: page || 1,
          limit: limit || 12,
        });
        const posts = data.posts || [];

        if (posts.length === 0) {
          return { content: [{ type: 'text', text: `🔍 No results found for "${query}".` }] };
        }

        const list = posts.map((p, i) => {
          const excerpt = p.excerpt || (p.content ? p.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '');
          return `**${i + 1}. ${p.title}**\n   by ${p.author?.name || 'Unknown'} · ❤️ ${p.likesCount || 0} · 👁️ ${p.viewCount || 0}\n   ${excerpt}\n   🔗 /blog/${p.slug}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `🔍 Search results for "${query}" (${data.total} found):\n\n${list}${data.hasMore ? '\n\n📄 More results available — increase page number.' : ''}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Search failed: ${error.message}` }] };
      }
    }
  );
}

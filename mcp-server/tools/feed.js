import { z } from 'zod';

/**
 * Feed & Discovery tools (2 tools)
 */
export function registerFeedTools(server, api) {

  // ─── get_feed ───
  server.tool(
    'get_feed',
    'Get your personalized feed or trending posts from the BlogWrite homepage. Returns posts with titles, excerpts, stats, and author info.',
    {
      type: z.enum(['personalized', 'trending']).optional().describe('Feed type (default: personalized)'),
      page: z.number().optional().describe('Page number (default: 1)'),
      limit: z.number().optional().describe('Posts per page (default: 10)'),
    },
    async ({ type, page, limit }) => {
      try {
        const data = await api.get('/api/feed', {
          type: type || 'personalized',
          page: page || 1,
          limit: limit || 10,
        });
        const posts = data.posts || [];

        if (posts.length === 0) {
          return { content: [{ type: 'text', text: '📭 No posts in your feed. Try following some writers or explore trending posts!' }] };
        }

        const list = posts.map((p, i) => {
          const excerpt = p.excerpt || (p.content ? p.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '');
          return `**${i + 1}. ${p.title}**\n   by ${p.author?.name || 'Unknown'} · ${p.readTime || 1} min read\n   ❤️ ${p.likesCount || 0} · 💬 ${p.commentsCount || 0} · 👁️ ${p.viewCount || 0}\n   ${excerpt}\n   🔗 /blog/${p.slug}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `📰 ${type === 'trending' ? 'Trending' : 'Your Feed'} (${posts.length} posts):\n\n${list}${data.hasMore ? '\n\n📄 More posts available — increase page number to see more.' : ''}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load feed: ${error.message}` }] };
      }
    }
  );

  // ─── get_public_posts ───
  server.tool(
    'get_public_posts',
    'Browse all public blog posts. Filter by category, tag, or sort order.',
    {
      sort: z.enum(['latest', 'popular', 'trending']).optional().describe('Sort order (default: latest)'),
      category: z.string().optional().describe('Category ID to filter by'),
      tag: z.string().optional().describe('Tag to filter by'),
      collection: z.string().optional().describe('Collection name to filter by'),
      page: z.number().optional().describe('Page number (default: 1)'),
      limit: z.number().optional().describe('Posts per page (default: 12)'),
    },
    async (params) => {
      try {
        const data = await api.get('/api/posts', {
          status: 'published',
          sort: params.sort || 'latest',
          category: params.category,
          tag: params.tag,
          collection: params.collection,
          page: params.page || 1,
          limit: params.limit || 12,
        });
        const posts = data.posts || [];

        if (posts.length === 0) {
          return { content: [{ type: 'text', text: '📭 No posts found with those filters.' }] };
        }

        const list = posts.map((p, i) => {
          return `**${i + 1}. ${p.title}**\n   by ${p.author?.name || 'Unknown'} · ${p.readTime || 1} min · ❤️ ${p.likesCount || 0} · 👁️ ${p.viewCount || 0}\n   🏷️ ${(p.tags || []).slice(0, 3).join(', ') || 'no tags'}\n   🔗 /blog/${p.slug}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `📚 Public Posts (${data.total} total, page ${data.page}/${data.totalPages}):\n\n${list}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load posts: ${error.message}` }] };
      }
    }
  );
}

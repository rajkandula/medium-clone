import { z } from 'zod';

/**
 * Bookmarks & Engagement tools (4 tools)
 */
export function registerBookmarkTools(server, api) {

  // ─── list_bookmarks ───
  server.tool(
    'list_bookmarks',
    'Get your bookmarked/saved items — blog posts, research papers, or news articles.',
    {
      type: z.enum(['post', 'research', 'news']).optional().describe('Filter by type (default: all types)'),
    },
    async ({ type }) => {
      try {
        const params = {};
        if (type) params.type = type;

        const data = await api.get('/api/users/me/bookmarks', params);
        const bookmarks = data.bookmarks || [];

        if (bookmarks.length === 0) {
          return { content: [{ type: 'text', text: `🔖 No ${type || ''} bookmarks found.` }] };
        }

        const list = bookmarks.map((b, i) => {
          if (b.post) {
            return `${i + 1}. 📝 **${b.post.title || 'Untitled'}**\n   Type: Blog Post | /blog/${b.post.slug || b.post._id}`;
          }
          if (b.research) {
            return `${i + 1}. 🔬 **${b.research.title || 'Untitled'}**\n   Type: Research Paper | ${b.research.sourceUrl || ''}`;
          }
          if (b.news) {
            return `${i + 1}. ⚡ **${b.news.title || 'Untitled'}**\n   Type: Pulse Article | ${b.news.sourceUrl || ''}`;
          }
          return `${i + 1}. Unknown bookmark`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `🔖 Your Bookmarks (${bookmarks.length}):\n\n${list}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load bookmarks: ${error.message}` }] };
      }
    }
  );

  // ─── bookmark_post ───
  server.tool(
    'bookmark_post',
    'Toggle bookmark on a blog post — saves it to your bookmarks or removes it if already bookmarked.',
    {
      postId: z.string().describe('Post ID to bookmark/unbookmark'),
    },
    async ({ postId }) => {
      try {
        const data = await api.post(`/api/posts/${postId}/bookmark`);
        return {
          content: [{
            type: 'text',
            text: data.bookmarked ? '🔖 Post bookmarked!' : '📄 Bookmark removed.',
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to bookmark: ${error.message}` }] };
      }
    }
  );

  // ─── bookmark_research ───
  server.tool(
    'bookmark_research',
    'Toggle bookmark on a research paper — saves it to your bookmarks.',
    {
      paperId: z.string().describe('Research paper ID to bookmark/unbookmark'),
    },
    async ({ paperId }) => {
      try {
        const data = await api.post(`/api/research/${paperId}/save`);
        return {
          content: [{
            type: 'text',
            text: data.saved ? '🔖 Research paper saved!' : '📄 Paper unsaved.',
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to save paper: ${error.message}` }] };
      }
    }
  );

  // ─── like_post ───
  server.tool(
    'like_post',
    'Toggle like on a blog post.',
    {
      postId: z.string().describe('Post ID to like/unlike'),
    },
    async ({ postId }) => {
      try {
        const data = await api.post(`/api/posts/${postId}/like`);
        return {
          content: [{
            type: 'text',
            text: data.liked ? '❤️ Post liked!' : '💔 Like removed.',
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to like post: ${error.message}` }] };
      }
    }
  );
}

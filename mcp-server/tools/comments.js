import { z } from 'zod';

/**
 * Comment tools (2 tools)
 */
export function registerCommentTools(server, api) {

  // ─── list_comments ───
  server.tool(
    'list_comments',
    'Get all comments on a blog post.',
    {
      postId: z.string().describe('Post ID to get comments for'),
    },
    async ({ postId }) => {
      try {
        const data = await api.get(`/api/posts/${postId}/comments`);
        const comments = data.comments || [];

        if (comments.length === 0) {
          return { content: [{ type: 'text', text: '💬 No comments on this post yet.' }] };
        }

        const list = comments.map((c, i) => {
          const author = c.author?.name || 'Anonymous';
          const content = c.content.length > 200 ? c.content.substring(0, 200) + '...' : c.content;
          return `${i + 1}. **${author}**: ${content}\n   ❤️ ${c.likesCount || 0} likes${c.isEdited ? ' · (edited)' : ''}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `💬 Comments (${comments.length}):\n\n${list}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load comments: ${error.message}` }] };
      }
    }
  );

  // ─── add_comment ───
  server.tool(
    'add_comment',
    'Add a comment to a blog post.',
    {
      postId: z.string().describe('Post ID to comment on'),
      content: z.string().describe('Comment text (max 2000 characters)'),
    },
    async ({ postId, content }) => {
      try {
        const data = await api.post(`/api/posts/${postId}/comments`, { content });
        return {
          content: [{
            type: 'text',
            text: `💬 Comment posted successfully!`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to post comment: ${error.message}` }] };
      }
    }
  );
}

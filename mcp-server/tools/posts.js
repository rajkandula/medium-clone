import { z } from 'zod';

/**
 * Blog Post CRUD tools (7 tools)
 */
export function registerPostTools(server, api) {

  // ─── create_post ───
  server.tool(
    'create_post',
    'Create a new blog post. Supports formats: richtext, markdown, html, latex, product. Set status to "published" to publish immediately, or "draft" to save as draft.',
    {
      title: z.string().describe('Post title'),
      content: z.string().describe('Post content (HTML for richtext, raw for markdown/latex)'),
      format: z.enum(['richtext', 'markdown', 'html', 'latex', 'product']).optional().describe('Content format (default: richtext)'),
      status: z.enum(['draft', 'published']).optional().describe('Post status (default: draft)'),
      excerpt: z.string().optional().describe('Short summary/excerpt'),
      tags: z.array(z.string()).optional().describe('Tags/keywords'),
      category: z.string().optional().describe('Category ID'),
      coverImage: z.string().optional().describe('Cover image URL'),
      seoTitle: z.string().optional().describe('SEO title override'),
      seoDescription: z.string().optional().describe('SEO description override'),
      isAiGenerated: z.boolean().optional().describe('Is the post AI generated (default: false)'),
      systemArchitecture: z.string().optional().describe('Mermaid flowchart and architecture design (HTML)'),
      techStack: z.string().optional().describe('Tech stack table and explanations (HTML)'),
      dbSchema: z.string().optional().describe('Database schema code blocks (HTML)'),
      apiSpecs: z.string().optional().describe('API specifications code blocks (HTML)'),
      devPlan: z.string().optional().describe('Chronological developer implementation checklist (HTML)'),
    },
    async (params) => {
      try {
        const data = await api.post('/api/posts', {
          isAiGenerated: false,
          ...params,
        });
        const post = data.post;
        return {
          content: [{
            type: 'text',
            text: `✅ Post created successfully!\n\n📝 Title: ${post.title}\n🔗 Slug: ${post.slug}\n📋 Status: ${post.status}\n📄 Format: ${post.format || 'richtext'}\n🆔 ID: ${post._id}${post.status === 'published' ? `\n🌐 URL: /blog/${post.slug}` : ''}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to create post: ${error.message}` }] };
      }
    }
  );

  // ─── list_my_posts ───
  server.tool(
    'list_my_posts',
    'List your blog posts. Filter by status (draft, published, archived). Returns title, status, stats, and ID for each post.',
    {
      status: z.enum(['draft', 'published', 'archived']).optional().describe('Filter by status (default: all)'),
      page: z.number().optional().describe('Page number (default: 1)'),
      limit: z.number().optional().describe('Posts per page (default: 12, max: 50)'),
    },
    async (params) => {
      try {
        // First get user profile to get userId for filtering
        const profile = await api.get('/api/users/me');
        const userId = profile.user._id;

        const queryParams = { author: userId, page: params.page, limit: params.limit };
        if (params.status) queryParams.status = params.status;
        else queryParams.status = 'published'; // API defaults to published

        // For drafts, we need to pass status explicitly
        const data = await api.get('/api/posts', queryParams);
        const posts = data.posts || [];

        if (posts.length === 0) {
          return { content: [{ type: 'text', text: `📭 No ${params.status || ''} posts found.` }] };
        }

        const list = posts.map((p, i) =>
          `${i + 1}. **${p.title}**\n   Status: ${p.status} | Format: ${p.format || 'richtext'} | Views: ${p.viewCount || 0} | Likes: ${p.likesCount || 0}\n   ID: ${p._id}${p.slug ? ` | Slug: ${p.slug}` : ''}`
        ).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `📝 Your Posts (${data.total} total, page ${data.page}/${data.totalPages}):\n\n${list}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to list posts: ${error.message}` }] };
      }
    }
  );

  // ─── get_post ───
  server.tool(
    'get_post',
    'Get the full details of a specific blog post by its ID or slug. Returns title, content, stats, tags, and metadata.',
    {
      id_or_slug: z.string().describe('Post ID (24-char hex) or slug'),
    },
    async ({ id_or_slug }) => {
      try {
        const data = await api.get(`/api/posts/${id_or_slug}`);
        const p = data.post;

        // Truncate content for display
        const contentPreview = p.content?.length > 500
          ? p.content.substring(0, 500).replace(/<[^>]*>/g, '') + '...'
          : (p.content || '').replace(/<[^>]*>/g, '');

        return {
          content: [{
            type: 'text',
            text: `📝 **${p.title}**\n\n🆔 ID: ${p._id}\n🔗 Slug: ${p.slug}\n📋 Status: ${p.status}\n📄 Format: ${p.format || 'richtext'}\n👁️ Views: ${p.viewCount || 0}\n❤️ Likes: ${p.likesCount || 0}\n💬 Comments: ${p.commentsCount || 0}\n🏷️ Tags: ${(p.tags || []).join(', ') || 'none'}\n⏱️ Read time: ${p.readTime || 1} min\n${p.coverImage ? `🖼️ Cover: ${p.coverImage}` : ''}\n${p.excerpt ? `📋 Excerpt: ${p.excerpt}` : ''}\n\n---\n📄 Content Preview:\n${contentPreview}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to get post: ${error.message}` }] };
      }
    }
  );

  // ─── update_post ───
  server.tool(
    'update_post',
    'Update an existing blog post. You can update any combination of fields.',
    {
      id: z.string().describe('Post ID'),
      title: z.string().optional().describe('New title'),
      content: z.string().optional().describe('New content'),
      excerpt: z.string().optional().describe('New excerpt'),
      tags: z.array(z.string()).optional().describe('New tags'),
      category: z.string().optional().describe('New category ID'),
      status: z.enum(['draft', 'published', 'archived']).optional().describe('New status'),
      coverImage: z.string().optional().describe('New cover image URL'),
      format: z.enum(['richtext', 'markdown', 'html', 'latex', 'product']).optional().describe('Content format'),
      seoTitle: z.string().optional().describe('SEO title'),
      seoDescription: z.string().optional().describe('SEO description'),
      collections: z.array(z.string()).optional().describe('Collections this post belongs to'),
      isAiGenerated: z.boolean().optional().describe('Is the post AI generated'),
      systemArchitecture: z.string().optional().describe('Update system architecture design (HTML)'),
      techStack: z.string().optional().describe('Update tech stack details (HTML)'),
      dbSchema: z.string().optional().describe('Update database schemas (HTML)'),
      apiSpecs: z.string().optional().describe('Update API endpoints specifications (HTML)'),
      devPlan: z.string().optional().describe('Update implementation guide (HTML)'),
    },
    async (params) => {
      try {
        const { id, ...updates } = params;
        const data = await api.put(`/api/posts/${id}`, updates);
        const post = data.post;
        return {
          content: [{
            type: 'text',
            text: `✅ Post updated!\n\n📝 Title: ${post.title}\n📋 Status: ${post.status}\n🔗 Slug: ${post.slug}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to update post: ${error.message}` }] };
      }
    }
  );

  // ─── delete_post ───
  server.tool(
    'delete_post',
    'Permanently delete a blog post by its ID.',
    {
      id: z.string().describe('Post ID to delete'),
    },
    async ({ id }) => {
      try {
        await api.delete(`/api/posts/${id}`);
        return { content: [{ type: 'text', text: `🗑️ Post deleted successfully.` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to delete post: ${error.message}` }] };
      }
    }
  );

  // ─── publish_post ───
  server.tool(
    'publish_post',
    'Publish a draft post — makes it live and visible to everyone.',
    {
      id: z.string().describe('Post ID to publish'),
    },
    async ({ id }) => {
      try {
        const data = await api.put(`/api/posts/${id}`, { status: 'published' });
        const post = data.post;
        return {
          content: [{
            type: 'text',
            text: `🚀 Post published!\n\n📝 Title: ${post.title}\n🌐 URL: /blog/${post.slug}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to publish post: ${error.message}` }] };
      }
    }
  );

  // ─── create_product_launch ───
  server.tool(
    'create_product_launch',
    'Create a product launch post to showcase an app, tool, or product.',
    {
      title: z.string().describe('Product launch post title'),
      content: z.string().describe('Detailed description/review content'),
      appName: z.string().describe('Name of the app/product'),
      productUrl: z.string().describe('Product website URL'),
      pricing: z.string().optional().describe('Pricing info (e.g. "Free", "$9/mo")'),
      appDescription: z.string().optional().describe('Short app description'),
      launchDate: z.string().optional().describe('Launch date (ISO string)'),
      tags: z.array(z.string()).optional().describe('Tags'),
      status: z.enum(['draft', 'published']).optional().describe('Status (default: draft)'),
      isAiGenerated: z.boolean().optional().describe('Is it AI generated (default: true)'),
      systemArchitecture: z.string().optional().describe('Mermaid flowchart and architecture design (HTML)'),
      techStack: z.string().optional().describe('Tech stack table and explanations (HTML)'),
      dbSchema: z.string().optional().describe('Database schema code blocks (HTML)'),
      apiSpecs: z.string().optional().describe('API specifications code blocks (HTML)'),
      devPlan: z.string().optional().describe('Chronological developer implementation checklist (HTML)'),
    },
    async (params) => {
      try {
        const data = await api.post('/api/posts', {
          isAiGenerated: true,
          ...params,
          format: 'product',
        });
        const post = data.post;
        return {
          content: [{
            type: 'text',
            text: `🚀 Product launch post created!\n\n📱 App: ${params.appName}\n📝 Title: ${post.title}\n📋 Status: ${post.status}\n🆔 ID: ${post._id}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to create product launch: ${error.message}` }] };
      }
    }
  );
}

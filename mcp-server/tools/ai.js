import { z } from 'zod';

/**
 * AI Writing tools (6 tools) — all BlogWrite AI capabilities
 */
export function registerAiTools(server, api) {

  // ─── ai_generate_post ───
  server.tool(
    'ai_generate_post',
    'Generate a full blog post using AI. Specify a topic, tone, and length. Returns HTML content ready to use with create_post.',
    {
      topic: z.string().describe('Topic or subject for the blog post'),
      tone: z.enum(['professional', 'casual', 'technical', 'conversational', 'academic']).optional().describe('Writing tone (default: professional)'),
      length: z.enum(['short', 'medium', 'long']).optional().describe('Post length: short (~500 words), medium (~1200), long (~2500)'),
    },
    async ({ topic, tone, length }) => {
      try {
        const data = await api.post('/api/ai', {
          action: 'generate',
          topic,
          tone: tone || 'professional',
          length: length || 'medium',
        });
        return {
          content: [{
            type: 'text',
            text: `✅ Blog post generated about "${topic}"!\n\nYou can now use \`create_post\` to save it. Here's the content:\n\n---\n${data.content}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ AI generation failed: ${error.message}` }] };
      }
    }
  );

  // ─── ai_suggest_titles ───
  server.tool(
    'ai_suggest_titles',
    'Generate compelling title suggestions for blog content using AI.',
    {
      content: z.string().describe('Blog content to generate titles for'),
      count: z.number().optional().describe('Number of title suggestions (default: 5)'),
    },
    async ({ content, count }) => {
      try {
        const data = await api.post('/api/ai', {
          action: 'titles',
          content,
          count: count || 5,
        });
        const titles = data.titles || [];
        const list = titles.map((t, i) => `${i + 1}. ${t}`).join('\n');
        return {
          content: [{
            type: 'text',
            text: `✨ Title Suggestions:\n\n${list}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Title generation failed: ${error.message}` }] };
      }
    }
  );

  // ─── ai_generate_excerpt ───
  server.tool(
    'ai_generate_excerpt',
    'Generate a compelling excerpt/summary for blog content using AI.',
    {
      content: z.string().describe('Blog content to generate an excerpt for'),
    },
    async ({ content }) => {
      try {
        const data = await api.post('/api/ai', { action: 'excerpt', content });
        return {
          content: [{
            type: 'text',
            text: `📋 Generated Excerpt:\n\n"${data.excerpt}"`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Excerpt generation failed: ${error.message}` }] };
      }
    }
  );

  // ─── ai_generate_tags ───
  server.tool(
    'ai_generate_tags',
    'Auto-generate relevant tags/keywords from blog content using AI.',
    {
      content: z.string().describe('Blog content to generate tags for'),
    },
    async ({ content }) => {
      try {
        const data = await api.post('/api/ai', { action: 'tags', content });
        const tags = data.tags || [];
        return {
          content: [{
            type: 'text',
            text: `🏷️ Suggested Tags: ${tags.map(t => `\`${t}\``).join(', ')}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Tag generation failed: ${error.message}` }] };
      }
    }
  );

  // ─── ai_improve_writing ───
  server.tool(
    'ai_improve_writing',
    'Improve or rewrite existing content using AI with specific instructions.',
    {
      content: z.string().describe('Content to improve'),
      instruction: z.string().optional().describe('Specific improvement instructions (e.g. "make it more engaging", "add more examples", "simplify the language")'),
    },
    async ({ content, instruction }) => {
      try {
        const data = await api.post('/api/ai', {
          action: 'improve',
          content,
          instruction: instruction || 'Improve the writing quality',
        });
        return {
          content: [{
            type: 'text',
            text: `✅ Content improved!\n\n---\n${data.content}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Writing improvement failed: ${error.message}` }] };
      }
    }
  );

  // ─── ai_generate_cover_image ───
  server.tool(
    'ai_generate_cover_image',
    'Generate an AI cover image for a blog post. Returns a URL to the generated image uploaded to cloud storage. Available styles: modern, minimal, tech, illustration, abstract, cinematic, flat, 3d.',
    {
      topic: z.string().describe('Topic or description for the cover image'),
      style: z.enum(['modern', 'minimal', 'tech', 'illustration', 'abstract', 'cinematic', 'flat', '3d']).optional().describe('Visual style (default: modern)'),
    },
    async ({ topic, style }) => {
      try {
        const data = await api.post('/api/ai', {
          action: 'cover-image',
          topic,
          style: style || 'modern',
        });
        return {
          content: [{
            type: 'text',
            text: `🖼️ Cover image generated!\n\n🔗 URL: ${data.url}\n🎨 Style: ${style || 'modern'}\n\nYou can use this URL as the \`coverImage\` when creating or updating a post.`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Image generation failed: ${error.message}` }] };
      }
    }
  );
}

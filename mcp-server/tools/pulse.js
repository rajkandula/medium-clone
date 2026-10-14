import { z } from 'zod';

/**
 * Pulse (News) tools (3 tools)
 */
export function registerPulseTools(server, api) {

  // ─── get_pulse_articles ───
  server.tool(
    'get_pulse_articles',
    'Get the latest curated tech & education news from Pulse. Each article includes an AI-generated summary and key takeaways. Filter by topic (AI, Web Dev, Science, Startups, Security, Design, Programming, DevOps, Mobile, Data, Career, Open Source).',
    {
      topic: z.string().optional().describe('Filter by topic (e.g. "AI", "Web Dev", "Science")'),
      sort: z.enum(['newest', 'trending', 'most-saved']).optional().describe('Sort order (default: newest)'),
      page: z.number().optional().describe('Page number (default: 1)'),
      limit: z.number().optional().describe('Articles per page (default: 10)'),
    },
    async ({ topic, sort, page, limit }) => {
      try {
        const data = await api.get('/api/news', {
          topic: topic || undefined,
          sort: sort || 'newest',
          page: page || 1,
          limit: limit || 10,
        });
        const articles = data.articles || [];

        if (articles.length === 0) {
          return { content: [{ type: 'text', text: `📭 No Pulse articles found${topic ? ` for topic "${topic}"` : ''}.` }] };
        }

        const list = articles.map((a, i) => {
          const takeaways = a.keyTakeaways?.length > 0
            ? `\n   💡 AI Insight: ${a.keyTakeaways[0]}`
            : '';
          return `**${i + 1}. ${a.title}**\n   📰 ${a.sourceName} · ${a.topics?.join(', ') || 'General'}\n   ${a.summary || 'No summary available'}${takeaways}\n   🔗 ${a.sourceUrl}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `⚡ Pulse Articles (${data.total} total, page ${data.page}/${data.totalPages}):\n\nAvailable topics: ${(data.topics || []).join(', ')}\n\n${list}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load Pulse: ${error.message}` }] };
      }
    }
  );

  // ─── get_pulse_trending ───
  server.tool(
    'get_pulse_trending',
    'Get trending Pulse headlines — the most engaged news articles right now.',
    {
      limit: z.number().optional().describe('Number of trending articles (default: 10)'),
    },
    async ({ limit }) => {
      try {
        const data = await api.get('/api/news', {
          sort: 'trending',
          limit: limit || 10,
        });
        const articles = data.articles || [];

        if (articles.length === 0) {
          return { content: [{ type: 'text', text: '📭 No trending articles right now.' }] };
        }

        const list = articles.map((a, i) =>
          `${i + 1}. **${a.title}** — ${a.sourceName}\n   ${a.topics?.join(', ') || ''}\n   🔗 ${a.sourceUrl}`
        ).join('\n');

        return {
          content: [{
            type: 'text',
            text: `🔥 Trending on Pulse:\n\n${list}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load trending: ${error.message}` }] };
      }
    }
  );

  // ─── get_pulse_topics ───
  server.tool(
    'get_pulse_topics',
    'List all available Pulse news topics/categories.',
    {},
    async () => {
      try {
        const data = await api.get('/api/news', { limit: 1 });
        const topics = data.topics || [];
        return {
          content: [{
            type: 'text',
            text: `📰 Available Pulse Topics:\n\n${topics.map(t => `• ${t}`).join('\n')}\n\nUse these with \`get_pulse_articles\` to filter by topic.`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load topics: ${error.message}` }] };
      }
    }
  );
}

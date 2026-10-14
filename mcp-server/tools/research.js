import { z } from 'zod';

/**
 * Research Papers tools (3 tools)
 */
export function registerResearchTools(server, api) {

  // ─── get_research_papers ───
  server.tool(
    'get_research_papers',
    'Browse the latest academic research papers from arXiv. Filter by topic (AI, Computer Science, Machine Learning). Each paper includes title, authors, abstract, and source URL.',
    {
      topic: z.string().optional().describe('Filter by topic (e.g. "AI", "Computer Science", "Machine Learning")'),
      sort: z.enum(['newest', 'trending', 'most-saved']).optional().describe('Sort order (default: newest)'),
      page: z.number().optional().describe('Page number (default: 1)'),
      limit: z.number().optional().describe('Papers per page (default: 10)'),
    },
    async ({ topic, sort, page, limit }) => {
      try {
        const data = await api.get('/api/research', {
          topic: topic || undefined,
          sort: sort || 'newest',
          page: page || 1,
          limit: limit || 10,
        });
        const papers = data.papers || [];

        if (papers.length === 0) {
          return { content: [{ type: 'text', text: `📭 No research papers found${topic ? ` for topic "${topic}"` : ''}.` }] };
        }

        const list = papers.map((p, i) => {
          const authors = p.authors?.length > 0
            ? p.authors.slice(0, 3).join(', ') + (p.authors.length > 3 ? ` +${p.authors.length - 3} more` : '')
            : 'Unknown';
          const abstract = p.abstract
            ? (p.abstract.length > 200 ? p.abstract.substring(0, 200) + '...' : p.abstract)
            : '';
          return `**${i + 1}. ${p.title}**\n   👤 ${authors}\n   📂 ${(p.topics || []).join(', ') || 'General'}\n   ${abstract}\n   🔗 ${p.sourceUrl}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `🔬 Research Papers (${data.total || papers.length} total, page ${data.page}/${data.totalPages}):\n\nAvailable topics: ${(data.topics || []).join(', ')}\n\n${list}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load research papers: ${error.message}` }] };
      }
    }
  );

  // ─── get_trending_research ───
  server.tool(
    'get_trending_research',
    'Get the most trending research papers right now — based on saves, views, and shares.',
    {
      limit: z.number().optional().describe('Number of trending papers (default: 10)'),
    },
    async ({ limit }) => {
      try {
        const data = await api.get('/api/research', {
          sort: 'trending',
          limit: limit || 10,
        });
        const papers = data.papers || [];

        if (papers.length === 0) {
          return { content: [{ type: 'text', text: '📭 No trending research papers right now.' }] };
        }

        const list = papers.map((p, i) =>
          `${i + 1}. **${p.title}**\n   ${p.authors?.[0] || p.sourceName} · ${(p.topics || []).join(', ')}\n   🔗 ${p.sourceUrl}`
        ).join('\n');

        return {
          content: [{
            type: 'text',
            text: `🔥 Trending Research:\n\n${list}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load trending research: ${error.message}` }] };
      }
    }
  );

  // ─── get_research_topics ───
  server.tool(
    'get_research_topics',
    'List all available research paper topics/categories.',
    {},
    async () => {
      try {
        const data = await api.get('/api/research', { limit: 1 });
        const topics = data.topics || [];
        return {
          content: [{
            type: 'text',
            text: `🔬 Available Research Topics:\n\n${topics.map(t => `• ${t}`).join('\n')}\n\nUse these with \`get_research_papers\` to filter.`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load topics: ${error.message}` }] };
      }
    }
  );
}

import { streamText, convertToModelMessages } from 'ai';
import { textModel } from '@/lib/aiProvider';
import { getSession } from '@/lib/auth';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, editorContext } = await req.json();

    const lastMessage = messages[messages.length - 1];
    const lastContent = typeof lastMessage?.content === 'string'
      ? lastMessage.content.trim().toLowerCase()
      : '';

    const isTopicRequest =
      lastContent === 'generate content ideas for my niche' ||
      lastContent.includes('niche content ideas') ||
      lastContent.includes('generate content ideas') ||
      lastContent.includes('brainstorm content ideas') ||
      lastContent.includes('suggest some topics') ||
      lastContent.includes('suggest topics');

    if (isTopicRequest) {
      const dbConnect = (await import('@/lib/db')).default;
      const SuggestedTopic = (await import('@/models/SuggestedTopic')).default;
      await dbConnect();

      // Fetch 6 random topics from DB using aggregate sample stage
      let topics = await SuggestedTopic.aggregate([{ $sample: { size: 6 } }]);

      if (!topics || topics.length === 0) {
        topics = [
          {
            topic: '10 Hidden CSS Features Every Frontend Developer Must Know in 2026',
            category: 'Web Development',
            tags: ['css', 'frontend', 'web-dev']
          },
          {
            topic: 'How AI Agents are Transforming Autonomous Coding and Software Engineering',
            category: 'AI & Machine Learning',
            tags: ['ai', 'machine-learning', 'software-eng']
          },
          {
            topic: 'Bootstrapping vs Fundraising: Choosing the Right Path for Your Startup',
            category: 'Startups & Business',
            tags: ['startups', 'business', 'saas']
          },
          {
            topic: 'The Art of Technical Writing: Documenting Code that People Actually Read',
            category: 'Career & Productivity',
            tags: ['career', 'productivity', 'writing']
          },
          {
            topic: 'Designing Systems for Accessibility Without Sacrificing Visual Aesthetics',
            category: 'Design & UX',
            tags: ['design', 'ux', 'a11y']
          },
          {
            topic: 'Understanding Climate Change: The Science Behind Global Warming',
            category: 'Science & Nature',
            tags: ['science', 'climate-change', 'education']
          }
        ];
      }

      let responseText = `Here are some fresh, highly engaging content ideas for your niche:\n\n`;
      topics.forEach((t, index) => {
        responseText += `${index + 1}. **${t.category}**\n   **"${t.topic}"**\n`;
        if (t.tags && t.tags.length > 0) {
          responseText += `   *Tags: ${t.tags.map(tag => `#${tag}`).join(', ')}*\n`;
        }
        responseText += `\n`;
      });
      responseText += `Would you like to draft a post for any of these? Just tell me what you want to write about, and I will help you start drafting!`;

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = responseText.split(/(\s+)/);
          for (const word of words) {
            const line = `0:${JSON.stringify(word)}\n`;
            controller.enqueue(encoder.encode(line));
            await new Promise(resolve => setTimeout(resolve, 8));
          }
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-vercel-ai-data-stream': 'v1',
        }
      });
    }

    const fmt = (editorContext?.format || 'richtext').toLowerCase();

    const FORMAT_GUIDE = {
      html: "ACTIVE FORMAT = HTML/CSS/JS. Output RAW HTML — semantic tags, inline <style>, and <script> where interactivity adds value. This format's superpower is interactive demos, custom layouts, data visualizations, SVG/canvas, and animated or styled components. Do NOT output markdown.",
      latex: "ACTIVE FORMAT = LaTeX. Output a LaTeX document body — \\section{}, \\subsection{}, math via $$...$$ or \\[...\\], \\begin{itemize}/\\begin{enumerate}, and tabular. This format's superpower is math-heavy, scientific, and academic writing. Do NOT output markdown or HTML.",
      markdown: "ACTIVE FORMAT = Markdown. Output PURE Markdown — do NOT emit raw HTML tags (no <h2>, <p>, <strong>, <em>, <br>); use #/##/### headings, **bold**, *italic*, - lists, tables, > quotes, and ![alt](url) images instead. Embed diagrams as Mermaid in a mermaid code fence; write math with $$...$$ (block) or $...$ (inline), which renders via KaTeX; use fenced code blocks ONLY for programming topics. This format's superpower is tutorials/explainers that MIX prose, diagrams, math, and tables in one post.",
      richtext: "ACTIVE FORMAT = Rich Text. Output clean semantic HTML (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>, <table>) — use HTML tags, NOT Markdown syntax (no ## or **). This format's superpower is straightforward, highly readable articles. Do NOT use <style> or <script>.",
    };

    const systemPrompt = `You are an expert AI Copilot helping a user write a blog post in the BlogWrite editor.

${FORMAT_GUIDE[fmt] || FORMAT_GUIDE.richtext}

MOST IMPORTANT RULE: when you draft or generate content, produce it in the ACTIVE FORMAT stated above — never a different one, and produce ONE consistent format (never mix raw HTML tags into Markdown, or Markdown syntax into HTML). The user selected this format on purpose, so honor it exactly.

Match the richest constructs the ACTIVE format allows to the topic:
- Flows, architecture, timelines, or step-by-step processes -> a Mermaid diagram inside a \`\`\`mermaid code fence (in Markdown), or an equivalent visual in HTML. CRITICAL Mermaid rules: node IDs must NOT contain spaces (use underscores); multi-word labels use bracket notation like NodeID["Display Label"]; separate statements with semicolons.
- Math or equations -> LaTeX/KaTeX: $$...$$ for block, $...$ for inline.
- Comparisons, specs, or structured data -> tables.
- Interactive or highly visual demos -> HTML/CSS/JS.
- Code -> fenced code blocks, ONLY for programming/technical topics; never dump code into a non-technical post.
If the topic would clearly be FAR better in a DIFFERENT format than the active one (e.g. a math-heavy post while in Rich Text, or an interactive demo while in Markdown), add a brief one-line suggestion to switch format at the very end — but still draft in the ACTIVE format unless the user switches.

Current editor content (continue or refine this if it is non-empty):
"""
${editorContext?.content || '(Empty)'}
"""

- Help brainstorm, outline, draft, or refine; be concise, professional, and creative.
- Do NOT wrap the whole response in a single code block unless explicitly asked.
- IMAGE GENERATION: you CAN generate images. When the user wants a picture/illustration/photo-like visual, output the marker [GENERATE_IMAGE: a detailed, vivid description including style, mood, colors, and composition]. You may include several; briefly describe each after its marker.
- Keep context: follow-up requests (images, edits, additions) must stay on the current topic.`;

    // Convert v3 UIMessages (parts-based) to ModelMessages (content-based) for streamText
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: textModel,
      system: systemPrompt,
      messages: modelMessages,
    });

    // Forward a meaningful error to the client instead of the SDK's default masked
    // "An error occurred." — streamText failures (e.g. a bad API key) happen INSIDE
    // the stream, so the try/catch below can't see them; this is where they surface.
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('Copilot stream error:', error);
        const msg = String(error?.message || error || '');
        if (/api[_ ]?key|credential|authentic|permission|unauthor|API_KEY_INVALID/i.test(msg)) {
          return 'AI service unavailable: the server API key is invalid or expired. Please contact the site admin.';
        }
        return 'The AI service failed to respond. Please try again in a moment.';
      },
    });
  } catch (error) {
    console.error('Copilot API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to stream response' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

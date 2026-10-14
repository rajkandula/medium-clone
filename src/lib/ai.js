import { generateText } from 'ai';
import { textModel as model } from '@/lib/aiProvider';

/**
 * Parse JSON from an LLM reply, tolerating markdown code fences and
 * surrounding prose (common with open-source models).
 */
function parseJsonLoose(text) {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Generate a full blog post from a topic
 */
export async function generateBlogPost(topic, tone = 'professional', length = 'medium') {
  const wordCount = length === 'short' ? 500 : length === 'medium' ? 1200 : 2500;
  const { text } = await generateText({
    model,
    prompt: `Write a ${tone} blog post about "${topic}". 
    
Requirements:
- Approximately ${wordCount} words
- Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags
- Include a compelling introduction
- Break content into clear sections with headings
- End with a thoughtful conclusion
- Make it engaging and informative
- Do NOT include the title or a main <h1> tag
- Do NOT wrap the entire content in any container tags
- Code Snippets & Technical Terms: Only use inline <code> tags for technical terms, class names, or inline code. Only include block code blocks (using <pre><code>...</code></pre>) if the topic is explicitly about programming, coding, or scripting. For non-programming topics, do NOT generate programming code snippet boxes.
- Visualizations & Diagrams: Based on the topic, if it would benefit from visualizations (such as math formulas, metrics, architecture, workflows, or system diagrams):
  * For math/metrics/equations, use KaTeX/LaTeX syntax wrapped in double dollar signs (e.g. $$ E = mc^2 $$) or single dollar signs for inline math.
  * For diagrams, system architecture, or workflows, use Mermaid syntax inside an HTML pre/code block labeled with the "language-mermaid" class. CRITICAL Mermaid rules: (1) Node IDs must NOT contain spaces — use underscores (e.g. Data_Plane, not Data Plane). (2) For multi-word display labels, use bracket notation: NodeID["Display Label"]. (3) Separate statements with semicolons. Example: <pre><code class="language-mermaid">graph TD; Git_Webhooks["Git Webhooks"]-->Code_Ingestion["Code Ingestion Worker"]; Code_Ingestion-->AST_Parser["AST & Semantic Parser"];</code></pre>.
  * For data metrics/comparisons, use simple HTML tables.`,
  });

  return text;
}

/**
 * Generate title suggestions for content
 */
export async function generateTitles(content, count = 5) {
  const { text } = await generateText({
    model,
    prompt: `Based on this blog content, suggest ${count} compelling, click-worthy titles.
Return them as a JSON array of strings. Only return the JSON array, no other text.

Content:
${content.substring(0, 2000)}`,
  });

  const parsed = parseJsonLoose(text);
  return Array.isArray(parsed) ? parsed : [text.trim()];
}

/**
 * Generate an excerpt/summary
 */
export async function generateExcerpt(content) {
  const { text } = await generateText({
    model,
    prompt: `Write a compelling 1-2 sentence excerpt/summary for this blog post. 
It should make readers want to click and read more.
Return only the excerpt text, nothing else.

Content:
${content.substring(0, 3000)}`,
  });

  return text.trim();
}

/**
 * Auto-generate tags from content
 */
export async function generateTags(content) {
  const { text } = await generateText({
    model,
    prompt: `Extract 3-6 relevant tags/keywords from this blog content.
Return them as a JSON array of lowercase strings. Only return the JSON array.

Content:
${content.substring(0, 2000)}`,
  });

  const parsed = parseJsonLoose(text);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Improve/edit existing writing
 */
export async function improveWriting(content, instruction = 'Improve the writing quality') {
  const { text } = await generateText({
    model,
    prompt: `${instruction}

Maintain the same HTML formatting. Return only the improved content.

Content:
${content}`,
  });

  return text;
}

/**
 * Generate a cover image for a blog post using a free open-source image model
 * Returns the base64-encoded image data
 */
const COVER_STYLES = {
  modern: {
    prompt: 'Clean, modern design with smooth gradients, geometric shapes, and a sleek tech aesthetic. Use cool blues, purples, and teals.',
    negative: 'text, words, letters',
  },
  minimal: {
    prompt: 'Minimalist design with lots of white space, simple line art, muted earthy tones (beige, sage, dusty rose). Elegant and understated.',
    negative: 'cluttered, busy, text',
  },
  tech: {
    prompt: 'Futuristic tech aesthetic with circuit patterns, neon accents on dark background, holographic elements, cyber vibes. Dark navy with electric blue and green accents.',
    negative: 'text, words',
  },
  illustration: {
    prompt: 'Hand-drawn editorial illustration style, warm colors, playful composition with organic shapes. Inspired by New Yorker magazine covers.',
    negative: 'photorealistic, text',
  },
  abstract: {
    prompt: 'Bold abstract art with large color blocks, dynamic composition, paint strokes, and vivid contrasts. Think Kandinsky meets modern design.',
    negative: 'realistic, text, words',
  },
  cinematic: {
    prompt: 'Cinematic wide-angle scene with dramatic lighting, golden hour atmosphere, depth of field. Moody and atmospheric.',
    negative: 'text, cartoon',
  },
  flat: {
    prompt: 'Flat design illustration with bold solid colors, simple vector-style shapes, no shadows. Bright and cheerful palette.',
    negative: 'photorealistic, gradients, text',
  },
  '3d': {
    prompt: '3D rendered scene with soft lighting, clay/plastic material look, pastel colors, isometric perspective. Playful and premium.',
    negative: 'flat, text, words',
  },
};

/**
 * Generate a cover image via Pollinations — free, no API key required.
 * Falls back across open-source models (flux → turbo).
 * Optional POLLINATIONS_API_KEY only raises the anonymous rate limits.
 */
export async function generateCoverImage(topic, style = 'modern') {
  const styleConfig = COVER_STYLES[style] || COVER_STYLES.modern;

  // Add randomization seed to prevent identical outputs
  const variations = [
    'Use warm tones as accent.',
    'Include subtle geometric patterns.',
    'Add depth with layered elements.',
    'Feature flowing organic curves.',
    'Use a diagonal composition.',
    'Include small decorative details.',
    'Use a centered symmetrical layout.',
    'Feature an asymmetric bold composition.',
  ];
  const randomVariation = variations[Math.floor(Math.random() * variations.length)];

  const prompt = `Blog cover image about: "${topic}". ${styleConfig.prompt} ${randomVariation} Wide 16:9 blog header, professional quality, high detail, unique and distinctive. No text, words, or letters anywhere. Avoid: ${styleConfig.negative}.`;

  const seed = Math.floor(Math.random() * 1_000_000);
  const params = `width=1280&height=720&nologo=true&seed=${seed}`;
  const headers = process.env.POLLINATIONS_API_KEY
    ? { Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}` }
    : {};

  for (const imageModel of ['flux', 'turbo']) {
    try {
      console.log(`[ImageGen] 🎨 Pollinations ${imageModel} | topic="${topic}" style="${style}"`);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}&model=${imageModel}`;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) });

      if (!res.ok) {
        console.warn(`[ImageGen] ⚠️ ${imageModel} returned HTTP ${res.status}, falling back...`);
        continue;
      }

      const mimeType = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 1000 || !mimeType.startsWith('image/')) {
        console.warn(`[ImageGen] ⚠️ ${imageModel} returned non-image data, falling back...`);
        continue;
      }

      console.log(`[ImageGen] ✅ Success with ${imageModel} (${mimeType}, ${buffer.length} bytes)`);
      return { data: buffer.toString('base64'), mimeType };
    } catch (err) {
      console.error(`[ImageGen] ❌ ${imageModel} failed: ${err.message || err}`);
    }
  }

  console.error('[ImageGen] 🚫 All image generation attempts failed');
  return null;
}


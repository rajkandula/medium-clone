import { generateText } from 'ai';
import { textModel as model } from '@/lib/aiProvider';
import Post from '@/models/Post';
import Series from '@/models/Series';
import { createSlug } from '@/lib/utils';


const MIN_POOL = 6;   // need at least this many published posts to attempt a path
const MIN_POSTS = 4;  // a path must have at least this many lessons
const MAX_POSTS = 8;  // ...and at most this many

/**
 * Build one AI-curated learning path from EXISTING published posts in a category.
 * The model only SELECTS and ORDERS posts — it never writes content.
 * Returns { created: <series> } or { skipped: <reason> }.
 */
export async function buildSeriesForCategory(categoryDoc, authorId) {
  if (!categoryDoc?._id) return { skipped: 'no category' };

  // One AI path per category — skip if we already built one.
  const existing = await Series.findOne({ category: categoryDoc._id, isAiGenerated: true });
  if (existing) return { skipped: `path already exists for ${categoryDoc.name}` };

  // Learning paths are built from educational posts only — exclude product/startup-concept showcases.
  const pool = await Post.find({ category: categoryDoc._id, status: 'published', format: { $ne: 'product' } })
    .select('_id title excerpt tags readTime coverImage')
    .sort({ publishedAt: -1 })
    .limit(40)
    .lean();

  if (pool.length < MIN_POOL) {
    return { skipped: `too few posts (${pool.length}) in ${categoryDoc.name}` };
  }

  const menu = pool
    .map((p, i) => `[${i + 1}] id=${p._id} — "${p.title}" — ${(p.excerpt || '').slice(0, 140)}`)
    .join('\n');

  let parsed;
  try {
    const { text } = await generateText({
      model,
      prompt: `You are curating a LEARNING PATH from an educational library. Below are published articles in the "${categoryDoc.name}" category. Select 4-8 of them and order them into a single coherent path that takes a learner from BEGINNER to ADVANCED. Put foundational/introductory pieces first and advanced/specialized ones last. Only use articles that genuinely belong together on one throughline — omit off-topic ones. Do NOT invent articles or ids.

Articles:
${menu}

Return ONLY valid JSON (no markdown, no code fences):
{
  "title": "A path title under 70 chars, e.g. 'Web Accessibility, End to End'",
  "description": "1-2 sentences on what the learner will master, under 300 chars",
  "level": "beginner" | "intermediate" | "advanced",
  "orderedPostIds": ["<id>", "<id>", ...]
}`,
    });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return { skipped: `parse failed: ${err.message}` };
  }

  // Anti-hallucination: keep only ids that actually exist in the pool, in the model's order, de-duped.
  const poolIds = new Set(pool.map((p) => p._id.toString()));
  const seen = new Set();
  const finalIds = (Array.isArray(parsed.orderedPostIds) ? parsed.orderedPostIds : [])
    .map(String)
    .filter((id) => poolIds.has(id) && !seen.has(id) && seen.add(id))
    .slice(0, MAX_POSTS);

  if (finalIds.length < MIN_POSTS) {
    return { skipped: `only ${finalIds.length} valid posts selected` };
  }

  const title = String(parsed.title || `${categoryDoc.name} — Learning Path`).trim().slice(0, 90);
  const level = ['beginner', 'intermediate', 'advanced'].includes(parsed.level) ? parsed.level : 'beginner';

  let slug = createSlug(title);
  if (await Series.findOne({ slug })) slug = `${slug}-${Date.now().toString(36)}`;

  // Reuse the first lesson's cover as the path cover (from the pool already in memory).
  const firstPost = pool.find((p) => p._id.toString() === finalIds[0]);

  const series = await Series.create({
    title,
    slug,
    description: String(parsed.description || '').trim().slice(0, 300),
    coverImage: firstPost?.coverImage || null,
    author: authorId,
    category: categoryDoc._id,
    level,
    tags: Array.isArray(firstPost?.tags) ? firstPost.tags.slice(0, 5) : [],
    posts: finalIds,
    postCount: finalIds.length,
    isAiGenerated: true,
    status: 'published',
    publishedAt: new Date(),
  });

  return { created: series };
}

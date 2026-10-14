import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { textModel as model } from '@/lib/aiProvider';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';
import { generateCoverImage } from '@/lib/ai';
import { uploadFile } from '@/lib/upload';
import { createSlug } from '@/lib/utils';

export const maxDuration = 300;


async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user || user.role !== 'admin') return null;
  return user;
}

/**
 * POST /api/admin/automation/generate — AI content generator for admin
 * 
 * Supports two modes:
 * 1. "generate" — AI generates a full blog post from optional inputs
 * 2. "publish" — Saves the generated content as a post
 */
export async function POST(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { action } = body;

    if (action === 'generate') {
      return handleGenerate(body, admin);
    }

    if (action === 'publish') {
      return handlePublish(body, admin);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate content with AI — all fields optional
 */
async function handleGenerate(body, admin) {
  const {
    topic,        // Optional — AI picks if blank
    tone = 'professional',
    length = 'medium',
    format = 'richtext',
    tags,         // Optional
    generateImage = true,
    imageStyle = 'modern',
    customPrompt, // Optional — free-form instruction
  } = body;

  const wordCount = length === 'short' ? 500 : length === 'medium' ? 1200 : 2500;

  // Step 1: If no topic, ask AI to pick a trending one
  let finalTopic = topic;
  let topicReasoning = '';

  if (!finalTopic) {
    const topicResult = await generateText({
      model,
      prompt: `You are an expert blog content strategist. Pick ONE specific, trending, and compelling blog topic for today.

Consider what's hot in tech, AI, web development, startups, design, or productivity RIGHT NOW (${new Date().toLocaleDateString()}).

Return ONLY a valid JSON object:
{
  "topic": "The specific topic as a sentence",
  "reasoning": "Why this topic is good for today — 1 sentence",
  "category": "The broad category (e.g. AI, Web Dev, Career, Startups, Design, DevOps)"
}`,
    });

    try {
      const cleaned = topicResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      finalTopic = parsed.topic;
      topicReasoning = parsed.reasoning;
    } catch {
      finalTopic = 'The latest trends in AI and software development';
      topicReasoning = 'Fallback topic — AI topic parsing failed';
    }
  }

  // Step 2: Generate content + metadata in parallel
  const contentPrompt = customPrompt
    ? `${customPrompt}\n\nTopic: "${finalTopic}"\n\nWrite approximately ${wordCount} words using HTML formatting (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags). No <h1> or wrapper tags. Code Snippets: Only use inline <code> tags for technical terms. Only include block code blocks (<pre><code>) if the topic is explicitly about coding. Visualizations: Use KaTeX ($$, $) for math, Mermaid (<pre><code class="language-mermaid">) for system/flow diagrams (CRITICAL: node IDs must NOT contain spaces, use underscores and bracket notation for display labels e.g. Data_Plane["Data Plane"]), HTML tables for metrics.`
    : `Write a high-quality, engaging ${tone} blog post about: "${finalTopic}"

Requirements:
- Approximately ${wordCount} words
- Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags
- Start with a compelling introduction
- Break content into 4-6 clear sections with <h2> headings
- End with a thoughtful conclusion
- Conversational but ${tone} tone
- Do NOT include a <h1> title or wrapper tags
- Code Snippets & Technical Terms: Only use inline <code> tags for technical terms, class names, or inline code. Only include block code blocks (using <pre><code>...</code></pre>) if the topic is explicitly about programming, coding, or scripting. For non-programming topics, do NOT generate programming code snippet boxes.
- Visualizations & Diagrams: Based on the topic, if it would benefit from visualizations (such as math formulas, metrics, architecture, workflows, or system diagrams):
  * For math/metrics/equations, use KaTeX/LaTeX syntax wrapped in double dollar signs (e.g. $$ E = mc^2 $$) or single dollar signs for inline math.
  * For diagrams, system architecture, or workflows, use Mermaid syntax inside an HTML pre/code block labeled with the "language-mermaid" class. CRITICAL Mermaid rules: (1) Node IDs must NOT contain spaces — use underscores (e.g. Data_Plane, not Data Plane). (2) For multi-word display labels, use bracket notation: NodeID["Display Label"]. (3) Separate statements with semicolons. Example: <pre><code class="language-mermaid">graph TD; Git_Webhooks["Git Webhooks"]-->Code_Ingestion["Code Ingestion Worker"];</code></pre>.
  * For data metrics/comparisons, use simple HTML tables.`;

  const [contentResult, metaResult] = await Promise.all([
    generateText({ model, prompt: contentPrompt }),
    generateText({
      model,
      prompt: `For a blog post about "${finalTopic}", generate metadata. Return ONLY valid JSON:
{
  "title": "Compelling title under 80 characters",
  "excerpt": "1-2 sentence description under 200 chars",
  "seoDescription": "SEO meta description under 155 chars",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4"]
}`,
    }),
  ]);

  let title, excerpt, seoDescription, suggestedTags;
  try {
    const cleaned = metaResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const meta = JSON.parse(cleaned);
    title = meta.title;
    excerpt = meta.excerpt;
    seoDescription = meta.seoDescription;
    suggestedTags = meta.suggestedTags || [];
  } catch {
    title = finalTopic;
    excerpt = `An in-depth look at ${finalTopic}`;
    seoDescription = `Learn about ${finalTopic}`;
    suggestedTags = [];
  }

  // Step 3: Generate cover image (optional)
  let coverImageUrl = null;
  if (generateImage) {
    try {
      const imageResult = await generateCoverImage(title, imageStyle);
      if (imageResult) {
        const buffer = Buffer.from(imageResult.data, 'base64');
        const ext = imageResult.mimeType.split('/')[1] || 'png';
        const uploaded = await uploadFile(buffer, `admin-gen-${Date.now()}.${ext}`, imageResult.mimeType, 'covers');
        coverImageUrl = uploaded.url;
      }
    } catch (imgErr) {
      console.error('[AdminGen] Cover image failed:', imgErr.message);
    }
  }

  return NextResponse.json({
    generated: {
      title,
      content: contentResult.text,
      excerpt: (excerpt || '').slice(0, 280),
      coverImage: coverImageUrl,
      tags: tags || suggestedTags,
      seoTitle: title,
      seoDescription: (seoDescription || '').slice(0, 160),
      format,
      topic: finalTopic,
      topicReasoning,
      imageStyle,
    },
  });
}

/**
 * Publish generated content as a post
 */
async function handlePublish(body, admin) {
  const { title, content, excerpt, coverImage, tags, seoTitle, seoDescription, format, status } = body;

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
  }

  let slug = createSlug(title);
  const existingSlug = await Post.findOne({ slug });
  if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;

  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const post = await Post.create({
    title,
    slug,
    content,
    excerpt,
    coverImage,
    author: admin._id,
    tags: tags || [],
    status: status || 'published',
    format: format || 'richtext',
    readTime,
    isAiGenerated: true,
    isFeatured: false,
    seoTitle,
    seoDescription,
    publishedAt: status === 'published' ? new Date() : undefined,
  });

  return NextResponse.json({
    post: {
      _id: post._id,
      title: post.title,
      slug: post.slug,
      status: post.status,
    },
  });
}

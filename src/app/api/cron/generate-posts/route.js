import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { textModel as model } from '@/lib/aiProvider';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';
import { estimateReadTime, createSlug } from '@/lib/utils';
import { generateCoverImage } from '@/lib/ai';
import { uploadFile } from '@/lib/upload';
import { getCronSecret } from '@/lib/cronAuth';
import Category from '@/models/Category';
import SuggestedTopic from '@/models/SuggestedTopic';

// Allow up to 5 minutes where the host honours maxDuration
export const maxDuration = 300;


/**
 * Topic categories with example prompts for variety
 */
const TOPIC_POOLS = [
  {
    category: 'AI & Machine Learning',
    tags: ['ai', 'machine-learning', 'technology'],
    topics: [
      'Latest breakthroughs in large language models and what they mean for developers',
      'How AI is transforming healthcare diagnostics in 2026',
      'Building responsible AI: ethics, bias, and fairness in machine learning',
      'AI agents and autonomous coding: the future of software engineering',
      'Edge AI: running machine learning models on mobile devices',
      'The rise of multimodal AI and its real-world applications',
      'AI in education: personalized learning at scale',
      'How small businesses can leverage AI without a data science team',
    ],
  },
  {
    category: 'Web Development',
    tags: ['web-dev', 'programming', 'frontend'],
    topics: [
      'Modern CSS features every developer should know in 2026',
      'Server components vs client components: when to use which',
      'Building blazing-fast websites with edge computing',
      'The evolution of JavaScript frameworks: what\'s next after React',
      'Web accessibility: building inclusive experiences from day one',
      'Progressive web apps: bridging the gap between web and native',
      'State management patterns for large-scale React applications',
      'API design best practices: REST, GraphQL, and tRPC compared',
    ],
  },
  {
    category: 'Career & Productivity',
    tags: ['career', 'productivity', 'growth'],
    topics: [
      'How to build a standout developer portfolio in 2026',
      'The art of technical writing: documenting code that people actually read',
      'Remote work productivity: systems and tools for deep focus',
      'Transitioning from developer to tech lead: lessons learned',
      'Building in public: why sharing your work accelerates growth',
      'The T-shaped developer: depth vs breadth in your tech stack',
      'Side projects that actually land you jobs',
      'How to give and receive code reviews that improve your team',
    ],
  },
  {
    category: 'Startups & Business',
    tags: ['startups', 'business', 'entrepreneurship'],
    topics: [
      'Bootstrapping vs fundraising: choosing the right path for your startup',
      'Product-led growth strategies for SaaS companies',
      'How to validate a startup idea before writing a single line of code',
      'The indie hacker movement: building profitable solo businesses',
      'Pricing strategies for software products: lessons from the top',
      'Open source business models that actually work',
      'Building a developer community around your product',
      'From idea to first 100 customers: a practical playbook',
    ],
  },
  {
    category: 'DevOps & Cloud',
    tags: ['devops', 'cloud', 'infrastructure'],
    topics: [
      'Container orchestration in 2026: Kubernetes vs serverless',
      'CI/CD pipelines that actually speed up your team',
      'Infrastructure as code: Terraform, Pulumi, or CDK?',
      'Monitoring and observability for modern applications',
      'Database scaling strategies: when to shard, replicate, or go serverless',
      'The cost of cloud: optimizing your cloud bill',
      'Zero-downtime deployments: strategies and patterns',
      'Security best practices for cloud-native applications',
    ],
  },
  {
    category: 'Design & UX',
    tags: ['design', 'ux', 'ui'],
    topics: [
      'Design systems: building consistency across products',
      'The psychology of user interfaces: why some apps feel magical',
      'Dark mode design: more than just inverting colors',
      'Microinteractions that delight users and boost engagement',
      'Mobile-first design principles that still matter',
      'Typography in web design: choosing fonts that work',
      'Color theory for developers: creating harmonious palettes',
      'Designing for accessibility without sacrificing aesthetics',
    ],
  },
  {
    category: 'Data & Security',
    tags: ['data', 'security', 'privacy'],
    topics: [
      'Data privacy in 2026: what developers need to know',
      'Building secure authentication systems from scratch',
      'SQL vs NoSQL: making the right database choice for your project',
      'Real-time data processing: streams, events, and pipelines',
      'Cybersecurity threats every developer should understand',
      'GDPR and data compliance: a developer-friendly guide',
      'Data visualization best practices for dashboards',
      'API security: preventing the OWASP top 10 vulnerabilities',
    ],
  },
  {
    category: 'Politics & Policy',
    tags: ['politics', 'policy', 'education'],
    topics: [
      'Understanding the legislative process: how a bill becomes a law',
      'The evolution of voting rights in modern democracies',
      'How education policy shapes economic mobility: a global comparison',
      'The role of local governments in public school funding',
      'Civic education: teaching the next generation about democracy',
      'International relations: a beginner\'s guide to diplomacy',
    ],
  },
  {
    category: 'Science & Nature',
    tags: ['science', 'space', 'education'],
    topics: [
      'The physics of black holes and the mysteries of deep space',
      'Understanding climate change: the science behind global warming',
      'The history of evolutionary biology: from Darwin to CRISPR',
      'Quantum computing explained simply for educators and students',
      'Oceanography: the unexplored frontier of marine ecosystems',
      'Renewable energy technologies: solar, wind, and geothermal science',
    ],
  },
  {
    category: 'Medical & Health Sciences',
    tags: ['medical', 'health', 'science', 'education'],
    topics: [
      'How the human immune system works to fight viruses',
      'Understanding vaccines: the science and history of immunization',
      'The basics of neuroscience: how neurons communicate',
      'Nutrition science: separating dietary facts from myths',
      'Mental health and the brain: the biology of stress and anxiety',
      'The future of medical technology: robotic surgery and gene editing',
    ],
  },
  {
    category: 'Fitness & Wellness',
    tags: ['fitness', 'gym', 'health', 'education'],
    topics: [
      'The physiology of muscle growth: how strength training works',
      'Cardiovascular endurance: the science of aerobic fitness',
      'The importance of recovery and sleep in athletic performance',
      'Designing an effective workout routine: a science-based guide',
      'Biomechanics: how to maintain proper form and prevent gym injuries',
      'Mindfulness, yoga, and meditation: practices for mental wellness',
    ],
  },
  {
    category: 'Economics & Finance',
    tags: ['finance', 'economics', 'education'],
    topics: [
      'Inflation, interest rates, and the economy: how they affect you',
      'Personal finance 101: budgeting, saving, and smart investing',
      'How supply and demand determine market prices',
      'The history of money: from barter systems to digital currencies',
      'Behavioral economics: why people make irrational financial decisions',
      'Global trade and tariffs: how the world economy is connected',
    ],
  },
  {
    category: 'Food & Cooking',
    tags: ['food', 'cooking', 'lifestyle'],
    topics: [
      'The science of flavor: why certain ingredients pair perfectly',
      'Meal prep for busy people: a practical weekly system',
      'A beginner\'s guide to fermentation: kimchi, kombucha, and sourdough',
      'Eating well on a budget: nutrition without the premium price',
      'Cuisines of the world: the stories behind iconic dishes',
    ],
  },
  {
    category: 'Travel & Culture',
    tags: ['travel', 'culture', 'lifestyle'],
    topics: [
      'How to travel more sustainably without sacrificing the experience',
      'Slow travel: why staying longer beats checking off destinations',
      'Cultural etiquette around the world every traveler should know',
      'Planning a trip on points and miles: a practical starter guide',
      'The rise of remote work and the digital nomad lifestyle',
    ],
  },
  {
    category: 'Personal Finance',
    tags: ['personal-finance', 'money', 'education'],
    topics: [
      'Building an emergency fund: how much you really need and why',
      'Index funds explained: a beginner\'s path to long-term investing',
      'Getting out of debt: proven strategies that actually work',
      'How to read a paycheck: taxes, deductions, and take-home pay',
      'Teaching kids about money: age-by-age financial literacy',
    ],
  },
  {
    category: 'Lifestyle & Home',
    tags: ['lifestyle', 'home', 'wellness'],
    topics: [
      'Building habits that stick: the science of behavior change',
      'Decluttering your space and your mind: a practical approach',
      'The case for a digital sunset: better sleep in a connected world',
      'Indoor plants for beginners: greenery that\'s hard to kill',
      'Designing a home workspace that actually boosts focus',
    ],
  },
  {
    category: 'Parenting & Education',
    tags: ['parenting', 'education', 'family'],
    topics: [
      'Screen time and kids: setting healthy boundaries that work',
      'How children actually learn to read: what the science says',
      'Raising resilient kids: teaching emotional regulation',
      'Choosing the right learning tools without the overwhelm',
      'Balancing work and parenting: systems for the daily juggle',
    ],
  },
];

/**
 * Pick N random topics ensuring variety across categories
 */
function pickTopics(count = 4) {
  // Shuffle categories
  const shuffled = [...TOPIC_POOLS].sort(() => Math.random() - 0.5);
  const picked = [];

  for (let i = 0; i < count && i < shuffled.length; i++) {
    const pool = shuffled[i];
    const topic = pool.topics[Math.floor(Math.random() * pool.topics.length)];
    picked.push({
      topic,
      tags: pool.tags,
      category: pool.category,
    });
  }

  return picked;
}

/**
 * Resolve a Category by name (case-insensitive), creating it lazily if missing,
 * so auto-generated posts actually appear on category pages instead of only
 * carrying tags. Returns the Category document (or null on failure).
 */
async function resolveOrCreateCategory(name) {
  const clean = (name || 'General').trim() || 'General';
  const slug = createSlug(clean);
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let category = await Category.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      { slug },
    ],
  });
  if (!category) {
    try {
      category = await Category.create({ name: clean, slug, color: '#f59e0b' });
    } catch {
      // Unique-index race: a concurrent create won — re-fetch.
      category = await Category.findOne({ slug });
    }
  }
  return category;
}

/**
 * Pick blog topics, preferring fresh AI-generated SuggestedTopics (drained oldest
 * first and marked used so they never repeat), topping up from the built-in pools
 * when the backlog runs dry. This connects the topic-generator pipeline to the
 * publisher and keeps content from recycling the same hardcoded list forever.
 */
async function pickTopicsFromDb(count) {
  if (count <= 0) return [];

  const docs = await SuggestedTopic.find({ used: { $ne: true } })
    .sort({ createdAt: 1 })
    .limit(count)
    .lean();

  const picks = docs.map(d => ({
    topic: d.topic,
    category: d.category,
    tags: Array.isArray(d.tags) && d.tags.length ? d.tags : [],
    _id: d._id,
  }));

  if (picks.length) {
    await SuggestedTopic.updateMany(
      { _id: { $in: picks.map(p => p._id) } },
      { $set: { used: true, usedAt: new Date() } }
    );
  }

  if (picks.length < count) {
    picks.push(...pickTopics(count - picks.length));
  }

  return picks;
}

/**
 * Generate a single blog post with AI
 */
async function generateFullPost(topicInfo) {
  const { topic, tags, category } = topicInfo;

  // 1. Generate blog content + metadata in parallel where possible
  // Generate content and metadata in a single combined call to save time
  const [contentResult, metaResult] = await Promise.all([
    // Full blog post content
    generateText({
      model,
      prompt: `Write a high-quality, engaging blog post about: "${topic}"
 
 Requirements:
 - Approximately 1200-1800 words
 - Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags
 - Start with a compelling introduction that hooks the reader
 - Break content into 4-6 clear sections with <h2> headings
 - Use data points, statistics, or real-world examples to support claims
 - End with a thoughtful conclusion and key takeaways
 - Make it genuinely educational and valuable — readers should learn something new
 - Write in a conversational but professional tone
 - Do NOT include the title or a main <h1> tag
 - Do NOT wrap the entire content in any container tags
 - Code Snippets & Technical Terms: Only use inline <code> tags for technical terms, class names, or inline code. Only include block code blocks (using <pre><code>...</code></pre>) if the topic is explicitly about programming, coding, or scripting. For non-programming topics, do NOT generate programming code snippet boxes.
 - Visualizations & Diagrams: Based on the topic, if it would benefit from visualizations (such as math formulas, metrics, architecture, workflows, or system diagrams):
    * For math/metrics/equations, use KaTeX/LaTeX syntax wrapped in double dollar signs (e.g. $$ E = mc^2 $$) or single dollar signs for inline math.
    * For diagrams, system architecture, or workflows, use Mermaid syntax inside an HTML pre/code block labeled with the "language-mermaid" class. CRITICAL Mermaid rules: (1) Node IDs must NOT contain spaces — use underscores (e.g. Data_Plane, not Data Plane). (2) For multi-word display labels, use bracket notation: NodeID["Display Label"]. (3) Separate statements with semicolons. Example: <pre><code class="language-mermaid">graph TD; Git_Webhooks["Git Webhooks"]-->Code_Ingestion["Code Ingestion Worker"]; Code_Ingestion-->AST_Parser["AST & Semantic Parser"];</code></pre>.
    * For data metrics/comparisons, use simple HTML tables.`,
    }),
    // Title + excerpt + SEO in ONE call
    generateText({
      model,
      prompt: `For a blog post about "${topic}", generate the following metadata. Return ONLY a valid JSON object:
{
  "title": "A compelling, click-worthy title under 80 characters",
  "excerpt": "A 1-2 sentence description under 200 characters",
  "seoDescription": "SEO meta description under 155 characters"
}

Rules:
- Title: specific, intriguing, uses power words
- Excerpt: makes readers want to click
- SEO: keyword-rich, descriptive
- Return ONLY the JSON, no markdown, no explanation`,
    }),
  ]);

  const content = contentResult.text;

  // Parse metadata
  let title, excerpt, seoDescription;
  try {
    const cleaned = metaResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const meta = JSON.parse(cleaned);
    title = meta.title;
    excerpt = meta.excerpt;
    seoDescription = meta.seoDescription;
  } catch {
    // Fallback if JSON parse fails
    title = topic;
    excerpt = `An in-depth look at ${topic}`;
    seoDescription = `Learn about ${topic} in this comprehensive guide.`;
  }

  // 2. Generate cover image (non-blocking — post is saved even if this fails)
  let coverImageUrl = null;
  try {
    const styles = ['modern', 'minimal', 'tech', 'illustration', 'abstract', 'cinematic', 'flat', '3d'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const imageResult = await generateCoverImage(title, randomStyle);
    
    if (imageResult) {
      const buffer = Buffer.from(imageResult.data, 'base64');
      const ext = imageResult.mimeType.split('/')[1] || 'png';
      const uploaded = await uploadFile(buffer, `auto-post-cover.${ext}`, imageResult.mimeType, 'covers');
      coverImageUrl = uploaded.url;
    }
  } catch (imgErr) {
    console.error('[AutoPost] Cover image failed (continuing without):', imgErr.message);
  }

  // 3. Fact-check + quality + "Further Reading" pass — the trust gate for
  // educational content. Never fabricate citations; a named source beats a fake link.
  let qualityScore = 70;
  let reviewNotes = '';
  let furtherReadingHtml = '';
  try {
    const review = await generateText({
      model,
      prompt: `You are a rigorous fact-checker and editor for an EDUCATIONAL platform. Review this blog post draft for factual accuracy, learning value, and clarity. Return ONLY a valid JSON object (no markdown, no code blocks):

Title: "${title}"
Draft (HTML): "${(content || '').slice(0, 6000)}"

{
  "qualityScore": an integer 0-100 for overall factual accuracy + educational value + clarity,
  "accuracyConcerns": "Short notes on any claims that are wrong, unsupported, outdated, or that need a source. Empty string if none.",
  "furtherReading": "An HTML <ul> of 3-5 reputable places to learn more. List sources by NAME (institutions, well-known publications, seminal books/authors, official organizations). Do NOT invent or guess URLs — only include a URL if it is a well-known official homepage you are certain of; otherwise just name the source. Format each as <li>Source name — what it covers</li>."
}

Rules:
- Be strict: penalize hallucinated facts, fabricated statistics, and confident claims that are actually uncertain.
- A qualityScore below 60 means the draft has real accuracy problems and must not be auto-published.
- NEVER fabricate URLs or citations. Naming a credible source is better than a fake link.
- Return ONLY the JSON.`,
    });
    const cleaned = review.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.qualityScore === 'number') {
      qualityScore = Math.max(0, Math.min(100, Math.round(parsed.qualityScore)));
    }
    reviewNotes = (parsed.accuracyConcerns || '').toString().trim().slice(0, 1000);
    const fr = (parsed.furtherReading || '').toString().trim();
    if (fr) {
      furtherReadingHtml = `<h2>Sources &amp; Further Reading</h2>${/^<ul/i.test(fr) ? fr : `<ul>${fr}</ul>`}`;
    }
  } catch (reviewErr) {
    console.error('[AutoPost] Fact-check pass failed (continuing):', reviewErr.message);
  }

  const finalContent = furtherReadingHtml ? `${content}\n${furtherReadingHtml}` : content;

  return {
    title,
    content: finalContent,
    excerpt: (excerpt || '').trim().slice(0, 280),
    coverImage: coverImageUrl,
    tags: [...new Set([...tags, ...category.toLowerCase().split(' & ').map(t => t.trim())])],
    seoTitle: title,
    seoDescription: (seoDescription || '').trim().slice(0, 160),
    qualityScore,
    reviewNotes,
  };
}

/**
 * Generate a product launch concept with AI
 */
async function generateProductLaunchConcept() {
  const categories = [
    'developer tools', 'design & creative', 'productivity', 'data & analytics',
    'health & fitness', 'fintech & personal finance', 'education & learning',
    'climate & sustainability', 'consumer & lifestyle', 'commerce & retail',
    'security & privacy', 'media & entertainment', 'travel & logistics',
    'science & research', 'gaming', 'robotics & hardware',
  ];
  const category = categories[Math.floor(Math.random() * categories.length)];

  const nameStyles = [
    'a single real dictionary word used in an unexpected way (like Loom, Amber, Beacon, Ledger)',
    'an invented or portmanteau word (like Figma, Zapier, Notion, Spotify)',
    'a short, evocative two-word compound',
    'a playful or slightly witty name',
    'a name inspired by nature, mythology, geography, or science',
  ];
  const nameStyle = nameStyles[Math.floor(Math.random() * nameStyles.length)];

  // Avoid names we've already used so the feed stays fresh and genuinely varied.
  const recentConcepts = await Post.find({ format: 'product', appName: { $exists: true, $nin: [null, ''] } })
    .select('appName').sort({ createdAt: -1 }).limit(60).lean();
  const takenNames = [...new Set(recentConcepts.map(p => p.appName).filter(Boolean))];

  // We request the model to return a detailed JSON object representing the product concept
  const result = await generateText({
    model,
    prompt: `Invent an original, innovative AI-powered product/startup concept in the "${category}" space.
Return ONLY a valid JSON object with the following structure:
{
  "appName": "An ORIGINAL, memorable product name — style it as ${nameStyle}. Be genuinely creative. STRICTLY AVOID the overused AI-startup clichés: do NOT use Neuro, Cogni, Cortex, Mind, Synap, Mesh, Thread, Weave, Sync, Flow, Sense, Pulse, Nexus, Quantum, Aether, Loom(as-is), or names ending in -AI/-GPT/-ly. Do NOT reuse or lightly vary any already-used name from this list: ${takenNames.length ? takenNames.join(', ') : '(none yet)'}",
  "title": "A compelling, click-worthy launch title (e.g., 'GitPulse: Real-time AI agent for codebase health monitoring')",
  "appDescription": "A sleek, professional 1-sentence tagline under 150 characters",
  "pricing": "A realistic pricing model (e.g., 'Free', 'Freemium', '$12/month', '$49/seat')",
  "productUrl": "A mock/conceptual product website URL based on the name (e.g., 'https://gitpulse.ai')",
  "tags": ["${category}", "ai", "launch"],
  "excerpt": "A short, exciting overview (1-2 sentences) under 250 characters that summarizes why this product is a game-changer.",
  "seoDescription": "SEO meta description under 155 characters",
  "content": "A detailed, professionally formatted HTML presentation of the product. Use proper HTML tags (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>). The content MUST include: 1. <h2>The Problem</h2>: A detailed description of the pain point. 2. <h2>The Solution & Key Features</h2>: A detailed description of the AI-powered solution and 3-4 key features with explanations.",
  "systemArchitecture": "A comprehensive description of the system architecture, component layout, and data flow. Use proper HTML tags (<h2>, <h3>, <p>). Include a visual system architecture diagram using Mermaid syntax wrapped in an HTML code block. CRITICAL Mermaid rules: Node IDs must NOT contain spaces — use underscores. For multi-word display labels use bracket notation: NodeID[\\\"Display Label\\\"]. Separate statements with semicolons. Example: <pre><code class=\\\"language-mermaid\\\">graph TD; Client[\\\"Client App\\\"]-->Gateway[\\\"API Gateway\\\"]; Gateway-->AI_Service[\\\"AI Service\\\"]; AI_Service-->DB[\\\"Database\\\"];</code></pre>.",
  "techStack": "A detailed technology selection explanation. Use proper HTML tags (<h2>, <p>). Include a clean HTML table displaying the chosen technologies for Frontend, Backend, AI/ML Infrastructure, Database, and Deployment/Hosting (e.g., columns Layer, Tech Stack, Rationale).",
  "dbSchema": "A detailed database design and schemas. Use proper HTML tags (<h2>, <p>). Provide mock schemas (SQL DDL or MongoDB mongoose schemas) needed to actually develop this product, formatted inside <pre><code> blocks.",
  "apiSpecs": "A detailed REST/GraphQL API specification. Use proper HTML tags (<h2>, <p>). Provide primary API endpoints (URI, Method, Request/Response payload examples) formatted inside <pre><code> blocks.",
  "devPlan": "A step-by-step developer checklist and milestones. Use proper HTML tags (<h2>, <p>, <ul>, <li>). Provide 4-5 key milestones and detailed checklist items to go from scratch to building the MVP."
}

Ensure the idea is highly detailed, realistic, and sounds like a premium developer-ready specifications document. The name AND the core premise must be clearly DIFFERENT from every already-used concept above — invent something new, not another variation. Return ONLY the raw JSON, no markdown code blocks, no explanation.`,
  });

  let product;
  try {
    const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    product = JSON.parse(cleaned);
  } catch (err) {
    console.error('[AutoPost] Product JSON parsing failed, using fallback.', err);
    // Fallback product concept if AI output fails JSON parsing
    const name = `AI-Launch-${Math.floor(Math.random() * 1000)}`;
    product = {
      appName: name,
      title: `Launching ${name}: Next-generation smart automation platform`,
      appDescription: 'Automate your repetitive daily workflows with an agentic AI sidekick.',
      pricing: 'Freemium',
      productUrl: `https://${name.toLowerCase()}.ai`,
      tags: [category, 'ai', 'launch'],
      excerpt: `Discover ${name}, a new approach to autonomous task execution that saves teams hours of manual effort.`,
      seoDescription: `Launch of ${name}, the next-generation smart automation platform.`,
      content: `<h2>The Problem</h2><p>Modern teams waste hours on repetitive manual workflows.</p><h2>The Solution & Key Features</h2><ul><li>Autonomous Agents</li><li>Seamless Integrations</li></ul>`,
      systemArchitecture: `<h2>System Design & Architecture</h2><p>Here is a basic flow:</p><pre><code class="language-mermaid">graph TD; Client-->Agent; Agent-->Database;</code></pre>`,
      techStack: `<h2>Core Technology Stack</h2><table><thead><tr><th>Layer</th><th>Tech Stack</th></tr></thead><tbody><tr><td>Frontend</td><td>Next.js, Tailwind CSS</td><td>Sleek and interactive dashboard</td></tr><tr><td>Backend</td><td>FastAPI, Node.js</td><td>Fast asynchronous processing</td></tr></tbody></table>`,
      dbSchema: `<h2>Database Schema</h2><pre><code>const userSchema = new mongoose.Schema({ email: String });</code></pre>`,
      apiSpecs: `<h2>API Specifications</h2><pre><code>POST /api/v1/agents - Create an agent</code></pre>`,
      devPlan: `<h2>Implementation Guide</h2><ul><li>Milestone 1: Project Setup</li><li>Milestone 2: Agent Engine</li></ul>`,
    };
  }

  // Generate cover image
  let coverImageUrl = null;
  try {
    const styles = ['modern', 'minimal', 'tech', 'illustration', 'abstract', 'cinematic', 'flat', '3d'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const imageResult = await generateCoverImage(product.appName + " " + product.appDescription, randomStyle);
    
    if (imageResult) {
      const buffer = Buffer.from(imageResult.data, 'base64');
      const ext = imageResult.mimeType.split('/')[1] || 'png';
      const uploaded = await uploadFile(buffer, `auto-product-cover.${ext}`, imageResult.mimeType, 'covers');
      coverImageUrl = uploaded.url;
    }
  } catch (imgErr) {
    console.error('[AutoPost] Product cover image failed:', imgErr.message);
  }

  return {
    ...product,
    coverImage: coverImageUrl,
    format: 'product',
  };
}

/**
 * POST /api/cron/generate-posts
 * Auto-generate 3-5 blog posts on trending/useful topics
 */
export async function POST(req) {
  const startedAt = new Date();

  try {
    // Verify CRON secret
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '') || searchParams.get('secret') || req.headers.get('x-cron-secret');
    const expectedSecret = getCronSecret();

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isManual = searchParams.get('manual') === 'true';
    const triggeredByUserId = req.headers.get('x-triggered-by') || null;

    await dbConnect();

    // Check if pipeline is enabled
    const AutomationConfig = (await import('@/models/AutomationConfig')).default;
    const CronLog = (await import('@/models/CronLog')).default;

    // Global emergency stop — halts ALL pipelines (scheduled AND manual) until an admin resumes.
    const { isAutomationPaused } = await import('@/lib/automationGate');
    if (await isAutomationPaused()) {
      await CronLog.create({
        type: 'generate-posts', status: 'skipped',
        stats: { attempted: 0, succeeded: 0, failed: 0 }, details: [],
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: isManual ? 'manual' : 'cron', startedAt, completedAt: new Date(),
        errorMessage: 'All automation paused by admin',
      });
      return NextResponse.json({ skipped: true, reason: 'All automation is paused by admin' });
    }

    const config = await AutomationConfig.findOne({ type: 'generate-posts' });
    if (config && !config.enabled && !isManual) {
      // Log as skipped
      await CronLog.create({
        type: 'generate-posts',
        status: 'skipped',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        details: [],
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: 'cron',
        startedAt,
        completedAt: new Date(),
      });
      return NextResponse.json({ skipped: true, reason: 'Pipeline is paused' });
    }

    // Find the admin/system user to author posts under
    const adminEmail = process.env.ADMIN_EMAILS?.split(',')[0]?.trim();
    let author = await User.findOne({ email: adminEmail });
    
    if (!author) {
      author = await User.findOne({ role: 'admin' });
    }
    if (!author) {
      author = await User.findOne({});
    }
    if (!author) {
      return NextResponse.json({ error: 'No author found to publish under' }, { status: 500 });
    }

    // Determine number of products to generate (1 or 2)
    let productCount = 1 + Math.floor(Math.random() * 2);
    // Determine number of blog posts (total count minus products, min 1)
    const totalDesired = config?.settings?.postCount || (3 + Math.floor(Math.random() * 3));
    let blogCount = Math.max(1, totalDesired - productCount);

    if (isManual) {
      const blogsParam = searchParams.get('blogs');
      const productsParam = searchParams.get('products');
      if (blogsParam !== null) blogCount = parseInt(blogsParam, 10);
      if (productsParam !== null) productCount = parseInt(productsParam, 10);
    }
    // Hard per-run ceiling so a misconfigured postCount or a manual ?blogs/?products
    // param can never run away on AI cost. Each blog = ~3 text calls + 1 image.
    const MAX_BLOGS_PER_RUN = 8;
    const MAX_PRODUCTS_PER_RUN = 3;
    blogCount = Math.max(0, Math.min(blogCount || 0, MAX_BLOGS_PER_RUN));
    productCount = Math.max(0, Math.min(productCount || 0, MAX_PRODUCTS_PER_RUN));

    const topicPicks = await pickTopicsFromDb(blogCount);

    console.log(`[AutoPost] Generating ${topicPicks.length} blog posts and ${productCount} product concepts...`);

    // Trust gate: AI content is a DRAFT by default (admin reviews & publishes).
    // Set settings.autoPublish=true to publish automatically — and then only posts
    // scoring >= settings.minQualityScore (default 75) go live; the rest stay drafts.
    const autoPublish = config?.settings?.autoPublish === true;
    const minQualityScore = Number(config?.settings?.minQualityScore ?? 75);

    const results = [];
    const logDetails = [];

    // 1. Generate regular blog posts
    for (const topicInfo of topicPicks) {
      try {
        console.log(`[AutoPost] Generating blog post: "${topicInfo.topic}"`);
        
        const postData = await generateFullPost(topicInfo);

        // De-dup: skip topics we've already covered (a learning library should
        // cover a topic once, well — not republish near-identical posts).
        const slug = createSlug(postData.title);
        const existingSlug = await Post.findOne({ slug });
        if (existingSlug) {
          console.log(`[AutoPost] ⏭️  Skipped duplicate: "${postData.title}"`);
          logDetails.push({
            topic: topicInfo.topic,
            title: postData.title,
            category: topicInfo.category,
            reasoning: 'Skipped — a post with this slug/title already exists (de-duplicated).',
          });
          continue;
        }

        // Calculate read time
        const wordCount = postData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        // Resolve (or lazily create) the real Category so the post surfaces on
        // category pages — not just via tags.
        const categoryDoc = await resolveOrCreateCategory(topicInfo.category);

        // Trust gate: publish only if auto-publish is on AND the fact-check score
        // clears the bar; otherwise save as a draft for admin review.
        const willPublish = autoPublish && (postData.qualityScore ?? 0) >= minQualityScore;
        const finalStatus = willPublish ? 'published' : 'draft';

        // Save to DB
        const post = await Post.create({
          title: postData.title,
          slug,
          content: postData.content,
          excerpt: postData.excerpt,
          coverImage: postData.coverImage,
          author: author._id,
          category: categoryDoc?._id,
          tags: postData.tags,
          status: finalStatus,
          format: 'richtext',
          readTime,
          isAiGenerated: true,
          isFeatured: false,
          seoTitle: postData.seoTitle,
          seoDescription: postData.seoDescription,
          qualityScore: postData.qualityScore,
          reviewNotes: postData.reviewNotes,
          publishedAt: finalStatus === 'published' ? new Date() : null,
        });

        if (categoryDoc) {
          await Category.updateOne({ _id: categoryDoc._id }, { $inc: { postsCount: 1 } });
        }

        results.push({
          id: post._id,
          title: post.title,
          slug: post.slug,
          tags: post.tags,
          hasCover: !!post.coverImage,
        });

        logDetails.push({
          topic: topicInfo.topic,
          title: post.title,
          postId: post._id,
          category: topicInfo.category,
          tags: postData.tags,
          hasCoverImage: !!post.coverImage,
          qualityScore: postData.qualityScore,
          status: finalStatus,
          reasoning: `${finalStatus === 'published' ? 'Published' : 'Saved as draft for review'} — quality score ${postData.qualityScore}/100${postData.reviewNotes ? `. Notes: ${postData.reviewNotes}` : ''}`,
        });

        console.log(`[AutoPost] ${finalStatus === 'published' ? '✅ Published' : '📝 Draft'} Blog Post: "${post.title}" (score ${postData.qualityScore})`);
      } catch (postErr) {
        console.error(`[AutoPost] ❌ Blog Post failed: "${topicInfo.topic}" — ${postErr.message}`);
        results.push({ topic: topicInfo.topic, error: postErr.message });
        logDetails.push({
          topic: topicInfo.topic,
          category: topicInfo.category,
          error: postErr.message,
          reasoning: `Failed during generation — ${postErr.message}`,
        });
      }
    }

    // 2. Generate AI product concepts/launches
    for (let i = 0; i < productCount; i++) {
      try {
        console.log(`[AutoPost] Generating product launch concept ${i + 1}/${productCount}...`);
        const productData = await generateProductLaunchConcept();

        // Skip if a concept with this app name already exists (case-insensitive) — the model
        // still occasionally reaches for the same names (NeuroMesh, CogniThread, ...).
        if (productData.appName) {
          const nameEsc = String(productData.appName).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const dupName = await Post.findOne({ format: 'product', appName: { $regex: new RegExp(`^${nameEsc}$`, 'i') } });
          if (dupName) {
            console.log(`[AutoPost] ⏭️  Skipped duplicate concept name: "${productData.appName}"`);
            continue;
          }
        }

        // De-dup startup concepts by slug/title too.
        const slug = createSlug(productData.title);
        const existingSlug = await Post.findOne({ slug });
        if (existingSlug) {
          console.log(`[AutoPost] ⏭️  Skipped duplicate concept: "${productData.title}"`);
          continue;
        }

        // Calculate read time
        const wordCount = productData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        // Startup concepts get their own category so they surface on category pages too.
        const categoryDoc = await resolveOrCreateCategory('Startup Concepts');

        // Startup concepts are clearly-labeled fictional ideas, so they skip the
        // fact-check gate but still honor the auto-publish/draft setting.
        const finalStatus = autoPublish ? 'published' : 'draft';

        // Save product concept to DB
        const post = await Post.create({
          title: productData.title,
          slug,
          content: productData.content,
          excerpt: productData.excerpt,
          coverImage: productData.coverImage,
          author: author._id,
          category: categoryDoc?._id,
          tags: productData.tags,
          status: finalStatus,
          format: 'product',
          readTime,
          isAiGenerated: true,
          isFeatured: false,
          seoTitle: productData.title,
          seoDescription: productData.seoDescription,
          appName: productData.appName,
          appDescription: productData.appDescription,
          pricing: productData.pricing,
          productUrl: productData.productUrl,
          launchDate: new Date(),
          publishedAt: finalStatus === 'published' ? new Date() : null,
          systemArchitecture: productData.systemArchitecture,
          techStack: productData.techStack,
          dbSchema: productData.dbSchema,
          apiSpecs: productData.apiSpecs,
          devPlan: productData.devPlan,
        });

        if (categoryDoc) {
          await Category.updateOne({ _id: categoryDoc._id }, { $inc: { postsCount: 1 } });
        }

        results.push({
          id: post._id,
          title: post.title,
          slug: post.slug,
          tags: post.tags,
          hasCover: !!post.coverImage,
          isProduct: true,
        });

        logDetails.push({
          topic: `Startup Concept: ${productData.appName}`,
          title: post.title,
          postId: post._id,
          category: 'Startup Concept',
          tags: productData.tags,
          hasCoverImage: !!post.coverImage,
          status: finalStatus,
          reasoning: `${finalStatus === 'published' ? 'Published' : 'Saved as draft for review'} — AI startup concept in "${productData.tags[0]}".`,
        });

        console.log(`[AutoPost] ${finalStatus === 'published' ? '✅ Published' : '📝 Draft'} Startup Concept: "${post.appName}"`);
      } catch (prodErr) {
        console.error(`[AutoPost] ❌ Product Concept generation failed — ${prodErr.message}`);
        results.push({ topic: 'Product Launch Concept', error: prodErr.message });
        logDetails.push({
          topic: 'Product Launch Concept',
          category: 'Startup Concept',
          error: prodErr.message,
          reasoning: `Failed during product concept generation — ${prodErr.message}`,
        });
      }
    }

    const completedAt = new Date();
    const succeeded = results.filter(r => r.id).length;
    const failed = results.filter(r => r.error).length;
    const attempted = topicPicks.length + productCount;

    // Log execution
    await CronLog.create({
      type: 'generate-posts',
      status: failed === 0 ? 'success' : succeeded === 0 ? 'failed' : 'partial',
      stats: { attempted, succeeded, failed, duplicates: 0 },
      details: logDetails,
      duration: completedAt.getTime() - startedAt.getTime(),
      triggeredBy: isManual ? 'manual' : 'cron',
      triggeredByUser: triggeredByUserId || undefined,
      startedAt,
      completedAt,
    });

    // Update config last run info
    if (config) {
      config.lastRunAt = completedAt;
      config.lastRunStatus = failed === 0 ? 'success' : succeeded === 0 ? 'failed' : 'partial';
      config.lastRunStats = { attempted, succeeded, failed };
      await config.save();
    }

    return NextResponse.json({
      success: true,
      authorName: author.name,
      stats: {
        attempted,
        published: succeeded,
        failed,
      },
      posts: results,
    });
  } catch (error) {
    console.error('[AutoPost] CRON error:', error);

    // Log failure
    try {
      const CronLog = (await import('@/models/CronLog')).default;
      await CronLog.create({
        type: 'generate-posts',
        status: 'failed',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        errorMessage: error.message,
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: 'cron',
        startedAt,
        completedAt: new Date(),
      });
    } catch {}

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Support GET for external schedulers
export async function GET(req) {
  return POST(req);
}


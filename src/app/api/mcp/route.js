import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/siteUrl';
import mongoose from 'mongoose';
import { getApiSession } from '@/lib/apiAuth';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import Category from '@/models/Category';
import NewsArticle from '@/models/NewsArticle';
import ResearchPaper from '@/models/ResearchPaper';
import Bookmark from '@/models/Bookmark';
import Comment from '@/models/Comment';
import User from '@/models/User';
import Follow from '@/models/Follow';
import Notification from '@/models/Notification';
import { generateBlogPost } from '@/lib/ai';

const APP_URL = SITE_URL;

// Public link for a published post; editor link for a draft (no public page yet).
function postLink(post) {
  return post.status === 'published'
    ? `${APP_URL}/blog/${post.slug}`
    : `${APP_URL}/dashboard/posts/${post._id}/edit`;
}

// Helper to resolve category input safely to an ObjectId
async function resolveCategory(categoryInput) {
  if (!categoryInput) {
    const techCat = await Category.findOne({ name: { $regex: /^Tech(nology)?$/i } });
    return techCat ? techCat._id : null;
  }
  
  const inputStr = String(categoryInput).trim();
  if (!inputStr) {
    const techCat = await Category.findOne({ name: { $regex: /^Tech(nology)?$/i } });
    return techCat ? techCat._id : null;
  }

  if (mongoose.isValidObjectId(inputStr)) {
    return inputStr;
  }

  const cat = await Category.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${inputStr}$`, 'i') } },
      { slug: inputStr.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
    ]
  });
  
  if (cat) {
    return cat._id;
  }

  const techCat = await Category.findOne({ name: { $regex: /^Tech(nology)?$/i } });
  return techCat ? techCat._id : null;
}

// Active SSE client connections mapped by sessionId
const activeSessions = new Map();

// Helper to generate CORS headers dynamically to support credentials and specific origins (e.g. Claude Web Client)
function getCorsHeaders(req) {
  const origin = req?.headers?.get('origin') || '*';
  const reqHeaders = req?.headers?.get('access-control-request-headers') || 'Content-Type, Authorization, x-api-key';

  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': reqHeaders,
  };

  if (origin && origin !== '*') {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

/**
 * Handle CORS preflight OPTIONS request
 */
export async function OPTIONS(req) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

/**
 * Handle incoming Server-Sent Events (SSE) connection from Claude
 * GET /api/mcp
 */
export async function GET(req) {
  try {
    // 1. Authenticate connection via the Authorization: Bearer (or x-api-key) header.
    // The API key is intentionally NOT accepted as a URL query param — keys in URLs
    // leak into proxy/server logs and browser history.
    const session = await getApiSession();
    const reqUrl = new URL(req.url);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide your API key via the Authorization: Bearer header.' },
        { status: 401, headers: getCorsHeaders(req) }
      );
    }
    const sessionId = reqUrl.searchParams.get('sessionId') || crypto.randomUUID();

    // 2. Setup streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Save the connection controller and session
        activeSessions.set(sessionId, { controller, session });

        // Send the absolute endpoint URI to POST client messages back to. The
        // session is cached server-side by sessionId, so no key is placed in the URL.
        const appUrl = reqUrl.origin;
        const endpointUri = `${appUrl}/api/mcp?sessionId=${sessionId}`;
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${endpointUri}\n\n`));

        // Keep-alive ping every 15 seconds
        const intervalId = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': ping\n\n'));
          } catch {
            clearInterval(intervalId);
            activeSessions.delete(sessionId);
          }
        }, 15000);

        // Cleanup on close
        req.signal.addEventListener('abort', () => {
          clearInterval(intervalId);
          activeSessions.delete(sessionId);
        });
      },
      cancel() {
        activeSessions.delete(sessionId);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        ...getCorsHeaders(req),
      },
    });
  } catch (err) {
    console.error('[MCP SSE] Connection error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: getCorsHeaders(req) });
  }
}

/**
 * Handle client messages (JSON-RPC requests)
 * POST /api/mcp?sessionId=xxx
 */
export async function POST(req) {
  try {
    const reqUrl = new URL(req.url);
    const sessionId = reqUrl.searchParams.get('sessionId');

    if (sessionId) {
      if (!activeSessions.has(sessionId)) {
        return NextResponse.json({ error: 'Invalid or expired sessionId' }, { status: 400, headers: getCorsHeaders(req) });
      }

      const activeSession = activeSessions.get(sessionId);

      // 1. Authenticate request: prefer the session validated during GET, fall back
      // to the Authorization/x-api-key header (never a URL query param).
      let session = activeSession?.session;
      if (!session) {
        session = await getApiSession();
      }

      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(req) });
      }

      const body = await req.json();
      const { method, params, id } = body;

      // 2. Route the JSON-RPC request to the respective handler
      let responseResult = null;
      let responseError = null;

      try {
        await dbConnect();
        responseResult = await handleMcpRequest(method, params, session.userId);
      } catch (handlerErr) {
        console.error('[MCP Handler Error - SSE]:', handlerErr.stack || handlerErr);
        responseError = { code: -32603, message: handlerErr.message };
      }

      // 3. Send response back to the client via their active SSE connection
      const controller = activeSession?.controller;
      if (controller) {
        const jsonRpcResponse = {
          jsonrpc: '2.0',
          id,
          ...(responseError ? { error: responseError } : { result: responseResult }),
        };
        
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(jsonRpcResponse)}\n\n`));
      }

      return NextResponse.json({ success: true }, { headers: getCorsHeaders(req) });
    } else {
      // 4. Streamable HTTP / Stateless POST request (header auth only)
      const session = await getApiSession();

      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(req) });
      }

      const body = await req.json();
      const { method, params, id } = body;

      let responseResult = null;
      let responseError = null;

      try {
        await dbConnect();
        responseResult = await handleMcpRequest(method, params, session.userId);
      } catch (handlerErr) {
        console.error('[MCP Handler Error - Stateless]:', handlerErr.stack || handlerErr);
        responseError = { code: -32603, message: handlerErr.message };
      }

      const jsonRpcResponse = {
        jsonrpc: '2.0',
        id,
        ...(responseError ? { error: responseError } : { result: responseResult }),
      };

      return NextResponse.json(jsonRpcResponse, { headers: getCorsHeaders(req) });
    }
  } catch (err) {
    console.error('[MCP POST] Handler error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500, headers: getCorsHeaders(req) });
  }
}

/**
 * Internal MCP JSON-RPC router mapping methods to BlogWrite queries
 */
async function handleMcpRequest(method, params, userId) {
  switch (method) {
    // Standard MCP Protocol handshake
    case 'initialize':
      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: { name: 'blogwrite', version: '1.0.0' },
      };

    case 'tools/list':
      return {
        tools: [
          {
            name: 'list_posts',
            description: "List the calling user's blog posts (most recent first). Returns each post's title, status and public URL — use it to find a post before linking or referencing it.",
            annotations: { title: 'List posts', readOnlyHint: true, openWorldHint: false },
            inputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['published', 'draft'] },
                limit: { type: 'number', default: 10 },
              },
            },
          },
          {
            name: 'create_post',
            description: "Create (or update+publish an existing same-title draft) a blog post, and return its URL. Use the 'format' parameter to declare the content engine:\n- 'markdown': standard markdown.\n- 'latex': math equations (wrap in $$...$$ for block, $...$ for inline).\n- 'html': raw HTML (stylesheets, layouts, SVG, canvas, script).\n- 'richtext': default, standard rich-text or plain text.\nSet status to 'published' to release immediately (returns a live link), or 'draft' to save. To create a Startup Concept card instead, use create_product_launch.",
            annotations: { title: 'Create blog post', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Title of the blog post' },
                content: { type: 'string', description: "The content body. For 'markdown', use raw markdown syntax. For 'latex', include LaTeX equations (e.g. $$E=mc^2$$). For 'html', write clean raw HTML. For 'richtext', write simple HTML or text." },
                format: { type: 'string', enum: ['richtext', 'markdown', 'html', 'latex'], default: 'richtext', description: 'Engine used to parse and render content' },
                category: { type: 'string', description: 'Category name or ID (e.g., Tech, Software)' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Comma separated list of tags' },
                status: { type: 'string', enum: ['published', 'draft'], default: 'draft', description: "Set to 'published' to make live immediately" },
                excerpt: { type: 'string', description: 'Brief 280-char summary of the post' },
                seoTitle: { type: 'string', description: 'Custom SEO title' },
                seoDescription: { type: 'string', description: 'Custom SEO description' },
              },
              required: ['title', 'content'],
            },
          },
          {
            name: 'create_product_launch',
            description: "Create a 'Startup Concept' post — a product/app card (name, URL, pricing, launch date) shown in the Startup Concepts section. Returns the post's URL.",
            annotations: { title: 'Create startup concept', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Launch post title' },
                content: { type: 'string', description: 'Detailed review or description of the product' },
                appName: { type: 'string', description: 'Name of the app or tool' },
                productUrl: { type: 'string', description: 'Website URL of the product' },
                pricing: { type: 'string', description: 'Pricing details (e.g. Free, $10/mo)' },
                appDescription: { type: 'string', description: 'One-liner pitch of the product' },
                launchDate: { type: 'string', description: 'Launch date in ISO format (YYYY-MM-DD)' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
                status: { type: 'string', enum: ['published', 'draft'], default: 'draft', description: "Set to 'published' to release immediately" },
              },
              required: ['title', 'content', 'appName', 'productUrl'],
            },
          },
          {
            name: 'get_pulse_news',
            description: 'Get the latest curated, educational Pulse articles (learning-focused, across many subjects — not breaking news), each with a summary and key takeaways.',
            annotations: { title: 'Get Pulse articles', readOnlyHint: true, openWorldHint: false },
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', default: 5 },
              },
            },
          },
          {
            name: 'get_research_papers',
            description: 'Get the latest curated research papers with AI-written summaries and key takeaways.',
            annotations: { title: 'Get research papers', readOnlyHint: true, openWorldHint: false },
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', default: 5 },
              },
            },
          },
        ],
      };

    case 'tools/call': {
      const { name, arguments: args } = params;
      
      if (name === 'list_posts') {
        const query = { author: userId };
        if (args?.status) query.status = args.status;
        const posts = await Post.find(query)
          .select('title slug status excerpt publishedAt createdAt format')
          .sort({ createdAt: -1 })
          .limit(Math.min(args?.limit || 10, 50))
          .lean();
        const list = posts.map(p => ({
          id: String(p._id),
          title: p.title,
          status: p.status,
          url: postLink(p),
          excerpt: p.excerpt || '',
          date: p.publishedAt || p.createdAt,
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(list, null, 2) }],
        };
      }

      if (name === 'create_post') {
        const titleStr = String(args?.title || 'Untitled').trim();
        const categoryId = await resolveCategory(args.category);
        const finalStatus = args.status || 'draft';

        // Check if a draft post with the same title already exists for this author
        // If it does, update/publish the draft instead of creating a duplicate post.
        const escapedTitle = titleStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingDraft = await Post.findOne({
          author: userId,
          title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') },
          status: 'draft'
        });

        let post;
        let isReusedDraft = false;
        if (existingDraft) {
          existingDraft.content = args.content;
          if (args.excerpt !== undefined) existingDraft.excerpt = args.excerpt;
          if (categoryId) existingDraft.category = categoryId;
          if (args.tags) existingDraft.tags = args.tags;
          existingDraft.status = finalStatus;
          if (args.seoTitle !== undefined) existingDraft.seoTitle = args.seoTitle;
          if (args.seoDescription !== undefined) existingDraft.seoDescription = args.seoDescription;
          if (args.format) existingDraft.format = args.format;
          
          if (finalStatus === 'published') {
            existingDraft.publishedAt = new Date();
          }
          await existingDraft.save();
          post = existingDraft;
          isReusedDraft = true;
        } else {
          // Generate unique slug
          let slug = titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const existingSlug = await Post.findOne({ slug });
          if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;

          post = await Post.create({
            title: titleStr,
            content: args.content,
            slug,
            author: userId,
            category: categoryId,
            tags: args.tags || [],
            status: finalStatus,
            format: args.format || 'richtext',
            excerpt: args.excerpt || '',
            seoTitle: args.seoTitle || '',
            seoDescription: args.seoDescription || '',
            publishedAt: finalStatus === 'published' ? new Date() : null,
          });
        }

        // Post-creation side-effects for published posts
        if (finalStatus === 'published') {
          await User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });
          
          // Notify all followers (non-blocking)
          Follow.find({ following: userId }).select('follower').lean()
            .then(async (follows) => {
              if (follows.length > 0) {
                const notifications = follows.map(f => ({
                  recipient: f.follower,
                  actor: userId,
                  type: 'new_post',
                  post: post._id,
                  message: 'published a new article',
                }));
                await Notification.insertMany(notifications).catch(err =>
                  console.error('MCP Follower notification error:', err.message)
                );
              }
            })
            .catch(err => console.error('MCP Follower query error:', err.message));
        }

        const link = postLink(post);
        return {
          content: [{ type: 'text', text: post.status === 'published'
            ? `✅ Published "${post.title}"\n🔗 ${link}`
            : `📝 Saved "${post.title}" as a draft (not public yet).\n🔗 Edit & publish: ${link}`
          }],
        };
      }

      if (name === 'create_product_launch') {
        const titleStr = String(args?.title || 'Untitled').trim();
        const categoryId = await resolveCategory(args.category);
        const finalStatus = args.status || 'draft';

        // Check if a draft post with the same title already exists for this author
        // If it does, update/publish the draft instead of creating a duplicate post.
        const escapedTitle = titleStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingDraft = await Post.findOne({
          author: userId,
          title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') },
          status: 'draft'
        });

        let post;
        let isReusedDraft = false;
        if (existingDraft) {
          existingDraft.content = args.content;
          if (categoryId) existingDraft.category = categoryId;
          if (args.tags) existingDraft.tags = args.tags;
          existingDraft.status = finalStatus;
          existingDraft.format = 'product';
          existingDraft.appName = args.appName;
          existingDraft.productUrl = args.productUrl;
          if (args.pricing !== undefined) existingDraft.pricing = args.pricing;
          if (args.appDescription !== undefined) existingDraft.appDescription = args.appDescription;
          existingDraft.launchDate = args.launchDate ? new Date(args.launchDate) : new Date();
          
          if (finalStatus === 'published') {
            existingDraft.publishedAt = new Date();
          }
          await existingDraft.save();
          post = existingDraft;
          isReusedDraft = true;
        } else {
          // Generate unique slug
          let slug = titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const existingSlug = await Post.findOne({ slug });
          if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;

          post = await Post.create({
            title: titleStr,
            content: args.content,
            slug,
            author: userId,
            category: categoryId,
            tags: args.tags || [],
            status: finalStatus,
            format: 'product',
            appName: args.appName,
            productUrl: args.productUrl,
            pricing: args.pricing || '',
            appDescription: args.appDescription || '',
            launchDate: args.launchDate ? new Date(args.launchDate) : new Date(),
            publishedAt: finalStatus === 'published' ? new Date() : null,
          });
        }

        // Post-creation side-effects for published posts
        if (finalStatus === 'published') {
          await User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });
          
          // Notify all followers (non-blocking)
          Follow.find({ following: userId }).select('follower').lean()
            .then(async (follows) => {
              if (follows.length > 0) {
                const notifications = follows.map(f => ({
                  recipient: f.follower,
                  actor: userId,
                  type: 'new_post',
                  post: post._id,
                  message: 'published a new article',
                }));
                await Notification.insertMany(notifications).catch(err =>
                  console.error('MCP Follower notification error:', err.message)
                );
              }
            })
            .catch(err => console.error('MCP Follower query error:', err.message));
        }

        const link = postLink(post);
        return {
          content: [{ type: 'text', text: post.status === 'published'
            ? `✅ Published Startup Concept "${post.title}" (${args.appName})\n🔗 ${link}`
            : `📝 Saved Startup Concept "${post.title}" (${args.appName}) as a draft.\n🔗 Edit & publish: ${link}`
          }],
        };
      }

      if (name === 'get_pulse_news') {
        const articles = await NewsArticle.find({ isApproved: true }).sort({ publishedAt: -1 }).limit(args?.limit || 5).lean();
        return {
          content: [{ type: 'text', text: JSON.stringify(articles, null, 2) }],
        };
      }

      if (name === 'get_research_papers') {
        const papers = await ResearchPaper.find({ isApproved: true }).sort({ publishedAt: -1 }).limit(args?.limit || 5).lean();
        return {
          content: [{ type: 'text', text: JSON.stringify(papers, null, 2) }],
        };
      }

      throw new Error(`Tool not found: ${name}`);
    }

    default:
      throw new Error(`Method not supported: ${method}`);
  }
}

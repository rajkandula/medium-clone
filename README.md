# BlogWrite

A blogging platform for people who write to teach: a multi-format editor, an AI co-writer that
runs on open-source models, a personalised reading feed, curated news and research digests,
AI-built learning paths, and an MCP server so AI assistants can read and write your blog.

Next.js 16 (App Router) · React 19 · MongoDB (Mongoose) · Tailwind CSS 4 · any S3-compatible
bucket for media · any OpenAI-compatible model endpoint (local Ollama by default).

## Features

**Writing**
- Five post formats: **Rich Text** (TipTap), **Markdown**, **LaTeX**, **HTML/CSS/JS** (code
  editor with live preview) and **Product Launch** (a structured showcase with up to six
  screenshots).
- KaTeX math, Mermaid diagrams, syntax-highlighted code and tables render in every format;
  rendered HTML is sanitised (`src/lib/sanitize.js`, `src/lib/mermaid-sanitize.js`).
- Drafts, publish/archive, pinned posts, cover images (upload or AI-generated), categories,
  tags, SEO title/description, reading time.

**AI co-writer** (`src/lib/ai.js`, `src/lib/aiProvider.js`)
- A streaming Copilot chat beside the editor that drafts in the post's active format.
- One-click full drafts, title suggestions, excerpts, tags, "improve this writing" and cover
  images (cover images come from the free Pollinations image service).
- Text generation uses **local Ollama by default** (`gpt-oss:20b`) or any OpenAI-compatible
  endpoint you configure, so with the defaults your drafts never leave your machine. AI cover
  images are the exception: their prompt is sent to Pollinations.

**Reading and discovery**
- Personalised home feed ranked by your reading behaviour, interests, recency, engagement
  (Wilson score) and who you follow (`src/lib/feed.js`).
- Explore, full-text search (MongoDB text index), likes, comments, bookmarks ("Saved Posts"),
  follows, notifications, related posts and a distraction-free reader view.
- **Pulse** (`/pulse`): an RSS digest of ~20 educational sources (`src/lib/newsSources.json`),
  filtered by the model to keep evergreen, teachable pieces, each with a summary and key
  takeaways.
- **Research**: recent arXiv papers across AI, CS, physics, biology, economics and engineering,
  summarised into plain-language takeaways.
- **Learn** (`/learn`): learning paths (series) the model assembles from existing published
  posts. It selects and orders posts; it never writes the lessons.
- **Startup Concepts**: a gallery of Product Launch posts with categories and votes.

**Profiles**
- Public profile pages (`/profile/<username>`) with two templates and configurable tabs
  (articles, about, projects, experience, social links, contact). The contact form lands in
  the writer's inbox (Dashboard → Messages).
- Per-post stats: views, likes, comments and bookmarks.

**Automation and admin**
- An in-process scheduler (`src/lib/internalCron.js`) fetches news and research, generates
  topic ideas, writes and fact-checks AI posts, and builds learning paths. Each pipeline can be
  paused, configured and triggered from **/admin/automation**, with run logs and a global
  pause switch.
- Admin console: users, posts, categories, contact messages, feedback and billing overview.

**AI assistants (MCP)**
- **Remote connector**: `/api/mcp` is a Model Context Protocol endpoint with OAuth (dynamic
  client registration, `/.well-known/oauth-authorization-server`). Add
  `<your site>/api/mcp` as a custom connector in an MCP-capable assistant and approve the
  connection; tools include listing and creating posts, product launches, Pulse news and
  research papers.
- **Local server** (`mcp-server/`): a stdio MCP server with ~30 tools (posts, AI writing,
  feed, Pulse, research, bookmarks, comments, search, profile) that talks to your instance
  with a personal API key from Dashboard → API Keys. See [MCP server](#mcp-server).

**Accounts and billing**
- Email + password accounts (JWT session cookie, bcrypt), password reset by email,
  "log out everywhere", per-IP rate limits on sign-up, sign-in and password reset (stored in
  MongoDB, so they hold across instances).
- Optional $1/month **Writer** plan through Stripe Checkout and webhooks. Without Stripe keys,
  "Upgrade" opens a built-in checkout simulator (no money moves), which is refused once Stripe
  is configured. Plan limits in `src/lib/stripe.js` are informational: the Writer plan is a
  profile badge and is not enforced on features today.

## Getting started

Requirements: Node.js 20.9+, a MongoDB database, and (for the AI features) either
[Ollama](https://ollama.com) running locally or another OpenAI-compatible endpoint.

```bash
npm install
cp .env.example .env.local     # then fill in MONGODB_URI and JWT_SECRET at least
ollama pull gpt-oss:20b        # optional: the default local model
npm run dev                    # http://localhost:3000
```

- Put your own address in `ADMIN_EMAILS` **before** signing up with it: that account becomes
  an admin and gets `/admin`.
- Without object storage, images under 2 MB are stored inline in the database; set the
  `STORAGE_*` variables for anything public.
- Without `HARAKUMO_API_KEY`, emails (welcome, password reset) are skipped with a warning.
- `npm test` runs the sanitiser tests (Vitest); `npm run lint` runs ESLint.

To run a production build anywhere Node runs:

```bash
npm run build
npm start
```

(`next start` prints a notice about the standalone output; it still serves the app. The
Dockerfile runs the standalone server directly.)

A `Dockerfile` is included (standalone output, port 8080):

```bash
docker build --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com -t blogwrite .
docker run --env-file .env.local -p 8080:8080 blogwrite
```

## Configuration

Everything is configured through environment variables; `.env.example` lists them all with
comments.

| Variable | Needed for |
| --- | --- |
| `MONGODB_URI` | Required. All data. |
| `JWT_SECRET` | Required. Session signing (32+ characters). |
| `NEXT_PUBLIC_APP_URL` | Links in emails, sitemap, OAuth metadata, MCP URL. Build-time. |
| `ADMIN_EMAILS` | Comma-separated addresses that become admins at sign-up. Empty by default. |
| `CRON_SECRET` | Scheduled jobs and admin "run now" triggers (16+ characters). |
| `ENABLE_INTERNAL_CRON` | `false` turns the in-process scheduler off on this instance. |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Local model (defaults: `http://localhost:11434/v1`, `gpt-oss:20b`). |
| `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Any other OpenAI-compatible endpoint; overrides Ollama. |
| `POLLINATIONS_API_KEY` | Optional; higher rate limits for AI cover images. |
| `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_ENDPOINT`, `STORAGE_PUBLIC_URL` | Media in any S3-compatible bucket. |
| `HARAKUMO_API_KEY` | Transactional email through Harakumo Mail. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_WRITER` | Optional paid Writer plan. |

### Scheduled jobs

When `CRON_SECRET` is set, the server runs these in-process (UTC):

| Job | When | What it does |
| --- | --- | --- |
| `fetch-news` | every 4 h | Pulls the RSS sources and keeps the educational pieces. |
| `fetch-research` | every 6 h | Pulls recent arXiv papers and summarises them. |
| `generate-topics` | 00:00 | Suggests new post topics. |
| `generate-posts` | 06:00, 18:00 | Writes, fact-checks and publishes AI posts and product concepts. |
| `generate-series` | Sun 03:00 | Builds learning paths from published posts. |

AI posts and learning paths are published under the first address in `ADMIN_EMAILS`, else the
first admin, else the first user in the database, so set `ADMIN_EMAILS` before the first run. Pause
any pipeline in `/admin/automation`, or set `ENABLE_INTERNAL_CRON=false`. The same jobs are
also plain endpoints (`GET`/`POST /api/cron/<job>` with `Authorization: Bearer <CRON_SECRET>`)
if you prefer an external scheduler.

## MCP server

`mcp-server/` is a small Node package (stdio transport) for desktop AI assistants:

```bash
cd mcp-server && npm install
BLOGWRITE_API_KEY=bw_... BLOGWRITE_URL=https://your-domain.com node index.js
```

Create the key in Dashboard → API Keys (the page also prints a ready-made config block). In an
assistant's MCP config, run `node /path/to/mcp-server/index.js` with those two variables in
its `env`.

## Run BlogWrite on Harakumo

BlogWrite is open source (MIT) and is published on [Nucleus](https://nucleus.harakumo.com/-/explore),
Harakumo's code home. Its emails already go through Harakumo Mail (`src/lib/email.js`, one
`HARAKUMO_API_KEY`).

BlogWrite is a Node server (Next.js standalone output, MongoDB, an in-process scheduler), so on
Harakumo it runs as a **server app** (Pro plan and up), not a static site.

1. **Create a project** at [harakumo.com/dashboard](https://harakumo.com/dashboard) → Projects → New project.
2. **Create an API key** (Settings → API keys) and add it to the project's environment as
   `HARAKUMO_API_KEY`, so password-reset and welcome emails are sent.
3. **Add the rest of the environment** (Project → Environment), from `.env.example`:
   - `MONGODB_URI`: a MongoDB database (include the database name in the path). **MongoDB is
     required for now**; BlogWrite stores all its data there.
   - `JWT_SECRET`: a long random string (`openssl rand -hex 32`).
   - `NEXT_PUBLIC_APP_URL`: your project's public URL, and `ADMIN_EMAILS` with your address.
   - Media storage: the S3-compatible `STORAGE_*` values. In production, images belong in a
     bucket, not inline in the database.
   - AI: a server has no local model, so set `AI_BASE_URL` (plus `AI_API_KEY` / `AI_MODEL`) to an
     OpenAI-compatible endpoint, or leave AI off and set `ENABLE_INTERNAL_CRON=false`.
   - Optional: `CRON_SECRET` for the scheduled jobs, and the Stripe variables for paid plans.
4. **Deploy** from a folder with the CLI, or ask your AI assistant with the Harakumo connector:

   ```bash
   npm i -g @harakumo/cli
   harakumo login --key <your API key>
   harakumo deploy <project id> .
   ```

   Every deploy is saved as a commit in the project's private Nucleus repo.

Notes:

- **Your MongoDB must accept the server's connections**: allow its address range, and use a
  database user limited to this database with a long password.
- **One scheduler per database**: if you run more than one instance against the same MongoDB,
  set `ENABLE_INTERNAL_CRON=false` on all but one.
- **Stripe webhooks** go to `<your site>/api/billing/webhook`.

## Project structure

```
src/
  app/                 pages (public site, /dashboard, /admin) and API routes (/api/*)
  components/          editor (TipTap, code editor, Copilot chat) and shared UI
  lib/                 auth, db, ai, feed ranking, storage/upload, email, sanitisers, scheduler
  models/              Mongoose models
  proxy.js             route protection (Next.js 16 proxy)
  instrumentation.js   starts the in-process scheduler
mcp-server/            stdio MCP server for desktop AI assistants
```

## License

[MIT](LICENSE) © 2026 Charan Raj Kandula

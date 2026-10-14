# BlogWrite decisions

One entry per decision that can be seen in the code and README. The public repository
starts with a single commit ("Initial open-source release", 2026-10-13), so the earlier
history of these choices is not recorded. Entries are dated 2026-10-13, the release, unless
noted. "Options" lists the realistic alternatives; "Why" gives the reasons stated in the
code comments and README, or what the code visibly gains.

## 2026-10-13: One Next.js 16 app for pages, API, MCP and jobs

- **Decided:** a single Next.js 16 App Router project (React 19) serves the pages, the JSON
  API under `/api`, the MCP endpoint and the scheduled pipelines, built as standalone output
  and shipped with a Dockerfile.
- **Options:** a separate API server and front end; serverless functions plus a hosted cron
  service.
- **Why:** one process to run and one environment to configure. The standalone output runs
  anywhere Node runs (`node server.js` on port 8080 in the Dockerfile), and the pipelines can
  call their handlers in-process.

## 2026-10-13: MongoDB with Mongoose for all state

- **Decided:** every collection, including rate-limit counters, OAuth codes, reset tokens,
  the automation switch and run logs, lives in one MongoDB database (23 models in
  `src/models/`).
- **Options:** a SQL database; a separate cache or key-value store for counters and tokens.
- **Why:** posts carry format-specific optional fields (Product Launch, startup concepts) and
  free-form settings (`Mixed`), search uses a MongoDB text index, and expiring records use
  TTL indexes, so one store covers everything. README: "MongoDB is required for now".

## 2026-10-13: Email and password sessions in a signed cookie, revocable by version

- **Decided:** email and password accounts only (`authProvider` allows just `local`), bcrypt
  hashes, an HS256 JWT in an httpOnly cookie for seven days, and a `tokenVersion` on the
  user that the token's `tv` claim must match.
- **Options:** server-side session rows; third-party sign-in providers; plain JWTs without
  revocation.
- **Why:** `src/proxy.js` can check the signature without touching the database (Mongoose
  stays out of the proxy bundle), while `getSession()` still lets a password reset or "log
  out everywhere" end every session by bumping one number.

## 2026-10-13: No secret fallbacks

- **Decided:** `JWT_SECRET` (32+ characters) and `CRON_SECRET` (16+) have no defaults in code;
  a missing or short value throws. `ADMIN_EMAILS` is empty by default.
- **Options:** development defaults that "just work".
- **Why:** the code comments say a weak, repository-committed fallback would silently sign
  tokens or accept cron calls with a publicly known value. Failing loudly is safer for an
  open-source project that strangers will deploy.

## 2026-10-13: Rate limits stored in MongoDB

- **Decided:** a fixed-window counter per action and IP, one document per window with a TTL
  index (`src/lib/rateLimit.js`), on sign-up, sign-in, forgot password and reset password.
- **Options:** an in-memory limiter; a separate cache service.
- **Why:** README: limits are stored in MongoDB "so they hold across instances", without
  adding another service.

## 2026-10-13: AI on any OpenAI-compatible endpoint, local Ollama by default

- **Decided:** all text generation goes through `@ai-sdk/openai-compatible`
  (`src/lib/aiProvider.js`). The default is a local Ollama server with the open model
  `gpt-oss:20b`; `AI_BASE_URL`, `AI_API_KEY` and `AI_MODEL` point it anywhere else.
- **Options:** a single hosted model provider with a paid API key.
- **Why:** README: with the defaults "your drafts never leave your machine", and no API key
  is needed. Any self-hosted or hosted endpoint that speaks the same API can be swapped in.

## 2026-10-13: Free cover images from Pollinations

- **Decided:** cover images come from the Pollinations image service, trying the `flux`
  model and then `turbo`; `POLLINATIONS_API_KEY` is optional and only raises rate limits.
- **Options:** a paid image API; no generated covers.
- **Why:** free and keyless, like the text defaults. The trade-off is stated in the README:
  the image prompt is sent to Pollinations, the one exception to "drafts stay local".

## 2026-10-13: Media in any S3-compatible bucket, inline images for local use

- **Decided:** uploads go to any S3-compatible bucket configured by generic `STORAGE_*`
  variables, with browser uploads using presigned URLs. Without a bucket, images up to 2 MB
  are stored inline as `data:` URLs.
- **Options:** a specific storage vendor's SDK and naming; local disk storage.
- **Why:** vendor-neutral configuration works with any S3-compatible provider, and a fresh
  local install works with zero storage setup. The README says to use a bucket for anything
  public.

## 2026-10-13: Transactional email through Harakumo Mail

- **Decided:** welcome, password-reset and subscription emails are sent with one
  `HARAKUMO_API_KEY` to Harakumo Mail's send endpoint (`src/lib/email.js`); without a key
  emails are skipped with a warning.
- **Options:** SMTP; another email API.
- **Why:** one server-side key and a plain `fetch`, no mail library. Skipping instead of
  failing keeps local installs usable, at the cost of reset links not being sent.

## 2026-10-13: Optional $1/month Writer plan on Stripe, with a simulator that cannot be abused

- **Decided:** Stripe Checkout in subscription mode plus signed webhooks, only when both
  `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID_WRITER` are set. Otherwise "Upgrade" opens a
  built-in checkout simulator. The simulator's success route answers 403 once Stripe is
  configured, and a Stripe error during checkout returns 502 instead of falling back to it.
- **Options:** require Stripe for every install; no billing at all.
- **Why:** self-hosters and demos can see the whole flow without a Stripe account, while a
  real deployment cannot be upgraded for free. Fixed while preparing the public copy: the
  simulator is limited to instances without Stripe.

## 2026-10-13: The Writer plan is a badge, not a gate

- **Decided:** `PLAN_LIMITS` in `src/lib/stripe.js` describes free and Writer limits, but no
  route enforces them.
- **Options:** enforce post, storage and AI-call limits per plan.
- **Why:** README: the limits "are informational: the Writer plan is a profile badge and is
  not enforced on features today". Enforcement is not built.

## 2026-10-13: An in-process scheduler, with plain HTTP endpoints as the alternative

- **Decided:** `src/instrumentation.js` starts a zero-dependency scheduler
  (`src/lib/internalCron.js`) that runs the five pipelines on fixed UTC hours, one at a time,
  by calling their route handlers in-process. The same handlers are `GET`/`POST
  /api/cron/<job>` endpoints protected by `CRON_SECRET`. `ENABLE_INTERNAL_CRON=false` turns
  the scheduler off.
- **Options:** an external cron service only; a job queue with separate background processes.
- **Why:** the code comment: no external scheduler is needed, it does not care which port
  the server bound, and jobs run sequentially because "the local model generates one thing
  at a time". README: run one scheduler per database.

## 2026-10-13: Admin control over automation

- **Decided:** each pipeline has an `enabled` flag and settings (`AutomationConfig`), a
  global pause (`AutomationState`) halts scheduled and manual runs, and every run is logged
  to `CronLog`, all managed in `/admin/automation`.
- **Options:** configuration through environment variables only.
- **Why:** AI pipelines cost time and model calls; an admin can stop everything at once and
  see what each run did and why.

## 2026-10-13: AI posts are drafts until they pass a fact-check gate

- **Decided:** generated posts go through a fact-check pass that returns a `qualityScore`,
  review notes and a "Further Reading" list. They are saved as drafts unless
  `settings.autoPublish` is true, and then only published with a score of at least
  `minQualityScore` (default 75). Startup concepts are labelled fictional, skip the
  fact-check and follow `autoPublish`.
- **Options:** publish everything the model writes; human review only, with no score.
- **Why:** the code comments call it a "trust gate" for an educational library: penalise
  fabricated facts, never invent citations, and keep low-scoring drafts for admin review.

## 2026-10-13: Learning paths select and order existing posts; they never write lessons

- **Decided:** the `generate-series` pipeline gives the model a menu of published posts in a
  category and accepts only an ordered list of their ids; ids not in the menu are dropped and
  a path needs 4 to 8 valid posts.
- **Options:** let the model write new lesson content for each path.
- **Why:** README: "It selects and orders posts; it never writes the lessons." The id filter
  is an explicit anti-hallucination step.

## 2026-10-13: Pulse keeps only evergreen, teachable pieces

- **Decided:** the news pipeline asks the model whether each RSS item is educational, hard
  news or controversial, and approves only educational items that are neither. A
  classification error rejects the item.
- **Options:** show every item from the feeds.
- **Why:** the prompt says the platform is for learning, "NOT a news site". Rejecting on
  error keeps unchecked items out.

## 2026-10-13: Sanitise rendered HTML; isolate HTML-format posts in a sandbox

- **Decided:** Markdown, Rich Text and LaTeX output passes through `sanitize-html` with an
  allow-list (`src/lib/sanitize.js`), covered by tests. HTML/CSS/JS posts are not sanitised
  but rendered in an iframe sandboxed without `allow-same-origin`.
- **Options:** sanitise everything, which would strip the scripts that make HTML posts
  useful; trust author HTML.
- **Why:** the code comment: `marked` does not sanitise and the LaTeX renderer passes raw
  HTML through, so every render boundary must be cleaned, while HTML embeds keep working
  without access to the site's origin.

## 2026-10-13: A remote MCP connector whose OAuth access token is an API key

- **Decided:** `/api/mcp` speaks MCP JSON-RPC over SSE or a stateless POST. Assistants
  connect with OAuth: dynamic client registration, mandatory PKCE S256, exact redirect URI
  matching, codes bound to their client, and a token endpoint that returns a new `bw_` API
  key. Keys are stored as SHA-256 hashes and accepted only in headers, never in URLs.
- **Options:** API keys pasted into the assistant's config only; JWT access tokens with
  refresh tokens.
- **Why:** the token route's comment: the MCP endpoint already validates Bearer API keys,
  so one credential type covers both paths and the user can revoke connector keys in the
  same API Keys page. Keys stay out of URLs because URLs leak into logs and history.

## 2026-10-13: A local stdio MCP server as a separate package

- **Decided:** `mcp-server/` is its own small Node package with 33 tools that call the HTTP
  API with a personal API key (`BLOGWRITE_API_KEY`, `BLOGWRITE_URL`).
- **Options:** only the remote connector.
- **Why:** desktop assistants that run local MCP servers can use BlogWrite without OAuth.
  As built, the routes that need a signed-in user (other than `/api/mcp`) accept only the
  session cookie, so this server's signed-in tools do not work yet (see SYSTEM-DESIGN.md).

## 2026-10-13: No realtime channel for readers and writers

- **Decided:** notifications are fetched when the dashboard loads; there are no WebSockets.
  The only streams are the co-writer response and the MCP SSE transport.
- **Options:** WebSocket or SSE push for notifications and comments.
- **Why:** not stated in the code. What is visible is the result: no extra connection state
  on the server for ordinary users.

## 2026-10-13: Open source under the MIT licence, vendor-neutral

- **Decided:** publish BlogWrite under the MIT licence (`LICENSE`), with
  every external service behind a generic environment variable (`STORAGE_*`, `AI_BASE_URL`,
  `HARAKUMO_API_KEY`, `STRIPE_*`) and a `.env.example` that contains only placeholders.
- **Options:** keep the code private; tie it to one hosting or storage provider.
- **Why:** README: BlogWrite is open source and published on Nucleus, Harakumo's code home,
  and runs "anywhere Node runs". Generic configuration lets people self-host with their own
  database, bucket and model.

## 2026-10-14: Project docs in docs/

- **Decided:** add `ARCHITECTURE.md`, `SYSTEM-DESIGN.md`, `DECISIONS.md` and
  `presentation.html`, written from the code, and leave `README.md` unchanged.
- **Options:** keep everything in the README.
- **Why:** Harakumo's Nucleus shows these four documents in every repository's Docs tab.

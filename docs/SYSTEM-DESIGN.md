# BlogWrite system design

How BlogWrite stores its data, how the main flows run, who may do what, the limits, how
failures are handled, how it is secured and how far it scales. Everything here describes
the code as it is; where something is not built, it says so. The parts and diagrams are in
[ARCHITECTURE.md](ARCHITECTURE.md).

## Data model

One MongoDB database, 23 Mongoose models in `src/models/`. "ref X" means an ObjectId
pointing at collection X. "timestamps" means Mongoose adds `createdAt` and `updatedAt`.

### People and content

**`User`** (`src/models/User.js`, timestamps)

| Field | Type | Notes |
| --- | --- | --- |
| `name` | String | required |
| `email` | String | required, unique |
| `username` | String | required, unique, lowercased |
| `passwordHash` | String | bcrypt, cost 12 |
| `avatar`, `coverImage` | String | image URLs (bucket or `data:`) |
| `bio` | String | max 500 |
| `about` | String | long-form profile text |
| `interests` | [String] | indexed; used by the feed |
| `currentStatus` | { `text` String max 100, `emoji` String, `updatedAt` Date } | |
| `socialLinks` | Mixed | default `{}` |
| `authProvider` | String | enum `local` only |
| `subscription` | { `plan` enum `free`/`writer`, `stripeCustomerId` String, `stripeSubscriptionId` String, `currentPeriodEnd` Date } | |
| `followersCount`, `followingCount`, `postsCount` | Number | denormalised counters |
| `tokenVersion` | Number | session revocation, compared with the JWT `tv` claim |
| `pinnedPosts` | [ref Post] | at most 3 (enforced in the pin route) |
| `experience` | [{ `company` String req, `role` String req, `period` String, `description` String, `current` Boolean }] | |
| `preferences` | { `theme` String, `emailDigest` Boolean, `notifications` { `email` Boolean, `inApp` Boolean } } | |
| `profileDesign` | { `template` enum `default`/`minimal`, `tabs` { `articles`, `about`, `projects`, `contact`, `experience`, `social`: Boolean }, `tabOrder` [String], `customTabs` [{ `id` String req, `label` String req max 30, `content` String max 5000, `posts` [String], `visible` Boolean }] } | |
| `projects` | [{ `title` String req, `description` String, `url` String, `imageUrl` String }] | |
| `contactDetails` | { `publicEmail` String, `message` String } | |
| `role` | String | enum `user`/`admin` |
| `isVerified` | Boolean | set by admins |
| `profileViewCount` | Number | |
| `lastLoginAt` | Date | |

**`Post`** (`src/models/Post.js`, timestamps)

| Field | Type | Notes |
| --- | --- | --- |
| `title` | String | required |
| `slug` | String | required, unique; rebuilt from the title on edit |
| `excerpt` | String | max 300; filled from the first 280 characters of the text on save when empty |
| `content` | String | required; HTML, Markdown or LaTeX depending on `format` |
| `coverImage` | String | |
| `author` | ref User | required |
| `category` | ref Category | |
| `tags` | [String] | lowercased |
| `status` | String | enum `draft`/`published`/`archived` |
| `format` | String | enum `richtext`/`latex`/`markdown`/`html`/`product` |
| `readTime` | Number | minutes |
| `viewCount`, `likesCount`, `commentsCount`, `bookmarksCount` | Number | denormalised counters |
| `isFeatured`, `isAiGenerated`, `isPinned` | Boolean | |
| `qualityScore` | Number | 0 to 100, from the AI fact-check of generated posts |
| `reviewNotes` | String | fact-check notes shown to admins |
| `collections` | [String] | |
| `seoTitle`, `seoDescription` | String | |
| `productUrl`, `appName`, `pricing`, `appDescription`, `appIcon` | String | Product Launch format |
| `launchDate` | Date | Product Launch format |
| `appImages` | [String] | Product Launch screenshots |
| `systemArchitecture`, `techStack`, `dbSchema`, `apiSpecs`, `devPlan` | String | AI startup concepts |
| `publishedAt` | Date | |

Indexes: `{author, status}`, `{author, status, publishedAt}`, `{author, status, createdAt}`,
`{tags}`, `{category, publishedAt}`, `{status, publishedAt}` and a text index on `title`,
`content`, `tags`.

**`Category`** (`src/models/Category.js`, timestamps): `name` String required unique, `slug`
String required unique, `description` String, `icon` String, `color` String (default
`#f59e0b`), `postsCount` Number. Categories are created lazily by the `generate-posts`
pipeline; there is no category editor yet.

**`Series`** (learning paths, `src/models/Series.js`, timestamps): `title` String required,
`slug` String required unique, `description` String max 500, `coverImage` String, `author`
ref User required, `category` ref Category, `level` enum
`beginner`/`intermediate`/`advanced`, `tags` [String], `posts` [ref Post] (the order is the
path), `postCount` Number, `status` enum `draft`/`published`/`archived`, `isAiGenerated`
Boolean, `publishedAt` Date. Indexes on `{status, publishedAt}`, `category`, `posts`.

**`Comment`** (`src/models/Comment.js`, timestamps): `content` String required max 2000,
`author` ref User required, `post` ref Post required, `parentComment` ref Comment (null for
top level; one level of replies is returned), `likesCount` Number, `isEdited` Boolean.

### Engagement

| Model | File | Fields | Notes |
| --- | --- | --- | --- |
| `Like` | `src/models/Like.js` | `user` ref User, `post` ref Post; timestamps | unique `{user, post}` |
| `Bookmark` | `src/models/Bookmark.js` | `user` ref User, `itemType` enum `post`/`research`/`news`, `post` ref Post, `research` ref ResearchPaper, `news` ref NewsArticle; timestamps | one unique partial index per item type |
| `Follow` | `src/models/Follow.js` | `follower` ref User, `following` ref User; timestamps | unique `{follower, following}` |
| `ReadingHistory` | `src/models/ReadingHistory.js` | `user` ref User, `post` ref Post, `readPercentage` Number 0 to 100; timestamps | read by the feed, but no route writes it yet |
| `Notification` | `src/models/Notification.js` | `recipient` ref User, `actor` ref User, `type` enum `like`/`comment`/`follow`/`mention`/`subscription`/`contact_message`/`new_post`, `post` ref Post, `comment` ref Comment, `contactMessage` ref ContactMessage, `message` String, `isRead` Boolean; timestamps | `mention` and `subscription` are never created |
| `ContactMessage` | `src/models/ContactMessage.js` | `recipient` ref User, `senderName` String max 100, `senderEmail` String max 200, `subject` String max 200, `message` String max 5000, `isRead` Boolean, `isArchived` Boolean; timestamps | the writer's inbox |
| `Feedback` | `src/models/Feedback.js` | `submittedBy` ref User, `name` String max 100, `email` String max 200, `category` enum `bug`/`feature`/`general`/`billing`, `rating` Number 1 to 5, `text` String max 1000, `sentiment` enum `happy`/`neutral`/`sad`; timestamps | |

### Curated feeds

| Model | File | Fields |
| --- | --- | --- |
| `NewsArticle` | `src/models/NewsArticle.js` | `title` String req, `summary` String, `keyTakeaways` [String], `sourceUrl` String req unique, `sourceName` String req, `sourceIcon` String, `imageUrl` String, `topics` [String], `isApproved` Boolean (default false), `rejectionReason` String, `publishedAt` Date, `viewCount`, `savedCount`, `shareCount` Number; timestamps |
| `ResearchPaper` | `src/models/ResearchPaper.js` | `title` String req, `authors` [String], `abstract` String req, `sourceUrl` String req unique, `sourceName` String (default `arXiv`), `publishedAt` Date req, `topics` [String], `summary` String, `keyTakeaways` [String], `isApproved` Boolean (default true), `viewCount`, `savedCount`, `shareCount` Number; timestamps |
| `SuggestedTopic` | `src/models/SuggestedTopic.js` | `topic` String req unique, `category` String req, `tags` [String], `used` Boolean, `usedAt` Date, `createdAt` Date |

### Security

| Model | File | Fields | Notes |
| --- | --- | --- | --- |
| `ApiKey` | `src/models/ApiKey.js` | `keyHash` String (SHA-256, unique index), `prefix` String (first 10 characters), `name` String, `user` ref User, `lastUsedAt` Date, `expiresAt` Date (null means never); timestamps | personal keys and OAuth access tokens |
| `OAuthClient` | `src/models/OAuthClient.js` | `clientId` String unique (`bw_client_` + 32 hex), `clientName` String, `redirectUris` [String], `grantTypes` [String], `tokenEndpointAuthMethod` String; timestamps | dynamic registration |
| `OAuthCode` | `src/models/OAuthCode.js` | `code` String unique (64 hex), `userId` ref User, `clientId` String, `redirectUri` String, `codeChallenge` String, `codeChallengeMethod` String, `expiresAt` Date, `used` Boolean; timestamps | TTL index on `expiresAt` |
| `PasswordReset` | `src/models/PasswordReset.js` | `email` String, `token` String unique (64 hex), `expiresAt` Date, `used` Boolean; timestamps | TTL index on `expiresAt` |
| `RateLimit` | `src/models/RateLimit.js` | `key` String unique (`action:ip:windowStart`), `count` Number, `expiresAt` Date | TTL index on `expiresAt` |

### Automation

| Model | File | Fields | Notes |
| --- | --- | --- | --- |
| `AutomationConfig` | `src/models/AutomationConfig.js` | `type` enum of the five pipelines (unique), `enabled` Boolean, `label` String, `description` String, `schedule` String, `cronExpression` String, `settings` Mixed, `lastRunAt` Date, `lastRunStatus` enum `success`/`partial`/`failed`/`skipped`/null, `lastRunStats` Mixed; timestamps | defaults written by `ensureDefaults()` |
| `AutomationState` | `src/models/AutomationState.js` | `key` String unique (`global`), `paused` Boolean, `pausedAt` Date, `pausedBy` ref User; timestamps | the global pause switch |
| `CronLog` | `src/models/CronLog.js` | `type` enum of the pipelines, `status` enum `success`/`partial`/`failed`/`skipped`, `stats` { `attempted`, `succeeded`, `failed`, `filtered`, `duplicates`: Number }, `details` [{ `topic`, `title`, `postId` ref Post, `category`, `tags` [String], `coverStyle`, `hasCoverImage` Boolean, `error`, `reasoning` }], `duration` Number (ms), `triggeredBy` enum `cron`/`manual`, `triggeredByUser` ref User, `errorMessage` String, `startedAt` Date req, `completedAt` Date; timestamps | one row per run |

`AutomationConfig.cronExpression` and `schedule` are shown in the admin console; the
scheduler itself uses the hours hard-coded in `src/lib/internalCron.js`. Of the stored
`settings`, the code reads `postCount`, `autoPublish` and `minQualityScore`
(`generate-posts`), `maxToProcess` (`fetch-news`) and `maxSeriesPerRun`
(`generate-series`); the others (`tone`, `length`, `minPosts`, `maxPosts`) are stored but
not used.

## Main flows

### Sign-up, sign-in and sessions

1. `POST /api/auth/signup` checks the per-IP limit, requires name, email, username and a
   password of 8+ characters, rejects a taken email or username (409), hashes the password
   and creates the user. The role is `admin` only when the email is listed in
   `ADMIN_EMAILS`.
2. The handler signs a seven-day JWT (`userId`, `email`, `role`, `tv`) and sets the
   `auth_token` cookie, then sends a welcome email without waiting for it.
3. `POST /api/auth/login` accepts an email or username, compares the bcrypt hash, records
   `lastLoginAt` and sets the same cookie.
4. On every request `src/proxy.js` verifies the JWT signature. Handlers call `getSession()`,
   which also loads the user's `tokenVersion` and rejects the token if `tv` differs.
5. `POST /api/auth/logout` clears the cookie; `POST /api/auth/logout-all` increments
   `tokenVersion`, which ends every session on every device.

### Password reset

1. `POST /api/auth/forgot-password` (rate-limited) answers `success` whether or not the
   email exists. For a real account it stores a 256-bit random token valid for one hour and
   emails `/reset-password/<token>`.
2. `POST /api/auth/reset-password` (rate-limited) claims the token atomically
   (`findOneAndUpdate` on `used: false` and not expired), so it works once. It sets the new
   hash and increments `tokenVersion`, signing the account out everywhere.

### Writing and publishing

1. The editor saves through `POST /api/posts`. A missing category falls back to none; a
   name or slug is resolved to a Category, and an unknown one falls back to a
   "Tech"/"Technology" category if it exists.
2. The slug comes from the title, with a base-36 time suffix when taken.
3. If the author already has a draft with the same title (case-insensitive), that draft is
   updated instead of creating a duplicate.
4. On publish, `User.postsCount` goes up and every follower gets a `new_post`
   notification, written in the background.
5. `PUT /api/posts/[id]` (author or admin) updates fields, rebuilds the slug from a new
   title and adjusts `postsCount` when a post moves between published and draft.
   `DELETE` removes the post and decrements the count if it was published.
6. Likes, bookmarks and follows toggle a document, comments are added or deleted (a
   deleted comment takes its replies with it), and each updates the matching counter with
   `$inc`. A like, comment or follow creates a notification for the other person.

### Images

1. The browser asks `POST /api/upload/presign` for a presigned PUT URL valid for one hour,
   sending the file's type and size, then uploads the file straight to the bucket. Only
   PNG, JPEG, WebP, GIF and AVIF images up to 10 MB are accepted (no SVG), the size is
   signed into the URL, and the key is always `<folder>/<user id>/<random>.<ext>`, where
   the folder comes from a fixed list and the extension from the checked type.
2. Without a bucket the presign call returns no URL and the uploader keeps the local
   preview. Server-side uploads (`POST /api/upload`, AI covers) store images up to 2 MB as
   `data:` URLs and fail above that.

### AI co-writer

1. `POST /api/copilot` streams a chat reply (`streamText`) with a system prompt that pins
   the active editor format. Requests for topic ideas are answered from six random
   `SuggestedTopic` documents (or a built-in list) instead of the model.
2. `POST /api/ai` runs one action: `generate`, `titles`, `excerpt`, `tags`, `improve` or
   `cover-image`. JSON answers from the model are parsed leniently (code fences and
   surrounding prose are tolerated).
3. Cover images (`/api/ai` `cover-image`, `/api/copilot/image`) ask Pollinations for a
   1280x720 image with the `flux` model, then `turbo`, and store the result through
   `uploadFile`.

### Personalised feed

`GET /api/feed` loads the 300 most recent published posts (or, for `type=trending`, up to
400 from the last seven days), scores them in memory with `src/lib/feed.js` and drops near
duplicate titles (more than 80% shared words). The personalised score is:

| Signal | Weight | Source |
| --- | --- | --- |
| Behavioural affinity | 0.30 | tags and category of the user's last 60 likes, bookmarks and reads |
| Interest match | 0.20 | `User.interests`, fuzzy substring match on tags |
| Recency | 0.20 | linear decay over 30 days |
| Engagement | 0.20 | Wilson lower bound of (likes + comments + bookmarks) over views |
| Follow bonus | 0.10 | the author is followed |

Trending uses `engagement / (ageHours + 2)^1.8` with likes x3, comments x5, bookmarks x2.
Because nothing writes `ReadingHistory` yet, the "reads" part of affinity is empty.

### Content pipelines

The scheduler (`src/lib/internalCron.js`) starts at boot when `CRON_SECRET` is set and
`ENABLE_INTERNAL_CRON` is not `false`. Every 30 seconds it checks whether it is minute 0
of an hour (UTC) and runs the due jobs one after another, each at most once per hour per
process:

| Job | When (UTC) | Steps |
| --- | --- | --- |
| `fetch-news` | every 4 h | Read up to 10 items from each of 21 RSS feeds; skip known URLs; ask the model whether each is educational, hard news or controversial, plus topics, summary and takeaways; save it as approved or rejected. Stops after `maxToProcess` (default 10) new articles. |
| `fetch-research` | every 6 h | Query arXiv for six category groups (15 results each, 3 s apart); skip known URLs; ask the model for a summary and three takeaways; save as approved. |
| `generate-topics` | 00:00 | Ask the model for a batch of topic ideas and save the new ones as `SuggestedTopic`. |
| `generate-posts` | 06:00, 18:00 | Pick unused suggested topics (oldest first, marked used), topping up from built-in lists; write each post, generate a cover, run a fact-check pass that returns `qualityScore`, review notes and "Further Reading"; skip titles whose slug exists; also invent one or two clearly labelled startup concepts. |
| `generate-series` | Sunday 03:00 | For each category with at least six published posts and no AI path yet, ask the model to choose and order 4 to 8 existing posts; keep only ids that are in the pool; publish the path. Up to `maxSeriesPerRun` (default 3) per run. |

Every pipeline first checks the global pause (`AutomationState`) and its own `enabled`
flag (a manual run ignores `enabled` but not the global pause), then writes a `CronLog`
row and updates `AutomationConfig.lastRun*`.

AI posts are saved as **drafts** unless `settings.autoPublish` is `true`, and even then a
post is published only when its `qualityScore` is at least `minQualityScore` (default 75).
When the fact-check fails, the score stays at 70, so the post stays a draft. Startup
concepts skip the fact-check but follow `autoPublish`. The admin console has no switch for
`autoPublish`; it can only be set through `PUT /api/admin/automation`.

Generated posts and paths are published under the first address in `ADMIN_EMAILS`, else
the first admin, else the first user.

Admins can run a pipeline from `/admin/automation`: `POST /api/admin/automation/trigger`
calls `<NEXT_PUBLIC_APP_URL>/api/cron/<job>?manual=true` over HTTP with the cron secret.

### Remote MCP connector

1. An assistant reads `/.well-known/oauth-protected-resource` and
   `/.well-known/oauth-authorization-server`, then registers itself at
   `POST /api/oauth/register` (http or https redirect URIs only).
2. It sends the user to `GET /api/oauth/authorize` with `response_type=code` and a PKCE
   S256 challenge. Unknown clients and unregistered redirect URIs are refused before
   anything is shown; signed-out users go to `/login` first.
3. The consent page posts to `/api/oauth/approve`, which re-checks the client, redirect URI
   and challenge, stores a code valid for ten minutes and redirects back with it.
4. `POST /api/oauth/token` requires the same `client_id` and `redirect_uri`, verifies the
   PKCE verifier, marks the code used and returns a new `bw_` API key as the access token.
   It has no expiry; the user revokes it in Dashboard, API Keys.
5. `/api/mcp` answers `initialize`, `tools/list` and `tools/call` for five tools:
   `list_posts` (the caller's own), `create_post`, `create_product_launch`,
   `get_pulse_news`, `get_research_papers`.

### Local MCP server

`mcp-server/index.js` registers 33 tools that call the HTTP API with
`Authorization: Bearer <BLOGWRITE_API_KEY>`. The public reads work with any key (posts,
feed, Pulse, research, search, profiles). Every route that needs a signed-in user, except
`/api/mcp`, reads only the session cookie (`getSession`), not API keys. So the tools that
act as the user (create, update and delete posts, AI actions, bookmarks, likes, comments,
own profile, notifications) currently get 401 from those routes.

### Billing

1. With Stripe configured, `POST /api/billing/checkout` creates (once) a Stripe customer
   for the user and a Checkout session in subscription mode for `STRIPE_PRICE_ID_WRITER`.
   A Stripe error returns 502.
2. `POST /api/billing/webhook` verifies the `stripe-signature` header and handles
   `checkout.session.completed` (plan `writer`, subscription id, period end, confirmation
   email), `invoice.payment_succeeded` (period end) and `customer.subscription.deleted`
   (back to `free`).
3. Without Stripe, checkout returns `/dashboard/billing/mock-checkout`, and
   `POST /api/billing/mock-checkout/success` sets a simulated 30-day Writer plan. That
   route answers 403 once Stripe is configured.
4. There is no in-app cancel or customer portal; cancelling happens in Stripe and arrives
   by webhook. The admin billing page lists Writer users and builds invoice rows from them;
   those rows are not read from Stripe.

### Contact and feedback

`POST /api/contact` is public. It validates name, email format and a message of up to 5000
characters, stores a `ContactMessage` for the chosen writer (or the first admin) and
notifies them. Writers read and archive messages at `/api/contact/inbox`. Feedback needs a
session to send and an admin to read.

## Roles and permissions

| Who | Can |
| --- | --- |
| Anonymous visitor | Open the public pages; read posts, profiles, the feed, search, Pulse and learning paths through the API; send a contact message; register an OAuth client. Research and site stats need a session. |
| Signed-in user | Everything above, plus write posts, upload images, use the co-writer and AI actions, like, bookmark, comment, follow, save news and research, create learning paths, manage their profile, inbox, notifications and API keys (up to 5), send feedback, start checkout, approve an OAuth connection. |
| Author | Edit and delete their own posts and series; pin up to 3 of their own posts; delete their own comments. |
| Admin (`role: 'admin'`) | Edit or delete any post or series; the admin console: stats, users (change role and verified flag only), feature or delete posts, contact messages, feedback, billing overview, automation (pause all, enable, settings, run now, logs), AI post generator and learning-path builder. An admin cannot demote themselves or the last admin. |
| API key holder (`bw_`) | The five `/api/mcp` tools as the key's owner. |
| Cron secret holder | Run any `/api/cron/*` pipeline. |
| Stripe | Deliver signed webhook events. |

Admins are made at sign-up from `ADMIN_EMAILS` (empty by default) or by another admin.

## Limits

| Limit | Value | Where |
| --- | --- | --- |
| Sign-up | 5 per IP per 10 minutes | `src/app/api/auth/signup/route.js` |
| Sign-in | 10 per IP per 5 minutes | `src/app/api/auth/login/route.js` |
| Forgot password | 5 per IP per 15 minutes | `src/app/api/auth/forgot-password/route.js` |
| Reset password | 10 per IP per 15 minutes | `src/app/api/auth/reset-password/route.js` |
| Password length | at least 8 | sign-up and reset |
| Session | 7 days | `src/lib/auth.js` |
| Reset link | 1 hour, single use | forgot and reset routes |
| OAuth code | 10 minutes, single use | `src/app/api/oauth/approve/route.js` |
| API keys | 5 created from the dashboard; keys minted by OAuth are not capped but count toward the 5 | `src/app/api/auth/api-keys/route.js`, `src/app/api/oauth/token/route.js` |
| Pinned posts | 3 | `src/app/api/posts/[id]/pin/route.js` |
| Page sizes | posts and feed max 50; MCP `list_posts` max 50 | routes |
| Presigned upload | 1 hour | `src/lib/upload.js` |
| Uploaded image | PNG, JPEG, WebP, GIF or AVIF, 10 MB | `src/lib/upload.js` (`checkUpload`) |
| Contact form | 5 messages per IP per hour | `src/app/api/contact/route.js` |
| Favicon lookup | public addresses only, 3 redirects, 1 MB page | `src/app/api/favicon/route.js` |
| Inline image fallback | 2 MB | `src/lib/upload.js` |
| Generated per run | at most 8 blog posts and 3 startup concepts | `src/app/api/cron/generate-posts/route.js` |
| Function duration hints | 30 s co-writer, 60 s co-writer image, 300 s for `generate-topics`, `generate-posts`, `generate-series` and the two admin generators | `export const maxDuration` |
| Text sizes | comment 2000, bio 500, contact message 5000, feedback 1000, excerpt 300 | models |

Only the four account routes are rate-limited. `PLAN_LIMITS` in `src/lib/stripe.js` (posts,
storage, AI calls, analytics per plan) is not enforced anywhere.

## Failure handling

- **Configuration:** a missing or short `JWT_SECRET` (under 32 characters) or `CRON_SECRET`
  (under 16) throws instead of using a default. A missing `MONGODB_URI` throws on first use.
  A failed MongoDB connection clears the cached promise so the next request retries.
- **Session check:** if the `tokenVersion` lookup fails on a database error, the session is
  allowed (fail open) and the error is logged, so a database blip does not sign everyone out.
- **Model output:** JSON from the model is cleaned of code fences before parsing. A news
  item that cannot be classified is saved as rejected; a paper that cannot be summarised is
  saved with an empty summary; a failed fact-check leaves the post as a draft; a learning
  path whose answer cannot be parsed is skipped. Path ids the model invents are dropped.
- **Images:** Pollinations is tried with `flux`, then `turbo`, with a 120-second timeout;
  responses that are not images or are under 1000 bytes are ignored. If both fail, the post
  is saved without a cover.
- **Email:** without `HARAKUMO_API_KEY` emails are skipped with a warning; send errors are
  logged and never fail the request (30-second timeout).
- **Pipelines:** each run is logged to `CronLog` as `success`, `partial`, `failed` or
  `skipped`. Duplicate URLs and slugs are caught by unique indexes (error 11000 counted as a
  duplicate). The scheduler catches every job error so one failure does not stop the next.
- **Stripe:** a bad webhook signature returns 400; handler errors return 500 so Stripe
  retries; checkout errors return 502 and never fall back to the simulator.
- **Notifications and counters:** follower notifications and welcome emails are not awaited
  and their errors are only logged.

## Security

- Drafts: only published posts and series are public. `GET /api/posts` and
  `GET /api/series` list other statuses only for their author (admins see all), and
  `GET /api/posts/[id]` and `GET /api/series/[id]` answer 404 for an unpublished item
  unless the caller is its author or an admin.
- Outbound fetches: `/api/favicon` fetches only public addresses on ports 80 and 443
  (no loopback, private, link-local or metadata addresses, IPv4-mapped forms included),
  re-checks every redirect (at most 3) and reads at most 1 MB.
- Uploads: images only (PNG, JPEG, WebP, GIF, AVIF; no SVG), 10 MB, stored under a fixed
  folder and the uploader's user id; presigned URLs carry the signed size.
- Login: the username is escaped before it is matched, so it is never run as a pattern.
- Passwords: bcrypt cost 12; generic "invalid username/email or password" message; the
  reset flow does not reveal whether an email exists.
- Sessions: HS256 JWT in an httpOnly, `SameSite=Lax` cookie (`Secure` in production);
  revocation through `tokenVersion`; no secret fallbacks in code.
- API keys: 256-bit random, shown once, stored as SHA-256 hashes, accepted only in the
  `Authorization` or `x-api-key` header, never in a URL; `lastUsedAt` is recorded. An
  `expiresAt` field is checked, but nothing sets it yet, so keys last until revoked.
- OAuth: PKCE S256 required at authorize, approve and token (the discovery metadata still
  lists `plain`, which the endpoints refuse); redirect URIs exact-matched against the
  registration at both authorize and approve; codes bound to their client and redirect URI
  and single use.
- Admin routes re-check the role from the database. User updates are limited to `role` and
  `isVerified`, contact updates to `isRead` and `isArchived`.
- Content: Markdown, Rich Text and LaTeX output goes through `sanitize-html` with an
  allow-list (no `javascript:` links, `data:` only for images, links get
  `rel="noopener noreferrer nofollow"`). HTML-format posts run in an iframe sandboxed
  without `allow-same-origin`. `src/lib/sanitize.test.js` and
  `src/lib/mermaid-sanitize.test.js` cover the sanitisers (`npm test`).
- Billing: the checkout simulator is refused once Stripe is configured; webhooks are
  signature-checked.
- Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: origin-when-cross-origin`. There is no Content-Security-Policy.
- Data sent out: with the default local model, drafts stay on the machine. Cover-image
  prompts go to Pollinations. Configuring `AI_BASE_URL` sends prompts to that endpoint.
- Secrets live only in environment variables; `.env*` files other than `.env.example` are
  git-ignored.

## Scaling

- **Web tier:** sessions are stateless JWTs and rate limits live in MongoDB, so several
  instances can share one database. Each handler reconnects through the cached Mongoose
  connection.
- **Scheduler:** it runs inside each server process and remembers completed jobs only in
  memory. With more than one instance, set `ENABLE_INTERNAL_CRON=false` on all but one, or
  turn it off everywhere and call `/api/cron/*` from one external scheduler. Jobs run one at
  a time because a local model generates one thing at a time.
- **MCP SSE sessions** are held in an in-memory map in the process that opened them, so a
  `POST ?sessionId=` must reach the same instance. The stateless `POST` path has no such
  constraint.
- **Feed:** ranking is done in memory over at most 300 (or 400) recent posts per request,
  so cost per request is bounded but older posts never reach the personalised feed.
- **Queries:** list pages are covered by compound indexes on `status` and `publishedAt`;
  counters are denormalised to avoid counting on read; search uses the text index.
- **Media:** with a bucket, images never pass through the server on browser uploads. Inline
  `data:` images make post documents large and are meant only for local use.
- **AI cost and time:** pipelines cap their work per run (news 10 new items, posts 8 + 3,
  paths 3), and every model call is sequential inside a run.

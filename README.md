# AstroLounge

AstroLounge is a full-stack social platform for sharing and discovering cosmic photography and musings. Users can post images and short captions (up to 314 characters), browse an algorithmic or chronological feed, join topic-based communities called Lounges, and earn streaks and milestone badges for consistent posting.

**Production:** https://astrolounge.net | **Staging:** https://astrolounge-dev.fly.dev

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Repository Layout](#repository-layout)
4. [Prerequisites](#prerequisites)
5. [Setup & Running Locally](#setup--running-locally)
6. [Environment Variables](#environment-variables)
7. [Database & Prisma Workflow](#database--prisma-workflow)
8. [Testing](#testing)
9. [Architecture Overview](#architecture-overview)
10. [CI/CD & Docker](#cicd--docker)
11. [Deployment (Fly.io)](#deployment-flyio)
12. [Domain Glossary](#domain-glossary)
13. [Contributing](#contributing)
14. [License](#license)

---

## Features

**Social**
- Social feed with two modes: "For You" (algorithmic, works anonymously) and "Following" (chronological, requires auth)
- Posts limited to 314 characters; Lounge posts support a title and rich-text body
- Images, YouTube embeds, and link previews on posts
- Nested comments, Stars (likes), reposts, shares, and saves
- Lounges — topic-based communities users can follow

**Profile & Discovery**
- User profiles with bios, social account links, and post history
- Follow/following system with in-app notifications (likes, comments, reposts, follows)
- Posting streaks tracked per day; milestone badges at 1, 10, 25, 50, 100, 250, and 500 posts
- Full-text search across users, posts, and lounges

**Platform**
- Admin-created long-form articles (TipTap rich-text editor)
- "True North" constellation navigation game with daily limits and a leaderboard
- Weather widget with Celsius/Fahrenheit preference
- Admin analytics dashboard
- Theming: dark mode + three accent color palettes (BRAND purple, OCEAN blue, MINT green)
- Google OAuth, Facebook OAuth, and Supabase email/password authentication

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | NestJS v11 (TypeScript) |
| ORM | Prisma v6 with PostgreSQL |
| Auth | Passport.js — JWT, Google OAuth 2.0, Facebook OAuth |
| File storage | Supabase Storage |
| AI/Moderation | OpenAI SDK |
| Rate limiting | express-rate-limit |
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| Rich text editor | TipTap v3 |
| Testing (backend) | Jest v29 + ts-jest + Supertest |
| Testing (frontend) | Node built-in test runner |
| Deployment | Fly.io via Docker |
| CI | GitHub Actions |

---

## Repository Layout

```
astroSocial/                  ← repo root
├── astrogram/                ← React/Vite frontend
│   ├── src/
│   │   ├── components/       ← Reusable UI components
│   │   ├── contexts/         ← React context providers (Auth, Theme, Notifications, Analytics)
│   │   ├── hooks/            ← Custom React hooks
│   │   ├── lib/              ← API client (api.ts) + utilities
│   │   ├── pages/            ← Route-level page components (27 pages)
│   │   ├── styles/           ← Global CSS
│   │   └── types/            ← TypeScript interfaces/types
│   ├── public/               ← Static assets (icons, default images)
│   ├── vite.config.ts        ← Vite config; proxies /api → localhost:3000
│   ├── tailwind.config.ts    ← Tailwind v4 config
│   └── package.json
│
├── backend/                  ← NestJS API backend
│   ├── src/
│   │   ├── analytics/        ← Analytics tracking (events, sessions, metrics)
│   │   ├── articles/         ← Admin-managed long-form articles
│   │   ├── auth/             ← JWT + OAuth (Google, Facebook) auth
│   │   ├── comments/         ← Post comments + nested replies
│   │   ├── common/           ← Shared filters (MulterExceptionFilter)
│   │   ├── games/            ← Constellation game + leaderboard
│   │   ├── lounges/          ← Topic communities
│   │   ├── middleware/       ← Request logging middleware
│   │   ├── moderation/       ← Content moderation (OpenAI)
│   │   ├── notifications/    ← In-app notifications
│   │   ├── posts/            ← Posts, feed, interactions
│   │   ├── prisma/           ← PrismaService wrapper
│   │   ├── search/           ← Search (users, posts, lounges)
│   │   ├── sitemap/          ← Dynamic XML sitemap
│   │   ├── storage/          ← Supabase file storage service
│   │   ├── supabase/         ← Supabase client module
│   │   ├── test-utils/       ← Mock factories + custom Jest reporter
│   │   ├── unfurl/           ← URL preview/unfurling
│   │   ├── users/            ← User profiles, follows, social accounts
│   │   ├── utils/            ← Email encryption/hashing (crypto.ts)
│   │   └── weather/          ← Weather API integration
│   ├── prisma/
│   │   ├── schema.prisma     ← Prisma schema (source of truth)
│   │   └── migrations/       ← SQL migration files
│   ├── test/                 ← E2E test files
│   └── package.json
│
├── docs/                     ← Additional documentation
├── .github/workflows/        ← CI/CD: docker-image.yml
├── Dockerfile                ← Multi-stage build (frontend → backend → final)
├── fly.toml                  ← Fly.io production config
├── fly.dev.toml              ← Fly.io dev/staging config
└── README.md
```

---

## Prerequisites

- **Node.js v20+** and npm
- **PostgreSQL** database (local or hosted)
- **Supabase project** — for file storage; also used for email/password auth
- **Google OAuth credentials** — required for Google sign-in (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
- **Facebook OAuth credentials** — optional (`FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`)
- **OpenAI API key** — optional, enables content moderation
- **Fly.io CLI** — only needed for deployment, not local development

---

## Setup & Running Locally

```bash
# 1. Clone the repo
git clone <repo-url>
cd astroSocial

# 2. Backend
cd backend
npm install
# Create backend/.env from the Environment Variables table below
npm run start:dev        # NestJS starts on http://localhost:3000

# 3. Frontend (new terminal, from repo root)
cd astrogram
npm install
npm run dev              # Vite starts on http://localhost:5173
```

> The Vite dev server automatically proxies all `/api/*` requests to `http://localhost:3000`. No CORS configuration is needed, and `VITE_API_BASE_URL` is not required for local development.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Access token signing secret |
| `JWT_EXPIRATION` | Yes | — | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh token signing secret |
| `JWT_REFRESH_EXPIRATION` | Yes | — | Refresh token TTL (e.g. `7d`) |
| `EMAIL_ENCRYPTION_KEY` | Yes | — | AES-256 key for encrypting stored user emails |
| `SUPA_URL` | Yes | — | Supabase project URL |
| `SUPA_SERVICE_KEY` | Yes | — | Supabase service role key. **Never bake into the Docker image** — inject at runtime only |
| `GOOGLE_CLIENT_ID` | Yes | — | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | — | Google OAuth app client secret |
| `FACEBOOK_APP_ID` | No | — | Facebook OAuth app ID |
| `FACEBOOK_APP_SECRET` | No | — | Facebook OAuth app secret |
| `OPENAI_API_KEY` | No | — | OpenAI key for content moderation |
| `FRONTEND_URL` | No | — | Comma-separated CORS origins (production only) |
| `PORT` | No | `3000` | HTTP server port |
| `NODE_ENV` | No | — | Set to `production` to enable static file serving from `dist/public/` |
| `API_RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window in milliseconds |
| `API_RATE_LIMIT_MAX` | No | `120` | Max requests/window for general `/api` traffic (per IP) |
| `API_AUTH_RATE_LIMIT_MAX` | No | `30` | Max requests/window for `/api/auth/*` (per IP) |
| `API_FEED_RATE_LIMIT_MAX` | No | `300` | Max requests/window for `/api/posts/feed` (per IP) |

### Frontend (Vite build-time)

These are baked into the frontend bundle at build time. For local development they are not needed — the Vite proxy handles routing. For Docker builds, pass them as `--build-arg` flags (see [CI/CD & Docker](#cicd--docker)).

In GitHub Actions they must be stored as **repository-level secrets** (not environment-scoped), because the `build` job runs without a GitHub environment and cannot read environment-scoped secrets.

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base URL for production builds (e.g. `https://astrolounge.net/api`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |

---

## Database & Prisma Workflow

Schema: `backend/prisma/schema.prisma`

```bash
cd backend

# Create and apply a new migration during development
npx prisma migrate dev --name describe_your_change

# Apply pending migrations in production (no interactive prompts)
npx prisma migrate deploy

# Regenerate the Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (visual database browser)
npx prisma studio
```

> **PostgreSQL enum constraint:** Adding a new enum value with `ALTER TYPE ... ADD VALUE` cannot run inside a transaction. When a migration requires this, the migration file must disable transactions. See existing migrations for the pattern.

### Data Models

| Model | Key fields | Notes |
|-------|-----------|-------|
| `User` | `id`, `emailEncrypted`, `emailHash`, `username`, `provider`, `role` | Emails stored encrypted (AES-256) + hashed (SHA-256). Role: `USER` or `ADMIN` |
| `Post` | `id`, `authorId`, `originalAuthorId`, `body`, `title`, `loungeId` | `originalAuthorId` tracks repost origin |
| `Comment` | `id`, `postId`, `authorId`, `parentId` | `parentId` enables nested replies |
| `CommentLike` | `commentId`, `userId` | Unique per pair |
| `PostInteraction` | `postId`, `userId`, `type` | type: `LIKE`, `SHARE`, `REPOST` — unique per triple |
| `SavedPost` | `userId`, `postId` | Unique per pair |
| `Notification` | `userId`, `actorId`, `type`, `read` | |
| `Lounge` | `id`, `name`, `bannerUrl`, `profileUrl` | `name` is unique |
| `UserSocialAccount` | `userId`, `platform`, `url` | Platforms: TWITTER, INSTAGRAM, TIKTOK, YOUTUBE, LINKEDIN, GITHUB, WEBSITE, OTHER |
| `Article` | `slug`, `status`, `authorId` | `status`: `DRAFT` or `PUBLISHED` |
| `GameScore` | `gameId`, `userId?`, `displayName`, `score`, `rounds` | `userId` nullable for anonymous scores |
| `AnalyticsSession` | `sessionKey`, `userId?` | |
| `AnalyticsEvent` | `type`, `targetType`, `targetId`, `metadata` | |
| `RequestMetric` | `route`, `method`, `statusCode`, `durationMs` | |

---

## Testing

```bash
# Backend (run from backend/)
cd backend
npm run test          # Unit tests + E2E (with coverage)
npm run test:unit     # Unit tests only (with coverage)
npm run test:e2e      # E2E tests only
npm run test:watch    # Unit tests in watch mode

# Frontend (run from astrogram/)
cd astrogram
npm test              # Node built-in runner; covers Weather component only
```

**Test layout:**
- Backend unit tests are co-located with source files as `*.spec.ts`
- Backend E2E tests live in `backend/test/` as `*.e2e-spec.ts`
- Use the shared mock factories from `src/test-utils/mocks.ts` (`createMockPrisma`, `createMockStorage`, etc.) for consistent unit test setup
- The NestJS logger is silenced in tests; intentional error-path logs appear as `(expected error) <message>` in stderr

---

## Architecture Overview

### Backend Modules

All routes are prefixed with `/api`. Controllers declare this directly (e.g. `@Controller('api/posts')`).

| Module | Route prefix | Purpose |
|--------|-------------|---------|
| `auth` | `/api/auth` | OAuth callbacks (Google, Facebook), JWT refresh, logout |
| `users` | `/api/users` | Profiles, follows, social account links, admin user list |
| `posts` | `/api/posts` | CRUD, feed (For You / Following), likes, saves, reposts, shares |
| `comments` | `/api/comments` | Create and delete comments; like/unlike comments |
| `lounges` | `/api/lounges` | List lounges, follow/unfollow, lounge-scoped posts |
| `notifications` | `/api/notifications` | List notifications, mark as read |
| `search` | `/api/search` | Full-text search across users, posts, lounges |
| `analytics` | `/api/analytics` | Event ingestion, admin dashboard metrics |
| `articles` | `/api/articles` | CRUD (admin only), public list and detail |
| `games` | `/api/games` | Score submission, leaderboard for True North |
| `weather` | `/api/weather` | Current conditions by lat/lon coordinates |
| `unfurl` | `/api/unfurl` | URL metadata extraction for link previews |
| `sitemap` | `/sitemap.xml` | Dynamic XML sitemap |

**Guards:**
- `JwtAuthGuard` — requires a valid JWT; applied to authenticated-only endpoints
- `OptionalAuthGuard` — allows unauthenticated requests but populates `req.user` when a valid token is present; used for public endpoints that behave differently when logged in

### Frontend Structure

All API calls go through `astrogram/src/lib/api.ts`, which handles Bearer token injection and silent token refresh on 401 responses.

Four React contexts manage global state:
- `AuthContext` — auth state, login/logout, user preferences (theme, accent color)
- `ThemeContext` — dark mode toggle
- `NotificationContext` — unread notification count
- `AnalyticsContext` — event tracking helpers

**Auth flow (Google/Facebook):** Redirect to `/api/auth/google` → OAuth callback → `AuthSuccessPage` captures access token from URL query param → stored in `localStorage`. Access tokens expire in 15 minutes; refresh tokens (httpOnly cookie) last 7 days.

**Pages and routes:**

| Page | Route | Auth required |
|------|-------|--------------|
| `Feed.tsx` | `/` | No (personalized if logged in) |
| `PostPage.tsx` | `/post/:id` | No |
| `UserPage.tsx` | `/user/:username` | No |
| `ProfilePage.tsx` | `/profile` | Yes |
| `ProfileOverviewPage.tsx` | `/profile/overview` | Yes |
| `SettingsPage.tsx` | `/settings` | Yes |
| `CompleteProfilePage.tsx` | `/complete-profile` | Yes |
| `LoungesPage.tsx` | `/lounges` | No |
| `LoungePage.tsx` | `/lounge/:name` | No |
| `LoungePostPage.tsx` | `/lounge/:name/post` | Yes |
| `LoungePostDetailPage.tsx` | `/lounge/:name/post/:id` | No |
| `NotificationsPage.tsx` | `/notifications` | Yes |
| `SavedPage.tsx` | `/saved` | Yes |
| `SearchPage.tsx` | `/search` | No |
| `ArticlesPage.tsx` | `/articles` | No |
| `ArticleDetailPage.tsx` | `/articles/:slug` | No |
| `AdminPage.tsx` | `/admin` | Yes (ADMIN role) |
| `AdminArticleEditorPage.tsx` | `/admin/articles/:id` | Yes (ADMIN role) |
| `GamesPage.tsx` | `/games` | No |
| `TrueNorthPage.tsx` | `/games/true-north` | No |
| `WeatherPage.tsx` | `/weather` | No |
| `SignupPage.tsx` | `/signup` | No |
| `PrivacyPolicyPage.tsx` | `/privacy` | No |
| `TermsPage.tsx` | `/terms` | No |
| `CommunityGuidelinesPage.tsx` | `/community-guidelines` | No |
| `AuthSuccessPage.tsx` | `/auth/success` | — |
| `SupabaseAuthCallbackPage.tsx` | `/auth/callback` | — |
| `NotFoundPage.tsx` | `*` | — |

---

## CI/CD & Docker

### Local Docker Build

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://astrolounge.net/api \
  --build-arg VITE_SUPABASE_URL=<your-supabase-url> \
  --build-arg VITE_SUPABASE_ANON_KEY=<your-anon-key> \
  -t astrolounge .
```

The `Dockerfile` uses a three-stage build:
1. **`frontend-builder`** — installs frontend deps, builds the React SPA with Vite using the `VITE_*` build args
2. **`backend-builder`** — installs backend deps, runs `prisma generate`, copies the frontend `dist/` into `backend/public/`, compiles NestJS
3. **Final stage** — copies compiled output; runs `node dist/main` on port 3000 in production mode

### GitHub Actions Pipeline

Triggers on push or PR to `main`. Four jobs run in sequence:

| Job | Trigger | What it does |
|-----|---------|-------------|
| `test` | PR + push | `npm ci && npm test` in `backend/` |
| `build` | After `test` | Builds and pushes Docker image to `registry.fly.io/astrosocial:<git-sha>`; validates Supabase secrets are non-empty |
| `deploy-dev` | Push to main | Deploys to `astrolounge-dev` using `fly.dev.toml` |
| `promote-production` | Push to main, after `deploy-dev` | Deploys to `astrosocial` using `fly.toml`; requires the `prod` GitHub environment (manual approval gate) |

**Required GitHub repository-level secrets** (not environment-scoped — the `build` job runs without a GitHub environment):
- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `FLY_API_TOKEN`

---

## Deployment (Fly.io)

Config files: `fly.toml` (production app `astrosocial`, region `sjc`) and `fly.dev.toml` (staging app `astrolounge-dev`, region `sjc`).

```bash
# Install flyctl (if not already installed)
curl -L https://fly.io/install.sh | sh

# Manual deploy to staging
flyctl deploy --config fly.dev.toml

# Manual deploy to production
flyctl deploy --config fly.toml

# Set runtime secrets (never bake SUPA_SERVICE_KEY into the image)
fly secrets set SUPA_SERVICE_KEY=... JWT_SECRET=... --app astrosocial
```

---

## Domain Glossary

| Term | Meaning |
|------|---------|
| **Lounge** | A topic-based community (like a subreddit). Posts in a lounge require a title and rich-text body |
| **Interaction** | A LIKE, SHARE, or REPOST action on a post, tracked in the `PostInteraction` table |
| **Stars** | The frontend display name for post likes |
| **Repost** | Creates a copy of a post under the reposter's profile; original authorship is preserved |
| **Save** | Bookmarking a post to a personal saved list |
| **Feed mode** | "For You" (algorithmic, available anonymously) or "Following" (chronological, requires auth) |
| **Streak** | Consecutive days a user has created at least one post |
| **Milestone** | A post-count achievement displayed as a badge: 1, 10, 25, 50, 100, 250, or 500 posts |
| **Accent** | User-chosen color theme: BRAND (purple `#7c3aed`), OCEAN (blue), or MINT (green) |
| **True North** | The constellation navigation game at `/games/true-north` |
| **Article** | Long-form content created by admins using the TipTap editor; distinct from regular posts |
| **Unfurl** | URL metadata extraction (title, description, image, site name) used for link previews |
| **Provider** | Authentication provider: `google`, `facebook`, or `supabase` (email/password) |

---

## Contributing

1. Fork & clone the repository
2. Install deps in both `backend/` and `astrogram/`
3. Create a feature branch
4. Submit a PR with a description and tests

Match the project's code style before opening a PR:

```bash
# Backend (single quotes, trailing commas — configured in .prettierrc)
cd backend
npm run format    # Prettier
npm run lint      # ESLint --fix

# Frontend
cd astrogram
npm run lint
```

---

## License

MIT © Carlos Bejar

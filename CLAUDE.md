# CLAUDE.md — AstroLounge Codebase Guide

This file gives AI assistants a full mental model of the AstroLounge monorepo so they can make correct, consistent changes without having to re-explore the codebase each time.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Layout](#2-repository-layout)
3. [Tech Stack](#3-tech-stack)
4. [Backend — `backend/`](#4-backend--backend)
5. [Frontend — `astrogram/`](#5-frontend--astrogram)
6. [Database — Prisma Schema](#6-database--prisma-schema)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Feed Algorithm](#8-feed-algorithm)
9. [Testing Conventions](#9-testing-conventions)
10. [Environment Variables](#10-environment-variables)
11. [Development Workflow](#11-development-workflow)
12. [Deployment & CI/CD](#12-deployment--cicd)
13. [Key Patterns & Conventions](#13-key-patterns--conventions)
14. [Domain Glossary](#14-domain-glossary)

---

## 1. Project Overview

**AstroLounge** (package name `astrogram`) is a full-stack social platform for sharing and discovering cosmic photography and musings. Core features:

- Social feed (algorithmic "For You" + chronological "Following" modes)
- Posts limited to **314 characters** (regular posts; lounge posts have title + rich body)
- Images, YouTube embeds, and link previews on posts
- Comments (nested), likes, shares, reposts, saves
- Lounges — topic-based communities (like subreddits)
- User follows, notifications, streaks, milestone badges
- Articles (admin-created, TipTap rich-text editor)
- Games (constellation navigation "True North" with daily limits and leaderboard)
- Weather widget with C/F preference
- Admin analytics dashboard
- Theming: accent colors (BRAND/OCEAN/MINT) + dark mode

---

## 2. Repository Layout

```
astroSocial/                  ← repo root
├── astrogram/                ← React/Vite frontend
│   ├── src/
│   │   ├── components/       ← Reusable UI components
│   │   ├── contexts/         ← React context providers
│   │   ├── hooks/            ← Custom React hooks
│   │   ├── lib/              ← API client (api.ts) + utilities
│   │   ├── pages/            ← Route-level page components
│   │   ├── styles/           ← Global CSS
│   │   ├── types/            ← TypeScript interfaces/types
│   │   └── vendor/           ← Vendored react-quill-new
│   ├── public/               ← Static assets (icons, default images)
│   ├── index.html
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
│   │   ├── middleware/        ← Request logging middleware
│   │   ├── moderation/       ← Content moderation (OpenAI)
│   │   ├── notifications/    ← In-app notifications
│   │   ├── posts/            ← Posts, feed, interactions
│   │   ├── prisma/           ← PrismaService wrapper
│   │   ├── search/           ← Search (users, posts, lounges)
│   │   ├── storage/          ← Supabase file storage service
│   │   ├── supabase/         ← Supabase client module
│   │   ├── test-utils/       ← Mock factories + custom Jest reporter
│   │   ├── types/            ← TypeScript type definitions
│   │   ├── unfurl/           ← URL preview/unfurling
│   │   ├── users/            ← User profiles, follows, social accounts
│   │   ├── utils/            ← Email encryption/hashing (crypto.ts)
│   │   ├── weather/          ← Weather API integration
│   │   ├── app.module.ts     ← Root NestJS module
│   │   ├── app.controller.ts
│   │   ├── jest.setup.ts     ← Silences NestJS logger in tests
│   │   └── main.ts           ← App bootstrap, rate limiting, static serving
│   ├── prisma/
│   │   ├── schema.prisma     ← Prisma schema (source of truth)
│   │   ├── migrations/       ← SQL migration files
│   │   └── scripts/          ← One-off data scripts (e.g. backfillEmails)
│   ├── test/                 ← E2E test files + jest-e2e.json config
│   ├── scripts/              ← Shell/utility scripts
│   ├── nest-cli.json
│   ├── tsconfig.json
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

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | NestJS v11 (TypeScript) |
| ORM | Prisma v6 with PostgreSQL |
| Auth | Passport.js — JWT, Google OAuth 2.0, Facebook OAuth |
| File storage | Supabase Storage |
| HTTP client | @nestjs/axios (Axios) |
| Caching | @nestjs/cache-manager (cache-manager v7) |
| Scheduling | @nestjs/schedule (cron jobs) |
| AI/Moderation | OpenAI SDK |
| Rate limiting | express-rate-limit |
| Geo IP | geoip-lite |
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| Rich text editor | TipTap v3 |
| Icons | lucide-react, react-icons |
| Date utils | date-fns v4 |
| Testing (backend) | Jest v29 + ts-jest + Supertest |
| Testing (frontend) | Node built-in test runner (Weather component only) |
| Deployment | Fly.io via Docker |
| CI | GitHub Actions |

---

## 4. Backend — `backend/`

### Module Architecture

Every feature is a NestJS module. Each module typically contains:
- `*.module.ts` — imports, providers, exports
- `*.controller.ts` — HTTP route handlers
- `*.service.ts` — business logic
- `dto/` — Data Transfer Objects (class-validator decorated)
- `*.spec.ts` — unit tests

### API Route Convention

All API routes are prefixed with `/api`. Controllers declare this directly:

```typescript
@Controller('api/posts')    // → /api/posts/...
@Controller('api/users')    // → /api/users/...
@Controller('api/games')    // → /api/games/...
```

### Module Inventory

| Module | Routes prefix | Purpose |
|--------|--------------|---------|
| `auth` | `/api/auth` | OAuth callbacks, JWT refresh, logout |
| `users` | `/api/users` | Profile, follows, social accounts, admin list |
| `posts` | `/api/posts` | CRUD, feed, likes, saves, reposts, shares |
| `comments` | `/api/comments` | Create, delete, like/unlike comments |
| `lounges` | `/api/lounges` | List, follow/unfollow, lounge posts |
| `notifications` | `/api/notifications` | List, mark read |
| `search` | `/api/search` | Search users, posts, lounges |
| `analytics` | `/api/analytics` | Event ingestion, admin dashboard data |
| `articles` | `/api/articles` | CRUD (admin), public list/detail |
| `games` | `/api/games` | Score submission, leaderboard |
| `weather` | `/api/weather` | Current weather by coordinates |
| `unfurl` | `/api/unfurl` | URL metadata preview |

### Guards

- **`JwtAuthGuard`** (`auth/jwt-auth.guard.ts`) — requires valid JWT access token; use for authenticated-only endpoints
- **`OptionalAuthGuard`** (`auth/jwt-optional.guard.ts`) — allows unauthenticated requests but populates `req.user` when a valid token is present; use for public endpoints that behave differently for logged-in users
- **`JwtRefreshGuard`** — for the `/api/auth/refresh` endpoint specifically

Apply guards with `@UseGuards(JwtAuthGuard)` at controller or method level.

### Accessing the Current User

```typescript
// In controllers, extract userId from JWT payload:
const userId = req.user.sub as string;
const userRole = req.user.role;
```

### Logging Convention

Every controller and service instantiates NestJS `Logger`:

```typescript
private readonly logger = new Logger(MyService.name);
```

Log levels used:
- `logger.log()` — normal operation info
- `logger.verbose()` — low-level details (Prisma operations)
- `logger.warn()` — non-critical issues (duplicate interactions)
- `logger.error(message, stack)` — errors (always pass `err.stack` as second arg)

Logger is silenced in tests (see [Testing Conventions](#9-testing-conventions)).

### Error Handling

Services throw NestJS HTTP exceptions which propagate through controllers:
- `NotFoundException` — entity not found
- `ForbiddenException` — wrong owner / role
- `ConflictException` — duplicate (Prisma P2002)
- `BadRequestException` — invalid input
- `InternalServerErrorException` — catch-all for unexpected errors

Prisma error code `P2002` = unique constraint violation. `P2025` = record not found on delete.

### Email Privacy

User emails are **never stored in plaintext**:
- `emailEncrypted` — AES-256-CTR encrypted (requires `EMAIL_ENCRYPTION_KEY` env var)
- `emailHash` — SHA-256 hash for uniqueness lookups

See `src/utils/crypto.ts`.

### Rate Limiting (configured in `main.ts`)

| Scope | Default limit | Window |
|-------|--------------|--------|
| `/api` general | 120 req | 60s |
| `/api/auth/*` | 30 req | 60s |
| `/api/posts/feed` | 300 req | 60s |
| SPA index.html | 60 req | 60s |

Override with env vars: `API_RATE_LIMIT_WINDOW_MS`, `API_RATE_LIMIT_MAX`, `API_AUTH_RATE_LIMIT_MAX`, `API_FEED_RATE_LIMIT_MAX`.

### File Uploads

Use `FileInterceptor` from `@nestjs/platform-express`. Allowed image MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/tiff`. Max size: 100 MB. Always apply `MulterExceptionFilter` with `@UseFilters(new MulterExceptionFilter())` to translate Multer errors into proper HTTP responses.

### Static File Serving

In production (`NODE_ENV=production`), NestJS/Express serves the built React SPA from `dist/public/`. Non-`/api` routes fall through to `index.html` for client-side routing. In development, Vite's dev server proxies `/api` to port 3000.

---

## 5. Frontend — `astrogram/`

### Directory Structure

```
src/
├── components/
│   ├── AdminAnalyticsDashboard.tsx
│   ├── Articles/         ← Article list + TipTap editor components
│   ├── BottomNavbar/     ← Mobile bottom navigation
│   ├── Comments/         ← Comment thread components
│   ├── FormMessage.tsx
│   ├── Games/            ← Constellation navigation game UI
│   ├── Icons/            ← Custom SVG icon components
│   ├── Layout/           ← Page layout wrapper
│   ├── LinkPreviewCard.tsx
│   ├── LoungePostModal.tsx
│   ├── MilestoneBadge.tsx
│   ├── Modal/            ← Generic modal
│   ├── Navbar/           ← Top navigation bar
│   ├── PostCard/         ← Post display + interaction buttons
│   ├── Profile/          ← Profile header, stats, social links
│   ├── SessionExpiredModal.tsx
│   ├── Sidebar/          ← Desktop sidebar
│   ├── UploadForm/       ← Post creation form
│   └── Weather/          ← Weather widget + tests
├── contexts/
│   ├── AuthContext.tsx         ← Auth state, login/logout, user preferences
│   ├── NotificationContext.tsx ← Unread notification count
│   ├── ThemeContext.tsx        ← Dark mode toggle
│   └── AnalyticsContext.tsx    ← Analytics event tracking
├── hooks/
│   ├── useAuth.ts          ← Accesses AuthContext
│   ├── useNotifications.ts ← Accesses NotificationContext
│   ├── useAnalytics.ts     ← Event tracking helpers
│   ├── useGeolocation.ts   ← Browser geolocation
│   └── useWeatherService.ts
├── lib/
│   └── api.ts              ← All API calls, token injection, refresh logic
├── pages/                  ← One file per route
└── types/                  ← Shared TypeScript interfaces
```

### Pages (Routes)

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
| `AuthSuccessPage.tsx` | `/auth/success` | — |
| `SupabaseAuthCallbackPage.tsx` | `/auth/callback` | — |

### API Client (`lib/api.ts`)

All backend calls go through `lib/api.ts`. It handles:
- Injecting the Bearer token from an in-memory variable
- Auto-retry with refresh token on 401 responses
- Token storage in `localStorage` as `ACCESS_TOKEN`

**Use `apiFetch(path, options?)` for all authenticated API calls**, not raw `fetch`.

### Auth State (`contexts/AuthContext.tsx`)

On mount, `AuthContext`:
1. Reads `ACCESS_TOKEN` and `USER_SNAPSHOT` from `localStorage`
2. Validates the stored token against `/api/users/me`
3. On failure, attempts silent refresh via `/api/auth/refresh` (uses httpOnly cookie)
4. Falls back to logged-out state

The `User` interface in `AuthContext.tsx` is the canonical frontend user type.

### Theming

- Dark mode controlled by `ThemeContext` (adds/removes `dark` class on `<html>`)
- Accent colors: `BRAND` (purple `#7c3aed`), `OCEAN`, `MINT` — stored in user preferences, applied via Tailwind utility classes
- Tailwind custom brand palette defined in `tailwind.config.ts`

### Vite Dev Proxy

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:3000',
  },
},
```

The frontend dev server (port 5173) proxies all `/api/*` requests to the NestJS backend (port 3000). No CORS issues in development.

---

## 6. Database — Prisma Schema

Schema file: `backend/prisma/schema.prisma`

### Models

| Model | Key fields | Notes |
|-------|-----------|-------|
| `User` | `id`, `emailEncrypted`, `emailHash`, `username`, `provider`, `providerId` | Email stored encrypted + hashed. Role: `USER` or `ADMIN` |
| `Post` | `id`, `authorId`, `originalAuthorId`, `body`, `title`, `loungeId` | `originalAuthorId` tracks repost origin |
| `Comment` | `id`, `postId`, `authorId`, `parentId` | `parentId` enables nested replies |
| `CommentLike` | unique per `(commentId, userId)` | |
| `PostInteraction` | unique per `(postId, userId, type)` | type: LIKE, SHARE, REPOST |
| `SavedPost` | unique per `(userId, postId)` | |
| `Notification` | `userId`, `actorId`, `type`, `read` | |
| `Lounge` | `id`, `name` (unique), `bannerUrl`, `profileUrl` | |
| `AnalyticsSession` | `sessionKey`, `userId?` | |
| `AnalyticsEvent` | `type`, `targetType`, `targetId`, `metadata` | |
| `RequestMetric` | `route`, `method`, `statusCode`, `durationMs` | |
| `UserSocialAccount` | `userId`, `platform`, `url` | Platforms: TWITTER, INSTAGRAM, TIKTOK, YOUTUBE, LINKEDIN, GITHUB, WEBSITE, OTHER |
| `Article` | `slug` (unique), `status` (DRAFT/PUBLISHED), `authorId` | |
| `GameScore` | `gameId`, `userId?`, `displayName`, `score`, `rounds` | `userId` nullable for anonymous |

### Enums

```
InteractionType:  LIKE | SHARE | REPOST
NotificationType: POST_LIKE | COMMENT | COMMENT_LIKE | FOLLOW | REPOST
TemperatureUnit:  C | F
AccentColor:      BRAND | OCEAN | MINT
ArticleStatus:    DRAFT | PUBLISHED
SocialPlatform:   TWITTER | INSTAGRAM | TIKTOK | YOUTUBE | LINKEDIN | GITHUB | WEBSITE | OTHER
```

### Prisma Migrations

```bash
cd backend
npx prisma migrate dev --name describe_your_change   # create + apply migration
npx prisma migrate deploy                             # apply in production
npx prisma generate                                   # regenerate client after schema changes
```

**Important**: When adding a new enum value to an existing PostgreSQL enum with `ALTER TYPE ... ADD VALUE`, it **cannot run inside a transaction**. Use a raw SQL migration that disables transactions. See existing migrations for the pattern.

### PrismaService

`src/prisma/prisma.service.ts` wraps `PrismaClient` as a NestJS injectable. Always inject `PrismaService` in services; never instantiate `PrismaClient` directly (except `AuthService`, which has a legacy direct instance).

---

## 7. Authentication & Authorization

### Flow

1. User clicks "Sign in with Google" → frontend redirects to `/api/auth/google`
2. Passport Google strategy handles OAuth callback at `/api/auth/google/callback`
3. `AuthService.validateOAuthLogin()` upserts the user in the DB
4. Backend sets an httpOnly refresh token cookie and redirects frontend to `/auth/success?token=<accessToken>`
5. `AuthSuccessPage` reads the token from the URL, calls `AuthContext.login()`, stores token in `localStorage`
6. Subsequent requests include `Authorization: Bearer <accessToken>` header

For Supabase email/password auth, the callback goes through `/auth/callback` → `SupabaseAuthCallbackPage`.

### Token Lifetimes

- Access token: 15 minutes (signed with `JWT_SECRET`)
- Refresh token: 7 days (signed with `JWT_REFRESH_SECRET`, stored as httpOnly cookie)

### Admin Role

Check `user.role === 'ADMIN'` in services/controllers. The `role` field on `User` defaults to `"USER"`. Admin routes should throw `ForbiddenException` for non-admins.

---

## 8. Feed Algorithm

Implemented in `PostsService` (`backend/src/posts/post.service.ts`).

### Feed Modes

- **For You** (default): Algorithmic, works for anonymous users. Scores posts and applies diversity filter.
- **Following**: Chronological posts from followed users only. Requires authentication.

### Scoring Formula

```
recencyWeight = max(0.05, 2^(-ageHours / 6))   // half-life: 6 hours

engagementScore =
  comments × 4 +
  likes    × 1 +
  saves    × 3 +
  reposts  × 2 +
  shares   × 1

authorBoost = followedAuthor ? 1.5 : 1.0
loungeBoost = followedLounge ? 1.3 : 1.0

score = engagementScore × (1 + recencyWeight) × authorBoost × loungeBoost + recencyWeight × 8
```

### Diversity Filter

At most **2 posts per author** in any sliding window of **10 posts**.

### Candidate Pool

Capped at `min(limit × 5, 100)` recent posts to avoid unbounded memory use.

---

## 9. Testing Conventions

### Running Tests

```bash
cd backend

npm run test:unit    # Unit tests only (with coverage)
npm run test:e2e     # E2E tests only
npm run test         # Unit + E2E
npm run test:watch   # Watch mode (unit)
```

### Unit Tests

- Files: `src/**/*.spec.ts`
- Pattern: co-located with the source file (e.g., `post.service.spec.ts` beside `post.service.ts`)
- Framework: Jest + ts-jest

### E2E Tests

- Files: `test/*.e2e-spec.ts`
- Config: `test/jest-e2e.json`

### Mock Factories (`src/test-utils/mocks.ts`)

Always use the shared mock factories for consistency:

```typescript
import {
  createMockPrisma,
  createMockStorage,
  createMockNotifications,
  createMockAnalytics,
} from '../test-utils/mocks';

beforeEach(() => {
  prisma = createMockPrisma();
  // ...
  service = new MyService(prisma as unknown as PrismaService, ...);
});
```

### NestJS Logger in Tests

`jest.setup.ts` silences all logger methods so tests produce clean output. `logger.error` still prints to stderr in **red** with the `(expected error)` prefix — intentional error paths in tests are thus visually distinguishable from test failures.

If a spec intentionally calls code that logs an error, no special annotation is needed — it will appear as `(expected error) <message>` in the test output.

### Custom Reporter

`src/test-utils/green-reporter.js` is a custom Jest reporter that:
- Prints `PASS` in green, `FAIL` in red
- Shows test names with pass/fail indicators
- Strips the "Uncovered Line #s" column from coverage output

It is registered in `package.json` under `jest.reporters`.

### Coverage

Coverage reports to `coverage/` directory. Run `npm run test:cov` to generate.

### Frontend Tests

Only `src/components/Weather/__tests__/*.test.ts` are tested using Node's built-in test runner:

```bash
cd astrogram
npm test
```

---

## 10. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Access token signing secret |
| `JWT_EXPIRATION` | Yes | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret |
| `JWT_REFRESH_EXPIRATION` | Yes | Refresh token TTL (e.g. `7d`) |
| `EMAIL_ENCRYPTION_KEY` | Yes | AES-256 key for email encryption |
| `SUPA_URL` | Yes | Supabase project URL |
| `SUPA_SERVICE_KEY` | Yes | Supabase service role key (never bake into image) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth app client secret |
| `FACEBOOK_APP_ID` | No | Facebook OAuth app ID |
| `FACEBOOK_APP_SECRET` | No | Facebook OAuth app secret |
| `OPENAI_API_KEY` | No | OpenAI key for moderation |
| `FRONTEND_URL` | No | Comma-separated CORS origins for production |
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `production` enables static file serving from `dist/public/` |
| `API_RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: `60000`) |
| `API_RATE_LIMIT_MAX` | No | General API rate limit (default: `120`) |
| `API_AUTH_RATE_LIMIT_MAX` | No | Auth endpoint rate limit (default: `30`) |
| `API_FEED_RATE_LIMIT_MAX` | No | Feed endpoint rate limit (default: `300`) |

### Frontend (Vite build-time, must be set as `--build-arg` in Docker)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base URL for production (e.g. `https://api.example.com/api`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |

These are baked into the frontend bundle at build time. In development, the Vite proxy makes `VITE_API_BASE_URL` unnecessary.

---

## 11. Development Workflow

### Local Setup

```bash
# Backend
cd backend
npm install
# create backend/.env from the table above
npm run start:dev       # starts NestJS on http://localhost:3000

# Frontend (separate terminal)
cd astrogram
npm install
npm run dev             # starts Vite on http://localhost:5173
```

The Vite dev server proxies `/api` → `http://localhost:3000`, so no CORS config needed locally.

### Adding a New Feature Module

1. Create `backend/src/<feature>/` directory with `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, and `dto/` subdirectory.
2. Register the module in `backend/src/app.module.ts` imports.
3. Use `@Controller('api/<feature>')` convention.
4. Write unit tests in `<feature>.controller.spec.ts` and `<feature>.service.spec.ts`.

### Adding a New Frontend Page

1. Create `astrogram/src/pages/MyPage.tsx`.
2. Add the route in the React Router config (look for `<Route>` definitions in `main.tsx` or the router setup file).
3. If the page needs auth, redirect to `/signup` when `user` is null in `AuthContext`.

### Updating the Database Schema

1. Edit `backend/prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <description>` inside `backend/`.
3. Run `npx prisma generate` to update the Prisma client.
4. Update any affected service DTOs and types.

### Code Formatting

```bash
# Backend
cd backend
npm run format          # Prettier on src/ and test/
npm run lint            # ESLint --fix

# Frontend
cd astrogram
npm run lint
```

Backend uses **Prettier** (`.prettierrc`: single quotes, trailing commas). ESLint config in `eslint.config.mjs`.

---

## 12. Deployment & CI/CD

### Docker Build

The multi-stage `Dockerfile` at the repo root:
1. **Stage 1** (`frontend-builder`): Builds the React SPA. Requires `VITE_*` build args.
2. **Stage 2** (`backend-builder`): Compiles NestJS, runs `prisma generate`, copies frontend `dist/` into `backend/public/`.
3. **Stage 3** (final): Copies compiled backend and `public/` folder. Runs `node dist/main` on port 3000.

```bash
docker build \
  --build-arg VITE_API_BASE_URL=... \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_ANON_KEY=... \
  -t astrolounge .
```

### GitHub Actions (`.github/workflows/docker-image.yml`)

Triggers on push/PR to `main`:

1. **test** job: Runs `npm ci && npm test` in `backend/`
2. **build** job (after test): Builds and pushes Docker image to `registry.fly.io/astrosocial:<sha>`; validates Supabase secrets are non-empty
3. **deploy-dev** job (push to main only): Deploys to Fly.io dev environment

Secrets required in GitHub repo settings (not environment-scoped):
- `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `FLY_API_TOKEN`

### Fly.io

- Production: `fly.toml`
- Dev/staging: `fly.dev.toml`
- Set runtime secrets via: `fly secrets set KEY=value`
- The `SUPA_SERVICE_KEY` must be set as a Fly runtime secret (never baked into the image)

---

## 13. Key Patterns & Conventions

### Naming

- Backend files: `kebab-case.ts` (e.g., `post.service.ts`, `jwt-auth.guard.ts`)
- Frontend files: `PascalCase.tsx` for components/pages, `camelCase.ts` for utilities/hooks
- DTOs: `PascalCaseDto` (e.g., `CreatePostDto`, `FeedResponseDto`)
- Database IDs: `uuid()` default on all models

### DTOs & Validation

Use `class-validator` decorators in DTOs. The global `ValidationPipe({ whitelist: true })` strips unknown properties and validates all incoming request bodies.

### Service Injection Pattern

```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly storage: StorageService,
  // ...
) {}
```

### Idempotent Interactions

Interactions (likes, saves) are idempotent — duplicate writes are silently ignored (Prisma P2002 caught and swallowed). Saves use `create` + catch P2002; unsaves use `delete` + catch P2025.

### Post Body Field Naming

In the DB the post text column is `body`, but the API/frontend calls it `caption`. The `shapePost()` private method in `PostsService` maps `body → caption` when building feed response objects. Keep this mapping in mind when working with post data.

### Repost Mechanics

A repost copies the original post with:
- `authorId` = reposter's ID
- `originalAuthorId` = original author's ID

When `authorId !== originalAuthorId`, the post is displayed as "reposted by @username".

### Streak Tracking

After every new post creation, `updateStreak()` is called non-blockingly (`void this.updateStreak(userId)`). It updates `currentStreak`, `longestStreak`, `lastPostDate`, and `postMilestone` on the User.

Milestones: 1, 10, 25, 50, 100, 250, 500 posts.

### Analytics

Call `this.analytics.recordCanonicalEvent({ userId, type, targetType, targetId, metadata })` in services after significant actions (likes, interactions). Event types follow the pattern `<entity>.<action>` (e.g., `post.like`, `post.unlike`, `post.share`).

---

## 14. Domain Glossary

| Term | Meaning |
|------|---------|
| **Lounge** | A topic-based community (like a subreddit). Posts in a lounge require a `title` + rich body |
| **Interaction** | A LIKE, SHARE, or REPOST action on a post (tracked in `PostInteraction`) |
| **Stars** | The frontend display name for post likes |
| **Repost** | Creates a copy of the post under the reposter's profile; original authorship is preserved |
| **Save** | Bookmarking a post to a personal saved list |
| **Feed mode** | "For You" (algorithmic) or "Following" (chronological from followed users) |
| **Streak** | Consecutive days a user has created at least one post |
| **Milestone** | A post count achievement (1, 10, 25, 50, 100, 250, 500) displayed as a badge |
| **Accent** | User-chosen color theme: BRAND (purple), OCEAN (blue), MINT (green) |
| **True North** | The constellation navigation game (`/games/true-north`) |
| **Article** | Long-form content created by admins using the TipTap editor, distinct from regular posts |
| **Unfurl** | URL metadata extraction (title, description, image, site name) for link previews |
| **Provider** | Auth provider: `google`, `facebook`, or `supabase` (email/password) |

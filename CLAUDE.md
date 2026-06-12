# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js with Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

No test suite is configured.

## Architecture Overview

**litelelo** is a social platform for BITS Hyderabad students (BITSians). It is a Next.js 16 App Router project with React 19 and TypeScript.

### Data stores

| Store | Purpose | Client |
|---|---|---|
| Supabase (Postgres) | Primary — auth, profiles, posts, communities, chat, events, marketplace, etc. | `src/services/supabase.ts` |
| MongoDB | Paper-trading easter-egg feature (`litelelo_trading` DB) | `src/services/mongodb.ts` |
| Upstash Redis | Optional caching (gracefully degrades if unconfigured) | `src/services/redis.ts` |

All Supabase schema changes are tracked as SQL migrations in `supabase/migrations/`. The full schema snapshot is `schema.sql`. The Supabase client uses the anon key on the client side; API routes that need to bypass RLS instantiate a separate admin client with `SUPABASE_SERVICE_ROLE_KEY`.

### Required environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_KEY
SUPABASE_SERVICE_ROLE_KEY   # server-side only
GEMINI_API_KEY               # comma-separated for key rotation
MONGODB_URI                  # trading feature
UPSTASH_REDIS_REST_URL       # optional
UPSTASH_REDIS_REST_TOKEN     # optional
```

### Context providers

`src/components/Providers.tsx` wraps the app in this order:
```
ThemeProvider → AuthProvider → PostsProvider → ChatProvider → NotificationProvider
```

Hooks like `useAuth`, `useChat`, `usePosts`, `useNotifications` are thin wrappers that consume these contexts and must be used inside `Providers`.

### App shell

`AppShell.tsx` gates the layout: auth pages (`/login`, `/profile-setup`) render children bare; `/chat` and `/campus/*` get full-width layout; all other authenticated routes get `LeftSidebar` + `BottomNavBar`.

### API routes (`src/app/api/`)

- `ai-reply/` — Gemini-powered AI comment generation (rotates across multiple API keys)
- `trading/*` — Paper trading backed by MongoDB
- `feed/public/` — Public post feed
- `profile/[username]/` and `profile/by-id/[userId]/` — Profile lookups
- `communities/for-user/[userId]/` — Community membership
- `suggestions/follow/` — Follow suggestions

### Chat encryption

`src/services/encryption.ts` implements client-side E2EE for DMs using Web Crypto API (PBKDF2). There is a silent migration path from a legacy Argon2 scheme. Private keys are stored encrypted in Supabase; the in-memory `privateKey` / `publicKey` pair is unlocked at runtime via an encryption PIN modal.

### AI integration

Uses `@google/generative-ai` directly (not Vercel AI SDK). The `/api/ai-reply` route accepts `{ postId, content, parentId }` and posts AI-generated replies back to Supabase.

### Product direction (from `.gemini/implementation_plan.md`)

The platform is pivoting toward a focused "information backbone" for BITS Hyderabad — student projects, club/org announcements, blogs, and student-built tools. Features like paper trading, blockchain/BITs-coin, campus marketplace, and rideshare are being demoted to easter-egg/subdomain status. Keep this direction in mind when adding features or adjusting navigation.

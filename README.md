# litelelo

A full-featured social network built for **BITS Pilani students** — home feed, communities, real-time chat, campus utilities, and a few easter eggs.

> **What the name means:** "Lite lelo" is campus slang for "take it easy" — the whole spirit of the site.

## What this is (and isn't)

litelelo was built by a BITS Hyderabad student, for BITSians. It's a real, working social network — but it is **not a turnkey product** you can plop down for any college. BITS Pilani specifics (campuses, branches, dorms, messes, email domains) are hardcoded in several places, and you'd need to change them by hand (see [Adapting it for your college](#adapting-it-for-your-college)).

Think of it as a **reference implementation**: if you want to build a social network for your own college, this codebase shows one complete way to do it — auth, feeds, chat, communities, notifications, the works. Fork it, rip out what you don't need, and make it yours.

> **Just looking around?** The live site is at [litelelo.in](https://litelelo.in) — sign-up isn't gated on a BITS email domain, so anyone can create an account and explore it, even if you're not a BITSian.

A more polished, properly configurable "spin up a social network for your college" version may be published separately in the future.

## Features

### Core social
- **Home feed** — text posts, images, polls, quote posts, reposts, mentions, and AI-generated replies (mention `@rock` in a post — Gemini API-powered)
- **Communities** — create/join communities with sub-communities, pinned posts, and per-community feeds
- **Chat** — direct messages and group chats over Supabase Realtime, with presence/online status
- **Profiles** — avatars and banners, bios, follow/friend system, bookmarks, reputation
- **Search & directory** — fuzzy search across users and content, plus a student directory
- **Notifications** — real-time via Supabase Realtime
- **Blogs** — long-form posts with a dedicated reader view

### Campus tools (`/campus`)
- **Noticeboard**, **Events** (with a calendar view), **Lost & Found**, **Confessions** (anonymous), **Campus Reviews**, and **Built @ BITS** (student-made tools)

### Easter eggs (an honest note)
Some features here — **paper trading** (`/easter-egg/trading`, backed by MongoDB), a toy **blockchain + BITs-coin** (`/easter-egg/blockchain`), a **marketplace**, and **rideshare** — don't really serve the core purpose of a campus social network. They were built because they sounded cool to build (the classic engineer's trap). They're kept as easter eggs because they're fun, but they're the first things to delete if you're forking this for something serious.

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Primary database / auth / realtime | Supabase (Postgres, Row Level Security, Realtime) |
| Paper trading DB | MongoDB |
| Caching (optional) | Upstash Redis |
| AI | Google Gemini (`@google/generative-ai`) |

## Getting started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- (Optional) MongoDB Atlas account — only for the paper-trading easter egg
- (Optional) Upstash Redis — graceful degradation if unset
- (Optional) Gemini API key — only for AI replies

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local`** in the repo root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=              # your Supabase project URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # the new sb_publishable_... key (client-side)
   SUPABASE_SECRET_KEY=                   # the new sb_secret_... key (server-side only, bypasses RLS)
   GEMINI_API_KEY=                        # optional, comma-separated for key rotation
   MONGODB_URI=                           # optional, paper trading only
   UPSTASH_REDIS_REST_URL=                # optional
   UPSTASH_REDIS_REST_TOKEN=               # optional
   ```

3. **Set up the database:** apply the schema in [`schema.sql`](schema.sql) to your Supabase project, then apply the SQL migrations in [`supabase/migrations/`](supabase/migrations/) in order.

4. **Run it:**
   ```bash
   npm run dev
   ```

   The site will be at `http://localhost:3000`. Auth is email + password via Supabase; new users go through a profile-setup flow on first login.

## Adapting it for your college

BITS Pilani is baked in. If you're forking this, these are the main places to look:

- **Academic/campus data:** `src/data/bitsBranches.ts`, `src/data/bitsDorms.ts`, `src/data/bitsMesses.ts` — degrees, branches, hostels, and messes per campus, used in profile setup and profiles
- **Campus detection:** `BITS_CAMPUS_MAP` in `src/app/profile-setup/page.tsx` (maps email subdomains like `hyderabad` / `goa` / `pilani` to campuses)
- **Branding and copy:** `src/components/LandingPage.tsx`, `src/app/layout.tsx`, `src/app/help/page.tsx` — "exclusive to BITS campuses" text etc.
- **Legal pages:** `src/app/terms/page.tsx` and `src/app/privacy/page.tsx` reference BITS Pilani eligibility and contain hardcoded contact emails — you'll want to replace these wholesale
- **Campus pages:** anything under `src/app/campus/` is BITS-specific by design (mess menus, dorms, the campus map)

Note that RLS policies on the Supabase side are written around this schema, so if you change table structures, budget time for updating those too.

## Project structure

```
src/
├── app/            # App Router pages and API routes
│   ├── api/        # AI replies, trading, feed, profile lookups
│   ├── campus/     # noticeboard, events, confessions, marketplace, ...
│   └── ...
├── components/     # UI components (feed, chat, profiles, modals, ...)
├── contexts/       # Auth, Posts, Chat, Notification, Theme providers
├── data/           # BITS-specific static data (branches, dorms, messes)
├── hooks/          # Thin wrappers around the context providers
├── services/       # Supabase, MongoDB, Redis clients
├── types/          # Shared TypeScript types
└── utils/          # Time formatting, image cropping, mentions, embeds
```

The app shell wraps everything in providers (`ThemeProvider → AuthProvider → PostsProvider → ChatProvider → NotificationProvider`) — hooks like `useAuth` and `useChat` must be used inside that tree. All database schema changes are tracked in `supabase/migrations/`.

## Contributing / contact

This started as a personal project for my campus, so it isn't set up with contribution guidelines — but if you have ideas (especially around making this genuinely configurable for other colleges), feel free to reach out or open an issue.

## License

[MIT](LICENSE) — fork it, adapt it for your college, no strings attached.

# litelelo Pivot — Implementation Plan

## The Vision
Transform litelelo from a "feature buffet" into **the information backbone of BITS Hyderabad** — a focused platform for:
1. **Showcasing student projects** (a genuine, no-corny-posts college LinkedIn)
2. **Club & startup announcements + recruiting** (noticeboard on steroids)
3. **Blogs & newsletters** about campus life
4. **Surfacing cool student-built tools** (H4U, QuietSpace, Campus 101, etc.)

> **One-line north star:** *"If it doesn't help someone discover, learn, or build something — it shouldn't be on the main site."*

---

## Current Feature Audit

### ✅ KEEP (core to the new vision)
| Feature | Why | Changes Needed |
|---|---|---|
| **Home Feed** (posts, For You / Following / Campus tabs) | Core content medium — blogs, project showcases, announcements all live here | Elevate blog posts & project showcases in the feed ranking |
| **Blog reader** (`/blog/[id]`) | Beautiful reading experience already built — this IS the medium | Add a blog index/discovery page |
| **Communities** (`/communities`) | Clubs & startups become communities that post announcements | Reframe as "Clubs & Orgs" in nav/copy |
| **Noticeboard** (`/campus/noticeboard`) | Official announcements — core info utility | Promote to first-class nav item |
| **Events** (`/campus/events`) | Club recruitment, hackathons, talks | Promote to first-class nav item |
| **Profile** (`/profile/[username]`) | Project portfolio lives here | Add "Projects" section to profile |
| **Chat** (`/chat`) | DMs for networking/recruiting | Keep as-is |
| **Search** (`/search`) | Discovery | Keep as-is |
| **Directory** (`/directory`) | Finding people | Keep as-is |
| **Lost & Found** (`/campus/lost-and-found`) | Genuine utility, low maintenance | Keep but demote from home page prominence |
| **Confessions** (`/campus/confessions`) | Engagement driver, community building | Keep but demote from campus page hero spot |

### 🫣 HIDE → Subdomain (don't delete, just move off main nav)
| Feature | Current Location | Subdomain |
|---|---|---|
| **Paper Trading** | `/easter-egg/trading`, `/api/trading/*` | `trading.litelelo.com` |
| **Blockchain/Bits-Coin** | `/easter-egg/blockchain`, `/campus/bits-coin` | `coin.litelelo.com` (or just hide behind easter egg) |
| **Campus Map** | `/campus/map` | Remove from nav; keep route alive but unlisted |
| **Campus Reviews (Yelp-like)** | `/campus/reviews` | `reviews.litelelo.com` |
| **Marketplace** | `/campus/marketplace` | `market.litelelo.com` |
| **Rideshare** | `/campus/rideshare` | Remove from nav; keep route alive but unlisted |

### 🚀 NEW (to be built)
| Feature | Description | Priority |
|---|---|---|
| **Student Projects Showcase** | Profile section + dedicated feed/page for project cards (title, description, links, media) | 🔴 P0 |
| **Student Tools Directory** | Dedicated page for H4U, QuietSpace, Campus 101, and future student-built tools | 🔴 P0 |
| **Blog Discovery Page** | `/blog` index page — featured, recent, trending blogs | 🟡 P1 |
| **Newsletter subscribe** | Email/push subscription for community updates | 🟢 P2 |

---

## Implementation Phases

### Phase 1: Declutter & Reorganize Navigation (1-2 days)
> *Goal: Immediately make the site feel focused. No new features, just restructure.*

#### 1.1 Simplify the Left Sidebar (`LeftSidebar.tsx`)
**Current nav items:** Home, Campus, Communities, Search, Chat, Directory, Profile

**New nav items:**
```
Home (feed)
Explore (replaces "Campus" — blogs, events, announcements, projects)
Communities → rename to "Clubs & Orgs"
Search
Chat
Directory
Profile
```

**Files to edit:**
- `src/components/LeftSidebar.tsx` — restructure nav links
- `src/components/BottomNavBar.tsx` — match mobile nav

#### 1.2 Rebuild the Campus Page → "Explore" Page (`/campus/page.tsx`)
**Current state:** 9-card bento grid with Reviews, Marketplace, Noticeboard, Lost & Found, Events, H4U, Confessions, QuietSpace, Campus 101, plus Quick Actions.

**New "Explore" page layout:**
```
┌──────────────────────────────────────────────┐
│  HERO: "What's Happening at BITS"            │
├──────────────────────────────────────────────┤
│                                              │
│  📰 ANNOUNCEMENTS & NOTICES (prominent)      │
│  Latest noticeboard items + pinned           │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  📅 UPCOMING EVENTS (cards)                  │
│  Filterable by club/type                     │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  📝 FEATURED BLOGS (horizontal scroll)       │
│  Curated / trending blog posts               │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  🚀 STUDENT PROJECTS (new!)                  │
│  Showcase cards with links                   │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  🛠️ STUDENT TOOLS (new section)              │
│  H4U, QuietSpace, Campus 101 + submit yours │
│                                              │
├──────────────────────────────────────────────┤
│  Quick Links: Lost & Found | Confessions     │
│  (small, utility — not hero cards)           │
└──────────────────────────────────────────────┘
```

**Files to edit:**
- `src/app/campus/page.tsx` — complete rebuild to the new "Explore" layout

#### 1.3 Hide features from nav (not delete)
- Remove from campus bento grid: Reviews, Marketplace, Map, Rideshare, Bits-Coin
- Remove from Quick Actions: Campus Map, Sell Item, HelpOut (Bits-Coin)
- Remove CryptoHubWidget from HomePage sidebar
- Keep all routes alive (so existing links don't break)

**Files to edit:**
- `src/app/campus/page.tsx` — remove hidden feature cards
- `src/components/HomePage.tsx` — remove CryptoHubWidget, remove listings/marketplace cards from feed

---

### Phase 2: Student Tools Directory Page (1 day)
> *Goal: Give H4U, QuietSpace, Campus 101 a proper home, and let students submit their own tools.*

#### 2.1 Create `/campus/tools` page
A clean grid of student-built tools/websites with:
- Tool card: name, description, screenshot, link, creator profile link
- "Submit your tool" CTA

**New files:**
- `src/app/campus/tools/page.tsx`

#### 2.2 Supabase table for student tools
```sql
CREATE TABLE student_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  screenshot_url TEXT,
  creator_id UUID REFERENCES profiles(id),
  campus TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
Seed with H4U, QuietSpace, Campus 101 as pre-approved entries.

**New files:**
- `supabase/migrations/add_student_tools.sql`

---

### Phase 3: Student Projects on Profile (1-2 days)
> *Goal: Turn profiles into portfolios. This is the "mini LinkedIn" piece.*

#### 3.1 Supabase table for projects
```sql
CREATE TABLE student_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  github_url TEXT,
  image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2 Profile page — "Projects" tab
Add a "Projects" tab to the profile page that renders project cards.

**Files to edit:**
- `src/app/profile/[username]/page.tsx` — add Projects tab
- **New:** `src/components/ProjectCard.tsx`
- **New:** `src/components/AddProjectModal.tsx`

#### 3.3 Projects feed on Explore page
Show a "Featured Projects" section on the Explore page pulling from `student_projects` ordered by recency.

---

### Phase 4: Blog Discovery Page (1 day)
> *Goal: Make blogs first-class citizens, not just a post type.*

#### 4.1 Create `/blog` index page
- Featured/pinned blogs at top
- Recent blogs in a grid
- Filter by community/author

**New files:**
- `src/app/blog/page.tsx`

#### 4.2 Add "Write a Blog" CTA
Prominent CTA in the blog page and in the create post flow.

---

### Phase 5: Subdomain Configuration (½ day)
> *Goal: Move hidden features to subdomains so they're not dead but not cluttering the main site.*

#### 5.1 Next.js middleware or Vercel rewrites
In `next.config.ts` or `vercel.json`, configure:
```
trading.litelelo.com → /easter-egg/trading
coin.litelelo.com    → /easter-egg/blockchain  
reviews.litelelo.com → /campus/reviews
market.litelelo.com  → /campus/marketplace
```

This keeps all code in one repo but routes subdomain traffic to existing pages.

**Files to edit:**
- `next.config.ts` — add rewrites
- Vercel dashboard — add subdomain aliases

---

## Priority Order (What to do first)

| Order | Phase | Impact | Effort |
|---|---|---|---|
| 1️⃣ | **Phase 1** — Declutter nav + rebuild campus→explore page | 🔥 Immediate visual transformation | Medium |
| 2️⃣ | **Phase 2** — Student Tools directory | 🔥 Quick win, moves H4U/etc cards out properly | Small |
| 3️⃣ | **Phase 4** — Blog discovery page | 📈 Makes content discoverable | Small |
| 4️⃣ | **Phase 3** — Student projects on profile | 📈 The LinkedIn-killer feature | Medium |
| 5️⃣ | **Phase 5** — Subdomains | 🧹 Cleanup, not user-visible | Small |

---

## What NOT to do
- ❌ Don't delete any routes — just hide from navigation
- ❌ Don't remove database tables — the data is still useful  
- ❌ Don't over-redesign the home feed — it works, just needs priority reshuffling
- ❌ Don't add new features before decluttering — resist the urge

---

## Summary of File Changes

### Modified files:
1. `src/components/LeftSidebar.tsx` — new nav structure
2. `src/components/BottomNavBar.tsx` — match mobile nav  
3. `src/app/campus/page.tsx` — complete rebuild to "Explore"
4. `src/components/HomePage.tsx` — remove hidden feature widgets
5. `src/app/profile/[username]/page.tsx` — add Projects tab
6. `next.config.ts` — subdomain rewrites

### New files:
1. `src/app/campus/tools/page.tsx` — Student Tools directory
2. `src/app/blog/page.tsx` — Blog discovery page
3. `src/components/ProjectCard.tsx` — Project showcase card
4. `src/components/AddProjectModal.tsx` — Add project form
5. `supabase/migrations/add_student_tools.sql` — Tools table
6. `supabase/migrations/add_student_projects.sql` — Projects table

# Community Page Recent Communities Feature

## Overview
This update adds a "Recent" section to the community page that displays the 5 most recently visited communities at the top, followed by a "Browse" or "Discover" section for other communities.

## Changes Made

### 1. Database Changes (SQL Migration)
**File:** `/Users/stponnada/Desktop/litelelo/add_community_last_visited.sql`

This migration adds:
- A `last_visited_at` column to the `community_members` table
- A new RPC function `update_community_last_visited()` to update the timestamp when a user visits a community
- Updates to the `get_communities_list()` RPC to include the `last_visited_at` field

**To apply these changes:**
1. Open your Supabase SQL editor
2. Copy and paste the contents of `add_community_last_visited.sql`
3. Execute the SQL script

### 2. Frontend Changes

#### Communities List Page (`src/app/communities/page.tsx`)
- Updated `CommunityListItem` interface to include `last_visited_at` field
- Modified the filtering logic to separate communities into:
  - **Recent Communities**: The 5 most recently visited communities (sorted by `last_visited_at`)
  - **Other Communities**: All remaining communities
- Updated the UI to show two distinct sections:
  - "Recent" section (only shown on "My Communities" tab when not searching)
  - "All Communities" or regular browse section

#### Individual Community Page (`src/app/communities/[communityId]/page.tsx`)
- Added automatic tracking of community visits
- When a user visits a community page, the `update_community_last_visited()` RPC is called to update the `last_visited_at` timestamp
- This ensures the "Recent" section stays up-to-date with actual user behavior

## How It Works

1. **Visit Tracking**: When a user visits any community page, the `last_visited_at` timestamp is automatically updated in the `community_members` table.

2. **Automatic Refresh**: The communities list page automatically refreshes when:
   - The page first loads
   - The browser tab becomes visible again (using the Visibility API)
   - This ensures that when you navigate back from a community page, the Recent section updates immediately

3. **Recent Communities Display**: 
   - On the "My Communities" tab, communities are sorted by `last_visited_at` (most recent first)
   - The top 5 are displayed in a "Recent" section with a distinct visual separator
   - The remaining communities are shown in an "All Communities" section below

4. **Search Behavior**: When searching, the sections are merged and all matching communities are shown together.

5. **Discover Tab**: The "Discover" tab continues to show all non-member communities without the "Recent" section.

## Visual Design

The Recent section features:
- A green gradient accent bar on the left
- "Recent" heading in large, bold text
- A horizontal divider line
- The same community card design as before

The All Communities section (when Recent is shown above):
- Similar styling but with a lighter accent color
- "All Communities" heading
- Appears below the Recent section

## Testing

To test this feature:
1. Apply the SQL migration in Supabase
2. Visit several communities you're a member of
3. Go back to the Communities page and click on "My Communities" tab
4. You should see the 5 most recently visited communities at the top under "Recent"
5. All other communities appear below under "All Communities"

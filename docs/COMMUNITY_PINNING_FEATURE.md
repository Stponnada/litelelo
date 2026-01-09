# Community Pinning Feature

## Overview
This update adds the ability for users to pin communities to the top of their "My Communities" page, ensuring their favorite communities stay visible regardless of recent activity. It also changes the default tab to "My Communities" for a better user experience.

## Changes Made

### 1. Database Changes (SQL Migration)
**File:** `/Users/stponnada/Desktop/litelelo/add_community_pinning.sql`

This migration adds:
- An `is_pinned` column to the `community_members` table
- A new RPC function `toggle_community_pin()` to toggle the pin status
- Updates to the `get_communities_list()` RPC to include the `is_pinned` field

**To apply these changes:**
1. Open your Supabase SQL editor
2. Copy and paste the contents of `add_community_pinning.sql`
3. Execute the SQL script

### 2. Frontend Changes

#### Communities List Page (`src/app/communities/page.tsx`)

**Default Tab Change:**
- Changed default active tab from `'discover'` to `'my'`
- Users now see their communities first when visiting the page

**Pin Functionality:**
- Added `is_pinned` field to `CommunityListItem` interface
- Created `handleTogglePin()` function to toggle pin status via RPC
- Updated `CommunityCard` component to include a pin button
- Modified filtering logic to separate communities into three categories:
  1. **Pinned Communities**: Communities the user has pinned
  2. **Recent Communities**: The 5 most recently visited unpinned communities
  3. **Other Communities**: All remaining communities

**UI Updates:**
- Added pin button (bookmark icon) to community cards on "My Communities" tab
- Pinned communities show a filled yellow bookmark icon
- Unpinned communities show an outline bookmark icon
- Added "Pinned" section with yellow accent color
- Pin button appears on hover and is always visible on mobile

#### Individual Community Page (`src/app/communities/[communityId]/page.tsx`)
- No changes needed (already tracking visits from previous update)

## How It Works

### Pinning Communities
1. **Pin Button**: On the "My Communities" tab, each community card has a bookmark icon in the top-right corner
2. **Toggle Pin**: Click the bookmark to pin/unpin a community
3. **Visual Feedback**: Pinned communities have a filled yellow bookmark and appear in the "Pinned" section
4. **Persistent**: Pin status is saved to the database and persists across sessions

### Community Organization
Communities on "My Communities" tab are organized in this order:

1. **Pinned** (if any):
   - Shows all pinned communities
   - Yellow accent bar and bookmark icon
   - Not affected by visit frequency

2. **Recent** (if any unpinned communities):
   - Shows the 5 most recently visited unpinned communities
   - Green accent bar
   - Updates automatically when you visit communities

3. **All Communities** (if there are more than 5 unpinned):
   - Shows remaining communities
   - Lighter green accent bar

### Search Behavior
When searching, all sections merge and matching communities are shown together with pin buttons still available.

## Visual Design

### Pinned Section
- **Yellow gradient accent bar** on the left
- **Filled bookmark icon** in the heading
- **"Pinned" heading** in large, bold text
- Communities show filled yellow bookmark button

### Pin Button States
- **Unpinned**: Outline bookmark icon, white/gray background
- **Pinned**: Filled bookmark icon, green background
- **Hover**: Slight color change and scale effect

## Testing

To test this feature:

1. **Apply the SQL migration** in Supabase
2. Go to Communities page (should default to "My Communities" tab now)
3. **Hover over a community card** - you'll see a bookmark icon in the top-right
4. **Click the bookmark** to pin the community
5. The community should move to the "Pinned" section at the top
6. **Click again** to unpin it
7. Visit some communities and come back - they should appear in "Recent"
8. Pinned communities stay at the top regardless of when you last visited them

## Benefits

✅ **Quick Access**: Pin your most important communities for instant access
✅ **Stable Layout**: Pinned communities don't move around based on visit frequency  
✅ **Better UX**: Default to "My Communities" tab shows users their content first
✅ **Flexible Organization**: Combine pinning with automatic recent tracking
✅ **Visual Clarity**: Clear sections with distinct accent colors

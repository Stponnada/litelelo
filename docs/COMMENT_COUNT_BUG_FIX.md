# Comment Count Bug Fix

## Problem
The comment count on posts is showing 0 even when posts have replies/comments. This is visible in the UI where a post shows "0" comments despite having 2 nested replies.

## Root Cause
The system was migrated from using a separate `comments` table to using nested `posts` (where comments are posts with a `parent_post_id` field). However, the database trigger that updates the `comment_count` field was never updated to work with this new architecture.

### Current State:
- **Old System**: Comments were stored in a `comments` table with a `post_id` foreign key
- **New System**: Comments are stored as posts with a `parent_post_id` field pointing to the parent post
- **The Bug**: The trigger `on_comment_change` still watches the old `comments` table (line 4429 in schema.sql)
- **Result**: When new replies are created as nested posts, the parent post's `comment_count` is never incremented

## The Fix
Created a new SQL migration file: `fix_comment_count_for_nested_posts.sql`

This migration does 4 things:

1. **Creates a new trigger function** (`update_parent_post_comment_count`) that:
   - Increments the parent post's `comment_count` when a post with a `parent_post_id` is inserted
   - Decrements the parent post's `comment_count` when a post with a `parent_post_id` is deleted
   - Uses `GREATEST(0, comment_count - 1)` to prevent negative counts

2. **Creates a trigger** (`on_nested_post_change`) on the `posts` table that fires after INSERT or DELETE operations

3. **Recalculates all existing comment counts** by counting the actual number of child posts for each parent post

4. **Grants necessary permissions** to anon, authenticated, and service_role users

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `fix_comment_count_for_nested_posts.sql`
4. Paste and run the SQL

### Option 2: Using Supabase CLI
```bash
# If you have supabase CLI installed
supabase db execute -f fix_comment_count_for_nested_posts.sql
```

### Option 3: Using psql
```bash
# If you have direct database access
psql <your-connection-string> -f fix_comment_count_for_nested_posts.sql
```

## Verification
After applying the fix:
1. The existing posts should now show the correct comment counts
2. New replies/comments will automatically update the parent post's comment count
3. Deleting replies will decrement the count appropriately

## Files Modified
- Created: `/Users/stponnada/Desktop/litelelo/fix_comment_count_for_nested_posts.sql`

## Related Schema Elements
- **Table**: `public.posts` (line 4004 in schema.sql)
  - `comment_count` field (line 4010)
  - `parent_post_id` field (line 4024)
  - `root_post_id` field (line 4025)
- **Old Trigger**: `on_comment_change` (line 4429) - watches `comments` table
- **New Trigger**: `on_nested_post_change` - watches `posts` table

-- Fix comment count for nested posts
-- The issue: comment_count is not being updated when nested posts (replies) are created
-- The cause: The trigger only watches the old 'comments' table, but replies are now stored as posts with parent_post_id

-- Step 1: Create a new trigger function to update comment count for nested posts
CREATE OR REPLACE FUNCTION public.update_parent_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- When a nested post (reply) is created, increment the parent's comment count
        IF NEW.parent_post_id IS NOT NULL THEN
            UPDATE public.posts 
            SET comment_count = comment_count + 1 
            WHERE id = NEW.parent_post_id;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- When a nested post (reply) is deleted, decrement the parent's comment count
        IF OLD.parent_post_id IS NOT NULL THEN
            UPDATE public.posts 
            SET comment_count = GREATEST(0, comment_count - 1)
            WHERE id = OLD.parent_post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Step 2: Create the trigger on the posts table
DROP TRIGGER IF EXISTS on_nested_post_change ON public.posts;

CREATE TRIGGER on_nested_post_change
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_parent_post_comment_count();

-- Step 3: Fix existing comment counts by recalculating them
-- This will count all posts that have this post as their parent_post_id
UPDATE public.posts AS parent
SET comment_count = (
    SELECT COUNT(*)
    FROM public.posts AS child
    WHERE child.parent_post_id = parent.id
);

-- Step 4: Grant necessary permissions
GRANT ALL ON FUNCTION public.update_parent_post_comment_count() TO anon;
GRANT ALL ON FUNCTION public.update_parent_post_comment_count() TO authenticated;
GRANT ALL ON FUNCTION public.update_parent_post_comment_count() TO service_role;

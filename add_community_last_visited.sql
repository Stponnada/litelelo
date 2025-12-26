-- Add last_visited_at column to community_members table
ALTER TABLE public.community_members 
ADD COLUMN IF NOT EXISTS last_visited_at timestamp with time zone DEFAULT now();

-- Update existing records to have the joined_at as their initial last_visited_at
UPDATE public.community_members 
SET last_visited_at = joined_at 
WHERE last_visited_at IS NULL;

-- Create or replace function to update last_visited_at when a user views a community
CREATE OR REPLACE FUNCTION public.update_community_last_visited(p_community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.community_members
  SET last_visited_at = now()
  WHERE community_id = p_community_id 
    AND user_id = auth.uid()
    AND status = 'approved';
END;
$$;

-- Drop the existing function first to allow changing the return type
DROP FUNCTION IF EXISTS public.get_communities_list(p_campus text);

-- Update get_communities_list to include last_visited_at and order by it for recent communities
CREATE OR REPLACE FUNCTION public.get_communities_list(p_campus text)
RETURNS TABLE(
    id uuid,
    name text,
    description text,
    avatar_url text,
    member_count bigint,
    is_member boolean,
    last_visited_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();

    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.description,
        c.avatar_url,
        (SELECT count(*) FROM public.community_members cm WHERE cm.community_id = c.id AND cm.status = 'approved') AS member_count,
        EXISTS(SELECT 1 FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = current_user_id AND cm.status = 'approved') AS is_member,
        (SELECT cm.last_visited_at FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = current_user_id AND cm.status = 'approved') AS last_visited_at
    FROM
        public.communities c
    WHERE
        c.campus = p_campus
        AND c.parent_community_id IS NULL
        AND (
            -- Show public communities to everyone
            c.access_type = 'public'
            -- Show restricted/private communities only if user is a member
            OR EXISTS (
                SELECT 1 FROM public.community_members cm2 
                WHERE cm2.community_id = c.id 
                AND cm2.user_id = current_user_id 
                AND cm2.status = 'approved'
            )
        )
    ORDER BY c.name;
END;
$$;

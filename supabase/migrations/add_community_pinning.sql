-- Add is_pinned column to community_members table
ALTER TABLE public.community_members 
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Create function to toggle pin status
CREATE OR REPLACE FUNCTION public.toggle_community_pin(p_community_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_pin_status boolean;
    new_pin_status boolean;
BEGIN
    -- Get current pin status
    SELECT is_pinned INTO current_pin_status
    FROM public.community_members
    WHERE community_id = p_community_id 
        AND user_id = auth.uid()
        AND status = 'approved';
    
    -- Toggle the pin status
    new_pin_status := NOT COALESCE(current_pin_status, false);
    
    -- Update the pin status
    UPDATE public.community_members
    SET is_pinned = new_pin_status
    WHERE community_id = p_community_id 
        AND user_id = auth.uid()
        AND status = 'approved';
    
    RETURN new_pin_status;
END;
$$;

-- Drop and recreate get_communities_list to include is_pinned
DROP FUNCTION IF EXISTS public.get_communities_list(p_campus text);

CREATE OR REPLACE FUNCTION public.get_communities_list(p_campus text)
RETURNS TABLE(
    id uuid,
    name text,
    description text,
    avatar_url text,
    member_count bigint,
    is_member boolean,
    last_visited_at timestamp with time zone,
    is_pinned boolean
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
        (SELECT cm.last_visited_at FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = current_user_id AND cm.status = 'approved') AS last_visited_at,
        COALESCE((SELECT cm.is_pinned FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = current_user_id AND cm.status = 'approved'), false) AS is_pinned
    FROM
        public.communities c
    WHERE
        c.campus = p_campus
        AND c.parent_community_id IS NULL
        AND (
            -- Show public AND restricted communities to everyone
            c.access_type IN ('public', 'restricted')
            -- Show private communities only if user is a member
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

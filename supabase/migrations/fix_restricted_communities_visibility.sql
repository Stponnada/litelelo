-- Drop and recreate get_communities_list to fix restricted communities visibility
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

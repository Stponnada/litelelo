-- get_reposters_for_post.sql
-- RPC function to get all users who have reposted a specific post

CREATE OR REPLACE FUNCTION public.get_reposters_for_post(p_post_id uuid)
RETURNS TABLE (
    user_id uuid,
    username text,
    full_name text,
    avatar_url text,
    is_following boolean,
    reposted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        p.user_id,
        p.username,
        p.full_name,
        p.avatar_url,
        -- Check if the current user is following this reposter
        EXISTS (
            SELECT 1 
            FROM public.followers f 
            WHERE f.follower_id = auth.uid() 
            AND f.following_id = p.user_id
        ) AS is_following,
        r.created_at AS reposted_at
    FROM public.reposts r
    JOIN public.profiles p ON r.user_id = p.user_id
    WHERE r.post_id = p_post_id
    ORDER BY r.created_at DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_reposters_for_post(uuid) TO authenticated;

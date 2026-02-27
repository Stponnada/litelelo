-- Migration: Add Anonymous Confessions Feature
-- This migration adds support for anonymous posts (confessions)

-- 1. Add is_anonymous column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false NOT NULL;

-- 2. Create index for faster filtering of anonymous posts
CREATE INDEX IF NOT EXISTS idx_posts_is_anonymous ON public.posts(is_anonymous) WHERE is_anonymous = true;

-- 3. Create RPC function to create anonymous posts
CREATE OR REPLACE FUNCTION public.create_anonymous_post(
    p_content text,
    p_image_url text DEFAULT NULL,
    p_campus text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_post_id uuid;
    v_post_data jsonb;
BEGIN
    -- Insert the post with is_anonymous = true
    -- We still store user_id for moderation purposes, but it won't be exposed
    INSERT INTO posts (
        user_id, 
        content, 
        image_url, 
        is_public, 
        visibility, 
        is_anonymous
    )
    VALUES (
        auth.uid(), 
        p_content, 
        p_image_url, 
        true,  -- Anonymous posts are always public within the campus
        'public', 
        true
    )
    RETURNING id INTO v_post_id;

    -- Return the post data with masked author info
    SELECT jsonb_build_object(
        'id', p.id,
        'content', p.content,
        'image_url', p.image_url,
        'created_at', p.created_at,
        'like_count', p.like_count,
        'dislike_count', p.dislike_count,
        'comment_count', p.comment_count,
        'repost_count', p.repost_count,
        'is_anonymous', p.is_anonymous,
        'is_public', p.is_public,
        'visibility', p.visibility,
        'user_vote', NULL,
        'is_bookmarked', false,
        'user_has_reposted', false,
        'is_edited', p.is_edited,
        'is_deleted', p.is_deleted,
        -- Masked author info for anonymous posts
        'author_id', NULL::uuid,
        'author_type', 'user',
        'author_name', 'Anonymous',
        'author_username', 'anonymous',
        'author_avatar_url', NULL,
        'author_flair_details', NULL,
        -- The poster can see it's their own post
        'is_own_post', true
    ) INTO v_post_data 
    FROM posts p 
    WHERE p.id = v_post_id;

    RETURN v_post_data;
END;
$$;

ALTER FUNCTION public.create_anonymous_post(text, text, text) OWNER TO postgres;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_anonymous_post(text, text, text) TO authenticated;

-- 4. Create RPC function to get confessions feed
CREATE OR REPLACE FUNCTION public.get_confessions_feed(
    p_campus text DEFAULT NULL,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
) RETURNS TABLE(
    id uuid,
    content text,
    image_url text,
    created_at timestamp with time zone,
    like_count bigint,
    dislike_count bigint,
    comment_count bigint,
    repost_count bigint,
    is_anonymous boolean,
    is_public boolean,
    visibility text,
    user_vote text,
    is_bookmarked boolean,
    user_has_reposted boolean,
    is_edited boolean,
    is_deleted boolean,
    author_id uuid,
    author_type text,
    author_name text,
    author_username text,
    author_avatar_url text,
    author_flair_details jsonb,
    is_own_post boolean,
    poll jsonb
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_user_campus text;
BEGIN
    -- Get the current user's campus if not provided
    IF p_campus IS NULL THEN
        SELECT campus INTO v_user_campus FROM public.profiles WHERE user_id = v_user_id;
    ELSE
        v_user_campus := p_campus;
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.content,
        p.image_url,
        p.created_at,
        p.like_count,
        p.dislike_count,
        p.comment_count,
        p.repost_count,
        p.is_anonymous,
        p.is_public,
        p.visibility::text,
        (SELECT CASE 
            WHEN EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = v_user_id AND like_type = 'like') THEN 'like'
            WHEN EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = v_user_id AND like_type = 'dislike') THEN 'dislike'
            ELSE NULL
        END)::text as user_vote,
        EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = v_user_id) as is_bookmarked,
        EXISTS(SELECT 1 FROM reposts WHERE original_post_id = p.id AND user_id = v_user_id) as user_has_reposted,
        COALESCE(p.is_edited, false) as is_edited,
        COALESCE(p.is_deleted, false) as is_deleted,
        -- For anonymous posts, only reveal author to the poster themselves
        CASE WHEN p.user_id = v_user_id THEN p.user_id ELSE NULL END as author_id,
        'user'::text as author_type,
        CASE WHEN p.user_id = v_user_id THEN 
            (SELECT full_name FROM profiles WHERE user_id = p.user_id)
        ELSE 'Anonymous' END as author_name,
        CASE WHEN p.user_id = v_user_id THEN 
            (SELECT username FROM profiles WHERE user_id = p.user_id)
        ELSE 'anonymous' END as author_username,
        CASE WHEN p.user_id = v_user_id THEN 
            (SELECT avatar_url FROM profiles WHERE user_id = p.user_id)
        ELSE NULL END as author_avatar_url,
        NULL::jsonb as author_flair_details,
        (p.user_id = v_user_id) as is_own_post,
        -- Get poll data if exists
        (SELECT jsonb_build_object(
            'id', pl.id,
            'allow_multiple_answers', pl.allow_multiple_answers,
            'total_votes', COALESCE((
                SELECT COUNT(DISTINCT pv.user_id) 
                FROM poll_votes pv 
                JOIN poll_options po ON pv.option_id = po.id 
                WHERE po.poll_id = pl.id
            ), 0),
            'options', COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', po.id,
                    'option_text', po.option_text,
                    'vote_count', (SELECT COUNT(*) FROM poll_votes WHERE option_id = po.id)
                ) ORDER BY po.id)
                FROM poll_options po WHERE po.poll_id = pl.id
            ), '[]'::jsonb),
            'user_votes', COALESCE((
                SELECT jsonb_agg(pv.option_id)
                FROM poll_votes pv 
                JOIN poll_options po ON pv.option_id = po.id 
                WHERE po.poll_id = pl.id AND pv.user_id = v_user_id
            ), '[]'::jsonb)
        ) FROM polls pl WHERE pl.post_id = p.id) as poll
    FROM posts p
    -- Join with profiles to filter by campus
    JOIN profiles prof ON p.user_id = prof.user_id
    WHERE p.is_anonymous = true
      AND p.is_deleted = false
      AND p.parent_post_id IS NULL  -- Only top-level posts, not replies
      AND (v_user_campus IS NULL OR prof.campus = v_user_campus)
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

ALTER FUNCTION public.get_confessions_feed(text, integer, integer) OWNER TO postgres;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_confessions_feed(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_confessions_feed(text, integer, integer) TO anon;

-- 5. Create function to delete own anonymous post
CREATE OR REPLACE FUNCTION public.delete_anonymous_post(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- Only allow deletion if the user owns the post
    UPDATE posts 
    SET is_deleted = true 
    WHERE id = p_post_id 
      AND user_id = auth.uid() 
      AND is_anonymous = true;
    
    RETURN FOUND;
END;
$$;

ALTER FUNCTION public.delete_anonymous_post(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.delete_anonymous_post(uuid) TO authenticated;

-- 6. Add comment to explain the feature
COMMENT ON COLUMN public.posts.is_anonymous IS 'When true, the post is an anonymous confession. The user_id is stored for moderation but not exposed to other users.';

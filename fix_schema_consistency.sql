-- Fix Schema Consistency and Private Community Post Visibility
-- This script updates all post-fetching RPCs to:
-- 1. Include replying_to_username field
-- 2. Enforce private community post visibility rules
-- 3. Fix ambiguous column references

-- ============================================================================
-- 1. Fix get_post_thread - Add replying_to_username
-- ============================================================================
DROP FUNCTION IF EXISTS "public"."get_post_thread"("p_post_id" "uuid");

CREATE OR REPLACE FUNCTION "public"."get_post_thread"("p_post_id" "uuid") 
RETURNS TABLE(
    "id" "uuid", "user_id" "uuid", "content" "text", "image_url" "text", 
    "created_at" timestamp with time zone, "is_edited" boolean, "is_deleted" boolean, 
    "community_id" "uuid", "is_public" boolean, "like_count" bigint, "dislike_count" bigint, 
    "comment_count" bigint, "repost_count" integer, "user_vote" "text", "is_bookmarked" boolean, 
    "user_has_reposted" boolean, "original_poster_username" "text", "author_id" "text", 
    "author_type" "text", "author_name" "text", "author_username" "text", 
    "author_avatar_url" "text", "author_flair_details" "jsonb", "poll" "jsonb", 
    "quoted_post" "jsonb", "reposted_by" "jsonb", "visibility" "text", "title" "text", 
    "post_type" "text", "parent_post_id" "uuid", "root_post_id" "uuid", 
    "replying_to_username" "text"
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    v_root_id UUID;
BEGIN
    SELECT COALESCE(p.root_post_id, p.id) INTO v_root_id
    FROM public.posts p
    WHERE p.id = p_post_id;
    
    IF v_root_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT
        p.id, p.user_id, p.content, p.image_url, p.created_at, p.is_edited, p.is_deleted, 
        p.community_id, p.is_public, p.like_count, p.dislike_count, p.comment_count, p.repost_count,
        l.like_type AS user_vote,
        b.post_id IS NOT NULL AS is_bookmarked,
        r.post_id IS NOT NULL AS user_has_reposted,
        op.username AS original_poster_username,
        COALESCE(p.community_id::text, p.user_id::text) AS author_id,
        CASE WHEN p.community_id IS NOT NULL THEN 'community' ELSE 'user' END AS author_type,
        COALESCE(c.name, up.full_name) AS author_name,
        COALESCE(c.id::text, up.username) AS author_username,
        COALESCE(c.avatar_url, up.avatar_url) AS author_avatar_url,
        (SELECT CASE WHEN p.community_id IS NULL THEN (SELECT jsonb_build_object('id', flair_comm.id, 'name', flair_comm.name, 'avatar_url', flair_comm.avatar_url) FROM public.communities flair_comm WHERE flair_comm.id = up.displayed_community_flair) ELSE NULL END) AS author_flair_details,
        poll_details.poll,
        (
            SELECT jsonb_build_object(
                'id', qp.id, 'content', qp.content, 'image_url', qp.image_url, 'created_at', qp.created_at,
                'is_deleted', qp.is_deleted, 'author_name', qp_author.full_name, 'author_username', qp_author.username,
                'author_avatar_url', qp_author.avatar_url
            )
            FROM posts qp JOIN profiles qp_author ON qp.user_id = qp_author.user_id WHERE qp.id = p.quoted_post_id
        ) AS quoted_post,
        NULL::jsonb as reposted_by,
        p.visibility,
        p.title,
        p.post_type,
        p.parent_post_id,
        p.root_post_id,
        parent_author.username AS replying_to_username
    FROM public.posts p
    LEFT JOIN public.likes l ON p.id = l.post_id AND l.user_id = auth.uid()
    LEFT JOIN public.bookmarks b ON p.id = b.post_id AND b.user_id = auth.uid()
    LEFT JOIN public.reposts r ON p.id = r.post_id AND r.user_id = auth.uid()
    LEFT JOIN public.profiles up ON p.user_id = up.user_id AND p.community_id IS NULL
    LEFT JOIN public.communities c ON p.community_id = c.id
    LEFT JOIN public.profiles op ON p.user_id = op.user_id AND p.community_id IS NOT NULL
    LEFT JOIN public.posts parent_post ON p.parent_post_id = parent_post.id
    LEFT JOIN public.profiles parent_author ON parent_post.user_id = parent_author.user_id
    LEFT JOIN LATERAL (
        SELECT jsonb_build_object('id', po.id, 'allow_multiple_answers', po.allow_multiple_answers, 'total_votes', COALESCE((SELECT SUM(opt.vote_count) FROM public.poll_options opt WHERE opt.poll_id = po.id), 0), 'user_votes', (SELECT jsonb_agg(pv.option_id) FROM public.poll_votes pv WHERE pv.poll_id = po.id AND pv.user_id = auth.uid()), 'options', (SELECT jsonb_agg(jsonb_build_object('id', opt.id, 'option_text', opt.option_text, 'vote_count', opt.vote_count) ORDER BY opt.id) FROM poll_options opt WHERE opt.poll_id = po.id)) AS poll
        FROM polls po WHERE po.post_id = p.id
    ) poll_details ON TRUE
    WHERE
        (p.root_post_id = v_root_id OR p.id = v_root_id)
        AND (
            p.user_id = auth.uid()
            OR (
                p.community_id IS NOT NULL 
                AND (
                    (p.is_public = true AND EXISTS (SELECT 1 FROM public.communities comm WHERE comm.id = p.community_id AND comm.access_type <> 'private'))
                    OR EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = p.community_id AND cm.user_id = auth.uid() AND cm.status = 'approved')
                )
            )
            OR (
                p.community_id IS NULL 
                AND (
                    p.visibility = 'public'
                    OR (
                        p.visibility = 'friends' 
                        AND EXISTS (SELECT 1 FROM public.followers f1 WHERE f1.follower_id = auth.uid() AND f1.following_id = p.user_id AND f1.status = 'approved')
                        AND EXISTS (SELECT 1 FROM public.followers f2 WHERE f2.follower_id = p.user_id AND f2.following_id = auth.uid() AND f2.status = 'approved')
                    )
                    OR (p.visibility = 'specific' AND auth.uid() = ANY(p.allowed_viewers))
                )
            )
        )
    ORDER BY p.created_at ASC;
END;
$$;

-- ============================================================================
-- 2. Fix get_post_details_by_id - Add replying_to_username
-- ============================================================================
DROP FUNCTION IF EXISTS "public"."get_post_details_by_id"("p_post_id" "uuid");

CREATE OR REPLACE FUNCTION "public"."get_post_details_by_id"("p_post_id" "uuid") 
RETURNS TABLE(
    "id" "uuid", "user_id" "uuid", "content" "text", "image_url" "text", 
    "created_at" timestamp with time zone, "is_edited" boolean, "is_deleted" boolean, 
    "community_id" "uuid", "is_public" boolean, "like_count" bigint, "dislike_count" bigint, 
    "comment_count" bigint, "repost_count" integer, "user_vote" "text", "is_bookmarked" boolean, 
    "user_has_reposted" boolean, "original_poster_username" "text", "author_id" "text", 
    "author_type" "text", "author_name" "text", "author_username" "text", 
    "author_avatar_url" "text", "author_flair_details" "jsonb", "poll" "jsonb", 
    "quoted_post" "jsonb", "reposted_by" "jsonb", "visibility" "text", "title" "text", 
    "post_type" "text", "parent_post_id" "uuid", "root_post_id" "uuid", 
    "replying_to_username" "text"
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.user_id, p.content, p.image_url, p.created_at, p.is_edited, p.is_deleted, 
        p.community_id, p.is_public, p.like_count, p.dislike_count, p.comment_count, p.repost_count,
        l.like_type AS user_vote,
        b.post_id IS NOT NULL AS is_bookmarked,
        r.post_id IS NOT NULL AS user_has_reposted,
        op.username AS original_poster_username,
        COALESCE(p.community_id::text, p.user_id::text) AS author_id,
        CASE WHEN p.community_id IS NOT NULL THEN 'community' ELSE 'user' END AS author_type,
        COALESCE(c.name, up.full_name) AS author_name,
        COALESCE(c.id::text, up.username) AS author_username,
        COALESCE(c.avatar_url, up.avatar_url) AS author_avatar_url,
        (SELECT CASE WHEN p.community_id IS NULL THEN (SELECT jsonb_build_object('id', flair_comm.id, 'name', flair_comm.name, 'avatar_url', flair_comm.avatar_url) FROM public.communities flair_comm WHERE flair_comm.id = up.displayed_community_flair) ELSE NULL END) AS author_flair_details,
        poll_details.poll,
        (
            SELECT jsonb_build_object(
                'id', qp.id, 'content', qp.content, 'image_url', qp.image_url, 'created_at', qp.created_at,
                'is_deleted', qp.is_deleted, 'author_name', qp_author.full_name, 'author_username', qp_author.username,
                'author_avatar_url', qp_author.avatar_url
            )
            FROM posts qp JOIN profiles qp_author ON qp.user_id = qp_author.user_id WHERE qp.id = p.quoted_post_id
        ) AS quoted_post,
        NULL::jsonb as reposted_by,
        p.visibility,
        p.title,
        p.post_type,
        p.parent_post_id,
        p.root_post_id,
        parent_author.username AS replying_to_username
    FROM public.posts p
    LEFT JOIN public.likes l ON p.id = l.post_id AND l.user_id = auth.uid()
    LEFT JOIN public.bookmarks b ON p.id = b.post_id AND b.user_id = auth.uid()
    LEFT JOIN public.reposts r ON p.id = r.post_id AND r.user_id = auth.uid()
    LEFT JOIN public.profiles up ON p.user_id = up.user_id AND p.community_id IS NULL
    LEFT JOIN public.communities c ON p.community_id = c.id
    LEFT JOIN public.profiles op ON p.user_id = op.user_id AND p.community_id IS NOT NULL
    LEFT JOIN public.posts parent_post ON p.parent_post_id = parent_post.id
    LEFT JOIN public.profiles parent_author ON parent_post.user_id = parent_author.user_id
    LEFT JOIN LATERAL (
        SELECT jsonb_build_object('id', po.id, 'allow_multiple_answers', po.allow_multiple_answers, 'total_votes', COALESCE((SELECT SUM(opt.vote_count) FROM public.poll_options opt WHERE opt.poll_id = po.id), 0), 'user_votes', (SELECT jsonb_agg(pv.option_id) FROM public.poll_votes pv WHERE pv.poll_id = po.id AND pv.user_id = auth.uid()), 'options', (SELECT jsonb_agg(jsonb_build_object('id', opt.id, 'option_text', opt.option_text, 'vote_count', opt.vote_count) ORDER BY opt.id) FROM poll_options opt WHERE opt.poll_id = po.id)) AS poll
        FROM polls po WHERE po.post_id = p.id
    ) poll_details ON TRUE
    WHERE
        p.id = p_post_id
        AND (
            p.user_id = auth.uid()
            OR (
                p.community_id IS NOT NULL 
                AND (
                    (p.is_public = true AND EXISTS (SELECT 1 FROM public.communities comm WHERE comm.id = p.community_id AND comm.access_type <> 'private'))
                    OR EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = p.community_id AND cm.user_id = auth.uid() AND cm.status = 'approved')
                )
            )
            OR (
                p.community_id IS NULL 
                AND (
                    p.visibility = 'public'
                    OR (
                        p.visibility = 'friends' 
                        AND EXISTS (SELECT 1 FROM public.followers f1 WHERE f1.follower_id = auth.uid() AND f1.following_id = p.user_id AND f1.status = 'approved')
                        AND EXISTS (SELECT 1 FROM public.followers f2 WHERE f2.follower_id = p.user_id AND f2.following_id = auth.uid() AND f2.status = 'approved')
                    )
                    OR (p.visibility = 'specific' AND auth.uid() = ANY(p.allowed_viewers))
                )
            )
        );
END;
$$;

-- ============================================================================
-- 3. Fix get_posts_for_profile - Fix ambiguous column references
-- ============================================================================
DROP FUNCTION IF EXISTS "public"."get_posts_for_profile"("p_user_id" "uuid");

CREATE OR REPLACE FUNCTION "public"."get_posts_for_profile"("p_user_id" "uuid") 
RETURNS TABLE(
    "id" "uuid", "user_id" "uuid", "content" "text", "image_url" "text", 
    "created_at" timestamp with time zone, "is_edited" boolean, "is_deleted" boolean, 
    "community_id" "uuid", "is_public" boolean, "like_count" bigint, "dislike_count" bigint, 
    "comment_count" bigint, "repost_count" integer, "user_vote" "text", "is_bookmarked" boolean, 
    "user_has_reposted" boolean, "original_poster_username" "text", "author_id" "text", 
    "author_type" "text", "author_name" "text", "author_username" "text", 
    "author_avatar_url" "text", "author_flair_details" "jsonb", "poll" "jsonb", 
    "quoted_post" "jsonb", "reposted_by" "jsonb", "visibility" "text", "title" "text", 
    "post_type" "text", "parent_post_id" "uuid", "root_post_id" "uuid", 
    "replying_to_username" "text"
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH p_profile AS (
        SELECT pr.user_id, pr.username, pr.full_name, pr.avatar_url 
        FROM public.profiles pr 
        WHERE pr.user_id = p_user_id
    ),
    profile_feed_items AS (
        SELECT p.id AS post_id, p.created_at AS event_time, NULL::jsonb AS reposted_by
        FROM public.posts p 
        WHERE p.user_id = p_user_id AND p.is_deleted = false
        UNION ALL
        SELECT r.post_id, r.created_at AS event_time, 
               jsonb_build_object('user_id', pp.user_id, 'username', pp.username, 'full_name', pp.full_name) AS reposted_by
        FROM public.reposts r 
        JOIN p_profile pp ON r.user_id = pp.user_id
    ),
    distinct_feed AS (
        SELECT DISTINCT ON (post_id) df_inner.post_id, df_inner.event_time, df_inner.reposted_by 
        FROM profile_feed_items df_inner 
        ORDER BY df_inner.post_id, df_inner.event_time DESC
    )
    SELECT
        p.id, p.user_id, p.content, p.image_url, p.created_at, p.is_edited, p.is_deleted, 
        p.community_id, p.is_public, p.like_count, p.dislike_count, p.comment_count, p.repost_count,
        l.like_type AS user_vote,
        b.post_id IS NOT NULL AS is_bookmarked,
        r.post_id IS NOT NULL AS user_has_reposted,
        op.username AS original_poster_username,
        COALESCE(p.community_id::text, p.user_id::text) AS author_id,
        CASE WHEN p.community_id IS NOT NULL THEN 'community' ELSE 'user' END AS author_type,
        COALESCE(c.name, up.full_name) AS author_name,
        COALESCE(c.id::text, up.username) AS author_username,
        COALESCE(c.avatar_url, up.avatar_url) AS author_avatar_url,
        (SELECT CASE WHEN p.community_id IS NULL THEN (SELECT jsonb_build_object('id', flair_comm.id, 'name', flair_comm.name, 'avatar_url', flair_comm.avatar_url) FROM public.communities flair_comm WHERE flair_comm.id = up.displayed_community_flair) ELSE NULL END) AS author_flair_details,
        poll_details.poll,
        (
            SELECT jsonb_build_object(
                'id', qp.id, 'content', qp.content, 'image_url', qp.image_url, 'created_at', qp.created_at,
                'is_deleted', qp.is_deleted, 'author_name', qp_author.full_name, 'author_username', qp_author.username,
                'author_avatar_url', qp_author.avatar_url
            )
            FROM posts qp JOIN profiles qp_author ON qp.user_id = qp_author.user_id WHERE qp.id = p.quoted_post_id
        ) AS quoted_post,
        df.reposted_by,
        p.visibility,
        p.title,
        p.post_type,
        p.parent_post_id,
        p.root_post_id,
        parent_author.username AS replying_to_username
    FROM distinct_feed df
    JOIN public.posts p ON df.post_id = p.id
    LEFT JOIN public.likes l ON p.id = l.post_id AND l.user_id = auth.uid()
    LEFT JOIN public.bookmarks b ON p.id = b.post_id AND b.user_id = auth.uid()
    LEFT JOIN public.reposts r ON p.id = r.post_id AND r.user_id = auth.uid()
    LEFT JOIN public.profiles up ON p.user_id = up.user_id AND p.community_id IS NULL
    LEFT JOIN public.communities c ON p.community_id = c.id
    LEFT JOIN public.profiles op ON p.user_id = op.user_id AND p.community_id IS NOT NULL
    LEFT JOIN public.posts parent_post ON p.parent_post_id = parent_post.id
    LEFT JOIN public.profiles parent_author ON parent_post.user_id = parent_author.user_id
    LEFT JOIN LATERAL (
        SELECT jsonb_build_object('id', po.id, 'allow_multiple_answers', po.allow_multiple_answers, 'total_votes', COALESCE((SELECT SUM(opt.vote_count) FROM public.poll_options opt WHERE opt.poll_id = po.id), 0), 'user_votes', (SELECT jsonb_agg(pv.option_id) FROM public.poll_votes pv WHERE pv.poll_id = po.id AND pv.user_id = auth.uid()), 'options', (SELECT jsonb_agg(jsonb_build_object('id', opt.id, 'option_text', opt.option_text, 'vote_count', opt.vote_count) ORDER BY opt.id) FROM poll_options opt WHERE opt.poll_id = po.id)) AS poll
        FROM polls po WHERE po.post_id = p.id
    ) poll_details ON TRUE
    WHERE p.is_deleted = false
    AND (
        p.user_id = auth.uid()
        OR (
            p.community_id IS NOT NULL 
            AND (
                -- Only allow is_public to bypass membership if the community is NOT private
                (p.is_public = true AND EXISTS (SELECT 1 FROM public.communities comm WHERE comm.id = p.community_id AND comm.access_type <> 'private'))
                OR EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = p.community_id AND cm.user_id = auth.uid() AND cm.status = 'approved')
            )
        )
        OR (
            p.community_id IS NULL 
            AND (
                p.visibility = 'public'
                OR (
                    p.visibility = 'friends' 
                    AND EXISTS (SELECT 1 FROM public.followers f1 WHERE f1.follower_id = auth.uid() AND f1.following_id = p.user_id AND f1.status = 'approved')
                    AND EXISTS (SELECT 1 FROM public.followers f2 WHERE f2.follower_id = p.user_id AND f2.following_id = auth.uid() AND f2.status = 'approved')
                )
                OR (p.visibility = 'specific' AND auth.uid() = ANY(p.allowed_viewers))
            )
        )
    )
    ORDER BY df.event_time DESC;
END;
$$;

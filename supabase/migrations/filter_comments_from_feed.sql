DROP FUNCTION IF EXISTS "public"."get_feed_posts"();

CREATE OR REPLACE FUNCTION "public"."get_feed_posts"() 
RETURNS TABLE(
    "id" "uuid", "user_id" "uuid", "content" "text", "image_url" "text", "created_at" timestamp with time zone, 
    "is_edited" boolean, "is_deleted" boolean, "community_id" "uuid", "is_public" boolean, 
    "like_count" bigint, "dislike_count" bigint, "comment_count" bigint, "repost_count" integer, 
    "user_vote" "text", "is_bookmarked" boolean, "user_has_reposted" boolean, 
    "original_poster_username" "text", "author_id" "text", "author_type" "text", "author_name" "text", 
    "author_username" "text", "author_avatar_url" "text", "author_flair_details" "jsonb", 
    "poll" "jsonb", "quoted_post" "jsonb", "reposted_by" "jsonb", "visibility" "text", 
    "title" "text", "post_type" "text",
    "parent_post_id" "uuid", "root_post_id" "uuid"
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH current_user_id AS (
        SELECT auth.uid() AS cur_uid 
    ),
    followed_users AS (
        SELECT f.following_id 
        FROM public.followers f
        WHERE f.follower_id = (SELECT cur_uid FROM current_user_id)
    ),
    member_communities AS (
        SELECT cm.community_id AS joined_comm_id 
        FROM public.community_members cm
        WHERE cm.user_id = (SELECT cur_uid FROM current_user_id)
    ),
    feed_items AS (
        SELECT
            p.id AS post_id,
            p.created_at AS event_time,
            p.user_id AS actor_id,
            NULL::jsonb AS reposted_by
        FROM public.posts p
        WHERE p.is_deleted = false
          AND p.parent_post_id IS NULL -- FILTER: Only show root posts
          AND (
                p.community_id IN (SELECT joined_comm_id FROM member_communities)
                OR p.user_id IN (SELECT following_id FROM followed_users)
                OR p.user_id = (SELECT cur_uid FROM current_user_id)
              )

        UNION ALL

        -- Posts reposted by followed users
        SELECT
            r.post_id,
            r.created_at AS event_time,
            r.user_id AS actor_id,
            jsonb_build_object(
                'user_id', reposter.user_id,
                'username', reposter.username,
                'full_name', reposter.full_name
            ) AS reposted_by
        FROM public.reposts r
        JOIN public.profiles reposter ON r.user_id = reposter.user_id
        JOIN public.posts p ON r.post_id = p.id -- Join to check parent_post_id
        WHERE r.user_id IN (SELECT following_id FROM followed_users)
          AND p.parent_post_id IS NULL -- FILTER: Only show reposts of root posts
    )
    , distinct_feed AS (
        SELECT DISTINCT ON (post_id) *
        FROM feed_items
        ORDER BY post_id, event_time DESC
    )
    SELECT
        p.id, p.user_id, p.content, p.image_url, p.created_at, p.is_edited, p.is_deleted, p.community_id, p.is_public,
        p.like_count, p.dislike_count, p.comment_count, p.repost_count,
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
        p.parent_post_id, -- Added new column
        p.root_post_id    -- Added new column
    FROM distinct_feed df
    JOIN public.posts p ON df.post_id = p.id
    LEFT JOIN public.likes l ON p.id = l.post_id AND l.user_id = auth.uid()
    LEFT JOIN public.bookmarks b ON p.id = b.post_id AND b.user_id = auth.uid()
    LEFT JOIN public.reposts r ON p.id = r.post_id AND r.user_id = auth.uid()
    LEFT JOIN public.profiles up ON p.user_id = up.user_id AND p.community_id IS NULL
    LEFT JOIN public.communities c ON p.community_id = c.id
    LEFT JOIN public.profiles op ON p.user_id = op.user_id AND p.community_id IS NOT NULL
    LEFT JOIN LATERAL (
        SELECT jsonb_build_object('id', po.id, 'allow_multiple_answers', po.allow_multiple_answers, 'total_votes', COALESCE((SELECT SUM(opt.vote_count) FROM public.poll_options opt WHERE opt.poll_id = po.id), 0), 'user_votes', (SELECT jsonb_agg(pv.option_id) FROM public.poll_votes pv WHERE pv.poll_id = po.id AND pv.user_id = auth.uid()), 'options', (SELECT jsonb_agg(jsonb_build_object('id', opt.id, 'option_text', opt.option_text, 'vote_count', opt.vote_count) ORDER BY opt.id) FROM poll_options opt WHERE opt.poll_id = po.id)) AS poll
        FROM polls po WHERE po.post_id = p.id
    ) poll_details ON TRUE
    ORDER BY df.event_time DESC
    LIMIT 100;
END;
$$;

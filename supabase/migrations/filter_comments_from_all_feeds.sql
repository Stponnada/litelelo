-- 1. Update get_public_feed_posts
-- Drop first to change return type
DROP FUNCTION IF EXISTS "public"."get_public_feed_posts"();

CREATE OR REPLACE FUNCTION "public"."get_public_feed_posts"() 
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
        NULL::jsonb as reposted_by,
        p.visibility,
        p.title,
        p.post_type,
        p.parent_post_id,
        p.root_post_id
    FROM public.posts p
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
    WHERE
        p.is_deleted = false
        AND p.parent_post_id IS NULL -- FILTER: Only show root posts
        AND (
            p.user_id = auth.uid()
            OR (p.visibility = 'public')
            OR (p.visibility = 'friends' AND 
             EXISTS (SELECT 1 FROM followers f1 WHERE f1.follower_id = auth.uid() AND f1.following_id = p.user_id) AND
             EXISTS (SELECT 1 FROM followers f2 WHERE f2.follower_id = p.user_id AND f2.following_id = auth.uid())
            )
            OR (p.visibility = 'specific' AND auth.uid() = ANY(p.allowed_viewers))
        )
    ORDER BY p.created_at DESC
    LIMIT 100;
END;
$$;

-- 2. Update get_campus_feed
-- No need to drop as return type is same (we are just filtering rows)
CREATE OR REPLACE FUNCTION "public"."get_campus_feed"("p_campus" "text") 
RETURNS TABLE("id" "uuid", "user_id" "uuid", "content" "text", "image_url" "text", "created_at" timestamp with time zone, "is_edited" boolean, "is_deleted" boolean, "community_id" "uuid", "is_public" boolean, "like_count" bigint, "dislike_count" bigint, "comment_count" bigint, "repost_count" integer, "user_vote" "text", "is_bookmarked" boolean, "user_has_reposted" boolean, "original_poster_username" "text", "author_id" "text", "author_type" "text", "author_name" "text", "author_username" "text", "author_avatar_url" "text", "author_flair_details" "jsonb", "poll" "jsonb", "quoted_post" "jsonb", "reposted_by" "jsonb", "item_type" "text", "item_data" "jsonb", "visibility" "text", "title" "text", "post_type" "text")
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
    RETURN QUERY
    WITH feed_items AS (
        -- 1. Public Community Posts from this campus
        SELECT
            p.id,
            p.created_at,
            'post' AS item_type,
            NULL::jsonb AS item_data
        FROM public.posts p
        JOIN public.communities c ON p.community_id = c.id
        WHERE p.is_deleted = false 
          AND p.is_public = true 
          AND c.campus = p_campus
          AND p.parent_post_id IS NULL -- FILTER: Only show root posts

        UNION ALL

        -- 2. New Marketplace Listings from this campus
        SELECT
            ml.id,
            ml.created_at,
            'listing' AS item_type,
            jsonb_build_object(
                'id', ml.id,
                'title', ml.title,
                'price', ml.price,
                'category', ml.category,
                'primary_image_url', (SELECT mi.image_url FROM marketplace_images mi WHERE mi.listing_id = ml.id ORDER BY mi.created_at LIMIT 1),
                'seller_profile', (SELECT jsonb_build_object('user_id', p.user_id, 'username', p.username, 'full_name', p.full_name, 'avatar_url', p.avatar_url) FROM profiles p WHERE p.user_id = ml.seller_id),
                'seller_id', ml.seller_id,
                'all_images', (SELECT jsonb_agg(mi.image_url ORDER BY mi.created_at) FROM marketplace_images mi WHERE mi.listing_id = ml.id)
            ) AS item_data
        FROM public.marketplace_listings ml
        WHERE ml.campus = p_campus AND ml.status = 'available'

        UNION ALL

        -- 3. Upcoming Events from this campus
        SELECT
            e.id,
            e.start_time AS created_at,
            'event' AS item_type,
            jsonb_build_object(
                'id', e.id,
                'name', e.name,
                'start_time', e.start_time,
                'end_time', e.end_time,
                'location', e.location,
                'going_count', (SELECT count(*) FROM event_rsvps WHERE event_id = e.id AND rsvp_status = 'going'),
                'interested_count', (SELECT count(*) FROM event_rsvps WHERE event_id = e.id AND rsvp_status = 'interested')
            ) AS item_data
        FROM public.events e
        WHERE e.campus = p_campus AND e.start_time > now()
        
        UNION ALL
        
        -- 4. Active Lost & Found Items
        SELECT
            laf.id,
            laf.created_at,
            'lost_found' AS item_type,
            jsonb_build_object(
                'id', laf.id,
                'title', laf.title,
                'item_type', laf.item_type,
                'location_found', laf.location_found,
                'image_url', laf.image_url
            ) AS item_data
        FROM public.lost_and_found_items laf
        WHERE laf.campus = p_campus AND laf.status = 'active'
    )
    SELECT
        fi.id,
        p.user_id,
        p.content,
        p.image_url,
        fi.created_at,
        p.is_edited,
        p.is_deleted,
        p.community_id,
        p.is_public,
        p.like_count,
        p.dislike_count,
        p.comment_count,
        p.repost_count,
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
        (SELECT jsonb_build_object('id', qp.id, 'content', qp.content, 'image_url', qp.image_url, 'created_at', qp.created_at, 'is_deleted', qp.is_deleted, 'author_name', qp_author.full_name, 'author_username', qp_author.username, 'author_avatar_url', qp_author.avatar_url) FROM posts qp JOIN profiles qp_author ON qp.user_id = qp_author.user_id WHERE qp.id = p.quoted_post_id) AS quoted_post,
        NULL::jsonb as reposted_by,
        fi.item_type,
        fi.item_data,
        p.visibility,
        p.title,
        p.post_type
    FROM feed_items fi
    LEFT JOIN public.posts p ON fi.id = p.id AND fi.item_type = 'post'
    LEFT JOIN public.likes l ON p.id = l.post_id AND l.user_id = auth.uid()
    LEFT JOIN public.bookmarks b ON p.id = b.post_id AND b.user_id = auth.uid()
    LEFT JOIN public.reposts r ON p.id = r.post_id AND r.user_id = auth.uid()
    LEFT JOIN public.profiles up ON p.user_id = up.user_id AND p.community_id IS NULL
    LEFT JOIN public.communities c ON p.community_id = c.id
    LEFT JOIN public.profiles op ON p.user_id = op.user_id AND p.community_id IS NOT NULL
    LEFT JOIN LATERAL (SELECT jsonb_build_object('id', po.id, 'allow_multiple_answers', po.allow_multiple_answers, 'total_votes', COALESCE((SELECT SUM(opt.vote_count) FROM public.poll_options opt WHERE opt.poll_id = po.id), 0), 'user_votes', (SELECT jsonb_agg(pv.option_id) FROM public.poll_votes pv WHERE pv.poll_id = po.id AND pv.user_id = auth.uid()), 'options', (SELECT jsonb_agg(jsonb_build_object('id', opt.id, 'option_text', opt.option_text, 'vote_count', opt.vote_count, 'voters', (SELECT jsonb_agg(jsonb_build_object('user_id', voter_profile.user_id, 'username', voter_profile.username, 'full_name', voter_profile.full_name, 'avatar_url', voter_profile.avatar_url)) FROM public.poll_votes pv JOIN public.profiles voter_profile ON pv.user_id = voter_profile.user_id WHERE pv.option_id = opt.id)) ORDER BY opt.id) FROM poll_options opt WHERE opt.poll_id = po.id)) AS poll FROM polls po WHERE po.post_id = p.id) poll_details ON TRUE
    ORDER BY fi.created_at DESC;
END;
$$;

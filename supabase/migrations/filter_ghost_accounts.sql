-- Filter out incomplete profiles (ghost accounts) from discovery functions

-- 1. Update Unified Directory
CREATE OR REPLACE FUNCTION "public"."get_unified_directory"() RETURNS TABLE("id" "text", "type" "text", "name" "text", "username" "text", "avatar_url" "text", "bio" "text", "is_following" boolean, "follower_count" integer, "member_count" bigint, "admission_year" integer, "branch" "text", "dual_degree_branch" "text", "gender" "text", "dorm_building" "text", "relationship_status" "text", "dining_hall" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    -- Select all user profiles that are complete
    SELECT
        p.user_id::text AS id,
        'user'::text AS type,
        p.full_name AS name,
        p.username,
        p.avatar_url,
        p.bio,
        EXISTS(SELECT 1 FROM followers WHERE follower_id = auth.uid() AND following_id = p.user_id) AS is_following,
        p.follower_count,
        NULL::bigint AS member_count, -- Null for users
        p.admission_year,
        p.branch,
        p.dual_degree_branch,
        p.gender,
        p.dorm_building,
        p.relationship_status,
        p.dining_hall
    FROM
        profiles p
    WHERE
        p.user_id <> auth.uid()
        AND p.profile_complete = true

    UNION ALL

    -- Select all communities, padding user-specific columns with NULL
    SELECT
        c.id::text AS id,
        'community'::text AS type,
        c.name,
        c.id::text AS username, -- Use ID as a unique key for routing
        c.avatar_url,
        c.description AS bio,
        NULL::boolean AS is_following, -- Communities can't be followed in the same way
        NULL::integer AS follower_count,
        (SELECT count(*) FROM community_members cm WHERE cm.community_id = c.id) AS member_count,
        NULL::integer AS admission_year,
        NULL::text AS branch,
        NULL::text AS dual_degree_branch,
        NULL::text AS gender,
        NULL::text AS dorm_building,
        NULL::text AS relationship_status,
        NULL::text AS dining_hall
    FROM
        communities c;
END;
$$;

-- 2. Update Search Recommendations (Follow Suggestions)
CREATE OR REPLACE FUNCTION "public"."get_search_recommendations"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'follow_suggestions', (
            SELECT COALESCE(json_agg(s), '[]')
            FROM (
                SELECT
                    p.user_id,
                    p.username,
                    p.full_name,
                    p.avatar_url,
                    p.bio
                FROM profiles p
                WHERE p.user_id IN (
                    -- Users who follow me
                    SELECT f1.follower_id
                    FROM followers f1
                    WHERE f1.following_id = auth.uid()
                    EXCEPT
                    -- Minus users I already follow
                    SELECT f2.following_id
                    FROM followers f2
                    WHERE f2.follower_id = auth.uid()
                )
                AND p.user_id != auth.uid()
                AND p.profile_complete = true
                LIMIT 5
            ) s
        ),
        'trending_posts', (
            SELECT COALESCE(json_agg(tp), '[]')
            FROM (
                SELECT
                    p.id,
                    p.content,
                    p.like_count,
                    p.comment_count,
                    p.author_name,
                    p.author_username,
                    p.author_avatar_url
                FROM get_feed_posts() p
                LEFT JOIN posts post_table ON p.id = post_table.id
                WHERE post_table.created_at > (now() - interval '7 days')
                  AND p.poll IS NULL -- Use the poll object from get_feed_posts()
                ORDER BY p.like_count DESC, p.comment_count DESC
                LIMIT 5
            ) tp
        ),
        'trending_polls', (
             SELECT COALESCE(json_agg(t_poll), '[]')
             FROM (
                SELECT
                    p.id,
                    p.content,
                    (p.poll->>'total_votes')::int as total_votes, -- Cast the jsonb value to integer
                    p.author_name,
                    p.author_username,
                    p.author_avatar_url
                FROM get_feed_posts() p
                LEFT JOIN posts post_table ON p.id = post_table.id
                WHERE post_table.created_at > (now() - interval '7 days')
                  AND p.poll IS NOT NULL -- Use the poll object from get_feed_posts()
                ORDER BY total_votes DESC, p.comment_count DESC
                LIMIT 3
            ) t_poll
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- 3. Update Search All
CREATE OR REPLACE FUNCTION "public"."search_all"("search_term" "text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    cleaned_search_term TEXT := '%' || search_term || '%';
BEGIN
    RETURN json_build_object(
        'users', (
            SELECT COALESCE(json_agg(u), '[]') FROM (
                SELECT p.username, p.full_name, p.avatar_url
                FROM profiles p
                WHERE (p.username ILIKE cleaned_search_term OR p.full_name ILIKE cleaned_search_term)
                  AND p.profile_complete = true
                LIMIT 5
            ) u
        ),
        'posts', (
            SELECT COALESCE(json_agg(pc), '[]') FROM (
                SELECT p.id, p.content, COALESCE(author.full_name, comm.name) AS author_full_name, author.username AS author_username
                FROM posts p
                LEFT JOIN profiles author ON p.user_id = author.user_id
                LEFT JOIN communities comm ON p.community_id = comm.id
                WHERE p.content ILIKE cleaned_search_term 
                  AND p.is_deleted = false
                  AND (
                    p.user_id = auth.uid()
                    OR (
                        p.community_id IS NOT NULL 
                        AND (
                            (p.is_public = true AND EXISTS (SELECT 1 FROM public.communities c WHERE c.id = p.community_id AND c.access_type <> 'private'))
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
                ORDER BY p.created_at DESC
                LIMIT 5
            ) pc
        )
    );
END;
$$;

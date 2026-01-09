-- Update the get_follow_suggestions function to accept an optional user ID
-- This allows calling it from server-side routes using the service role

CREATE OR REPLACE FUNCTION "public"."get_follow_suggestions"(p_user_id uuid DEFAULT NULL) 
RETURNS TABLE("user_id" "uuid", "username" "text", "full_name" "text", "avatar_url" "text", "bio" "text")
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
AS $$
DECLARE
    current_uid uuid;
BEGIN
    -- Use provided p_user_id OR fall back to auth.uid()
    current_uid := COALESCE(p_user_id, auth.uid());

    IF current_uid IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH suggested_profiles AS (
        SELECT
            p.user_id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.bio,
            p.follower_count,
            (
                -- Highest weight: People who already follow the current user
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM public.followers f_back
                        WHERE f_back.follower_id = p.user_id AND f_back.following_id = current_uid
                    ) THEN 100
                    ELSE 0
                END
                +
                -- Medium weight: People followed by users you have a mutual follow with ("friends")
                (
                    SELECT COUNT(*) * 25
                    FROM public.followers f_friends
                    WHERE f_friends.following_id = p.user_id
                      AND f_friends.follower_id IN (
                          -- Find mutuals (users you follow who also follow you back)
                          SELECT f_inner1.following_id FROM public.followers f_inner1 WHERE f_inner1.follower_id = current_uid
                          INTERSECT
                          SELECT f_inner2.follower_id FROM public.followers f_inner2 WHERE f_inner2.following_id = current_uid
                      )
                )
                +
                -- Lower weight: People in the same communities
                (
                    SELECT COUNT(*) * 10
                    FROM public.community_members cm
                    WHERE cm.user_id = p.user_id
                      AND cm.community_id IN (
                          SELECT sub_cm.community_id
                          FROM public.community_members sub_cm
                          WHERE sub_cm.user_id = current_uid
                      )
                )
                +
                -- Smallest weight: General popularity (follower count), log-scaled to reduce extreme impact
                LN(1 + p.follower_count) * 5
            ) AS suggestion_score
        FROM
            public.profiles p
        WHERE
            -- Exclude the current user
            p.user_id <> current_uid
            -- Exclude people the user already follows
            AND NOT EXISTS (SELECT 1 FROM public.followers f WHERE f.follower_id = current_uid AND f.following_id = p.user_id)
            -- Only suggest active-ish users (optional, but good for quality)
            AND p.username IS NOT NULL
    )
    SELECT s.user_id, s.username, s.full_name, s.avatar_url, s.bio
    FROM suggested_profiles s
    ORDER BY s.suggestion_score DESC, s.follower_count DESC
    LIMIT 5;
END;
$$;

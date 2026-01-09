-- Drop the existing function first to allow return type change
DROP FUNCTION IF EXISTS "public"."get_unified_directory"();

CREATE OR REPLACE FUNCTION "public"."get_unified_directory"() 
RETURNS TABLE(
    "id" "text", 
    "type" "text", 
    "name" "text", 
    "username" "text", 
    "avatar_url" "text", 
    "bio" "text", 
    "is_following" boolean, 
    "follower_count" integer, 
    "member_count" bigint, 
    "admission_year" integer, 
    "branch" "text", 
    "dual_degree_branch" "text", 
    "gender" "text", 
    "dorm_building" "text", 
    "relationship_status" "text", 
    "dining_hall" "text",
    "campus" "text"
)
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
        p.dining_hall,
        p.campus
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
        NULL::text AS dining_hall,
        c.campus
    FROM
        communities c;
END;
$$;

GRANT ALL ON FUNCTION "public"."get_unified_directory"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_directory"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_directory"() TO "service_role";

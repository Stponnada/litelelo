DROP FUNCTION IF EXISTS "public"."create_quote_post"(text, uuid, uuid, boolean);

CREATE OR REPLACE FUNCTION "public"."create_quote_post"("p_content" "text", "p_quoted_post_id" "uuid", "p_community_id" "uuid" DEFAULT NULL::"uuid", "p_is_public" boolean DEFAULT false) 
RETURNS TABLE(
    "id" "uuid", 
    "user_id" "uuid", 
    "content" "text", 
    "image_url" "text", 
    "created_at" timestamp with time zone, 
    "is_edited" boolean, 
    "is_deleted" boolean, 
    "community_id" "uuid", 
    "is_public" boolean, 
    "like_count" bigint, 
    "dislike_count" bigint, 
    "comment_count" bigint, 
    "repost_count" integer, 
    "user_vote" "text", 
    "is_bookmarked" boolean, 
    "user_has_reposted" boolean, 
    "original_poster_username" "text", 
    "author_id" "text", 
    "author_type" "text", 
    "author_name" "text", 
    "author_username" "text", 
    "author_avatar_url" "text", 
    "author_flair_details" "jsonb", 
    "poll" "jsonb", 
    "quoted_post" "jsonb", 
    "reposted_by" "jsonb",
    "visibility" "text",
    "title" "text",
    "post_type" "text",
    "parent_post_id" "uuid",
    "root_post_id" "uuid"
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_post_id uuid;
BEGIN
    INSERT INTO public.posts (user_id, content, quoted_post_id, community_id, is_public)
    VALUES (auth.uid(), p_content, p_quoted_post_id, p_community_id, p_is_public)
    RETURNING posts.id INTO new_post_id;

    RETURN QUERY
    SELECT f.* FROM public.get_feed_posts() f WHERE f.id = new_post_id;
END;
$$;

ALTER FUNCTION "public"."create_quote_post"("p_content" "text", "p_quoted_post_id" "uuid", "p_community_id" "uuid", "p_is_public" boolean) OWNER TO "postgres";

-- 1. Add privacy_settings and birthday columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthday DATE;

-- 2. Drop existing function to allow return type change (fixes 42P13 error)
DROP FUNCTION IF EXISTS "public"."get_profile_details"("profile_username" "text");

-- 3. Recreate get_profile_details to handle privacy redaction
CREATE OR REPLACE FUNCTION "public"."get_profile_details"("profile_username" "text") 
RETURNS TABLE(
    "user_id" "uuid", 
    "username" "text", 
    "avatar_url" "text", 
    "bio" "text", 
    "created_at" timestamp with time zone, 
    "full_name" "text", 
    "email" "text", 
    "banner_url" "text", 
    "campus" "text", 
    "admission_year" integer, 
    "branch" "text", 
    "relationship_status" "text", 
    "dorm_building" "text", 
    "dorm_room" "text", 
    "dining_hall" "text", 
    "profile_complete" boolean, 
    "updated_at" timestamp with time zone, 
    "id" bigint, 
    "dual_degree_branch" "text", 
    "birthday" "date", 
    "gender" "text", 
    "avg_seller_rating" numeric, 
    "total_seller_ratings" integer, 
    "avg_bits_coin_rating" numeric, 
    "total_bits_coin_ratings" integer, 
    "displayed_community_flair" "uuid", 
    "following_count" integer, 
    "follower_count" integer, 
    "is_following" boolean, 
    "is_followed_by" boolean, 
    "roommates" "jsonb", 
    "flair_details" "jsonb", 
    "has_sent_request" boolean, 
    "has_received_request" boolean,
    "privacy_settings" "jsonb",
    "phone" "text"
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_viewer_id uuid;
    v_is_owner boolean;
BEGIN
    v_viewer_id := auth.uid();

  RETURN QUERY
  SELECT
    p.user_id, 
    p.username, 
    p.avatar_url, 
    p.bio, 
    p.created_at, 
    p.full_name, 
    p.email, 
    p.banner_url, 
    p.campus, 
    p.admission_year, 
    
    -- Redactable fields
    CASE WHEN (v_viewer_id = p.user_id OR COALESCE(p.privacy_settings->>'branch', 'public') = 'public') THEN p.branch ELSE NULL END,
    CASE WHEN (v_viewer_id = p.user_id OR COALESCE(p.privacy_settings->>'relationship_status', 'public') = 'public') THEN p.relationship_status ELSE NULL END,
    CASE WHEN (v_viewer_id = p.user_id OR COALESCE(p.privacy_settings->>'dorm', 'public') = 'public') THEN p.dorm_building ELSE NULL END,
    CASE WHEN (v_viewer_id = p.user_id OR COALESCE(p.privacy_settings->>'dorm', 'public') = 'public') THEN p.dorm_room ELSE NULL END,
    CASE WHEN (v_viewer_id = p.user_id OR COALESCE(p.privacy_settings->>'dining_hall', 'public') = 'public') THEN p.dining_hall ELSE NULL END,
    
    p.profile_complete, 
    p.updated_at, 
    p.id, 
    
    CASE WHEN (v_viewer_id = p.user_id OR COALESCE(p.privacy_settings->>'branch', 'public') = 'public') THEN p.dual_degree_branch ELSE NULL END,
    CASE WHEN (v_viewer_id = p.user_id OR COALESCE(p.privacy_settings->>'birthday', 'public') = 'public') THEN p.birthday ELSE NULL END,
    
    p.gender, 
    p.avg_seller_rating, 
    p.total_seller_ratings,
    p.avg_bits_coin_rating,
    p.total_bits_coin_ratings,
    p.displayed_community_flair,
    (SELECT count(*) FROM public.followers WHERE follower_id = p.user_id AND status = 'approved')::int as following_count,
    (SELECT count(*) FROM public.followers WHERE following_id = p.user_id AND status = 'approved')::int as follower_count,
    EXISTS (SELECT 1 FROM public.followers WHERE follower_id = v_viewer_id AND following_id = p.user_id AND status = 'approved') as is_following,
    EXISTS (SELECT 1 FROM public.followers WHERE follower_id = p.user_id AND following_id = v_viewer_id AND status = 'approved') as is_followed_by,
    
    -- Roommates logic: hide if dorm is private
    CASE WHEN (v_viewer_id = p.user_id OR COALESCE(p.privacy_settings->>'dorm', 'public') = 'public') THEN
        (SELECT jsonb_agg(jsonb_build_object('user_id', r.user_id, 'username', r.username, 'full_name', r.full_name, 'avatar_url', r.avatar_url)) FROM public.profiles r WHERE r.user_id != p.user_id AND r.campus = p.campus AND r.dorm_building = p.dorm_building AND r.dorm_room = p.dorm_room AND p.dorm_building IS NOT NULL AND p.dorm_building <> '' AND p.dorm_room IS NOT NULL AND p.dorm_room <> '' AND r.dorm_building IS NOT NULL AND r.dorm_building <> '' AND r.dorm_room IS NOT NULL AND r.dorm_room <> '' AND p.campus IS NOT NULL)
    ELSE NULL END as roommates,
    
    (SELECT jsonb_build_object('id', fc.id, 'name', fc.name, 'avatar_url', fc.avatar_url) FROM public.communities fc WHERE fc.id = p.displayed_community_flair) as flair_details,
    
    EXISTS (SELECT 1 FROM public.followers WHERE follower_id = v_viewer_id AND following_id = p.user_id AND status = 'pending') as has_sent_request,
    EXISTS (SELECT 1 FROM public.followers WHERE follower_id = p.user_id AND following_id = v_viewer_id AND status = 'pending') as has_received_request,
    
    p.privacy_settings,
    
    -- Phone with privacy
    CASE WHEN (v_viewer_id = p.user_id OR COALESCE(p.privacy_settings->>'phone', 'public') = 'public') THEN p.phone ELSE NULL END
  FROM public.profiles p
  WHERE p.username = profile_username;
END;
$$;

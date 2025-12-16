DROP FUNCTION IF EXISTS "public"."get_community_details"("p_community_id" "uuid");

CREATE OR REPLACE FUNCTION "public"."get_community_details"("p_community_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "campus" "text", "avatar_url" "text", "banner_url" "text", "created_by" "uuid", "member_count" bigint, "is_member" boolean, "is_admin" boolean, "has_pending_request" boolean, "access_type" "text", "parent_community_id" "uuid", "parent_community_name" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.name, c.description, c.campus, c.avatar_url, c.banner_url, c.created_by,
    (SELECT count(*) FROM public.community_members cm WHERE cm.community_id = c.id AND cm.status = 'approved') AS member_count,
    EXISTS(SELECT 1 FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = current_user_id AND cm.status = 'approved') AS is_member,
    EXISTS(SELECT 1 FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = current_user_id AND cm.role = 'admin') AS is_admin,
    EXISTS(SELECT 1 FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = current_user_id AND cm.status = 'pending') AS has_pending_request,
    c.access_type,
    c.parent_community_id,
    p.name AS parent_community_name
  FROM public.communities c
  LEFT JOIN public.communities p ON c.parent_community_id = p.id
  WHERE c.id = p_community_id;
END;
$$;

ALTER FUNCTION "public"."get_community_details"("p_community_id" "uuid") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_community_details"("p_community_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_community_details"("p_community_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_community_details"("p_community_id" "uuid") TO "service_role";

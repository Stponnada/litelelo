-- Update create_subcommunity to stop creating conversations
CREATE OR REPLACE FUNCTION "public"."create_subcommunity"("p_parent_community_id" "uuid", "p_name" "text", "p_description" "text", "p_access_type" "text", "p_consul_ids" "uuid"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_subcommunity_id uuid;
  consul_id uuid;
  parent_campus text;
BEGIN
    -- Ensure the creator is an admin of the parent community
    IF NOT public.is_community_admin(p_parent_community_id, auth.uid()) THEN
        RAISE EXCEPTION 'Only consuls of the parent community can create subcommunities.';
    END IF;

    -- Get campus from parent
    SELECT campus INTO parent_campus FROM public.communities WHERE id = p_parent_community_id;

    -- Create the subcommunity record
    INSERT INTO public.communities (name, description, campus, created_by, parent_community_id, access_type)
    VALUES (p_name, p_description, parent_campus, auth.uid(), p_parent_community_id, p_access_type)
    RETURNING id INTO new_subcommunity_id;
    
    -- Add the creator as an admin member to the subcommunity
    INSERT INTO public.community_members (community_id, user_id, role, status)
    VALUES (new_subcommunity_id, auth.uid(), 'admin', 'approved');

    -- Add other assigned consuls
    FOREACH consul_id IN ARRAY p_consul_ids LOOP
        IF consul_id <> auth.uid() THEN
            -- Add as admin to subcommunity
            INSERT INTO public.community_members (community_id, user_id, role, status)
            VALUES (new_subcommunity_id, consul_id, 'admin', 'approved')
            ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin', status = 'approved';
        END IF;
    END LOOP;

    RETURN new_subcommunity_id;
END;
$$;

ALTER FUNCTION "public"."create_subcommunity"("p_parent_community_id" "uuid", "p_name" "text", "p_description" "text", "p_access_type" "text", "p_consul_ids" "uuid"[]) OWNER TO "postgres";

-- Update get_subcommunities to remove conversation_id
-- We need to DROP it first because we are changing the return type signature
DROP FUNCTION IF EXISTS "public"."get_subcommunities"("p_parent_id" "uuid");

CREATE OR REPLACE FUNCTION "public"."get_subcommunities"("p_parent_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "avatar_url" "text", "access_type" "text", "member_count" bigint, "is_member" boolean, "has_pending_request" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        sub.id,
        sub.name,
        sub.description,
        sub.avatar_url,
        sub.access_type,
        (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = sub.id AND cm.status = 'approved') as member_count,
        EXISTS(SELECT 1 FROM community_members cm WHERE cm.community_id = sub.id AND cm.user_id = auth.uid() AND cm.status = 'approved') as is_member,
        EXISTS(SELECT 1 FROM community_members cm WHERE cm.community_id = sub.id AND cm.user_id = auth.uid() AND cm.status = 'pending') as has_pending_request
    FROM communities sub
    WHERE sub.parent_community_id = p_parent_id
    ORDER BY sub.name;
END;
$$;

ALTER FUNCTION "public"."get_subcommunities"("p_parent_id" "uuid") OWNER TO "postgres";

-- Re-grant permissions (since we dropped the function)
GRANT ALL ON FUNCTION "public"."get_subcommunities"("p_parent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_subcommunities"("p_parent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_subcommunities"("p_parent_id" "uuid") TO "service_role";

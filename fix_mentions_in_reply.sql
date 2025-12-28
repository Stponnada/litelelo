CREATE OR REPLACE FUNCTION "public"."create_post_with_poll"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean, "p_poll_options" "text"[], "p_allow_multiple_answers" boolean, "p_visibility" "text" DEFAULT 'public'::"text", "p_allowed_viewers" "uuid"[] DEFAULT '{}'::"uuid"[], "p_parent_post_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_post_id uuid;
    v_poll_id uuid;
    v_post_data jsonb;
    v_root_post_id uuid;
    
    v_inherit_community_id uuid;
    v_inherit_is_public boolean;
    v_inherit_visibility text;
    v_inherit_allowed_viewers uuid[];
    
    v_final_community_id uuid;
    v_final_is_public boolean;
    v_final_visibility text;
    v_final_allowed_viewers uuid[];

    mentioned_users text[];
BEGIN
    IF p_parent_post_id IS NOT NULL THEN
        SELECT COALESCE(root_post_id, id), community_id, is_public, visibility, allowed_viewers
        INTO v_root_post_id, v_inherit_community_id, v_inherit_is_public, v_inherit_visibility, v_inherit_allowed_viewers
        FROM public.posts WHERE id = p_parent_post_id;
        
        v_final_community_id := v_inherit_community_id;
        v_final_is_public := v_inherit_is_public;
        v_final_visibility := v_inherit_visibility;
        v_final_allowed_viewers := v_inherit_allowed_viewers;
    ELSE
        v_root_post_id := NULL;
        v_final_community_id := p_community_id;
        v_final_is_public := p_is_public;
        v_final_visibility := p_visibility;
        v_final_allowed_viewers := p_allowed_viewers;
    END IF;

    INSERT INTO posts (user_id, content, image_url, community_id, is_public, visibility, allowed_viewers, parent_post_id, root_post_id)
    VALUES (auth.uid(), p_content, p_image_url, v_final_community_id, v_final_is_public, v_final_visibility, v_final_allowed_viewers, p_parent_post_id, v_root_post_id)
    RETURNING id INTO v_post_id;

    IF array_length(p_poll_options, 1) > 0 THEN
        INSERT INTO polls (post_id, allow_multiple_answers, created_by)
        VALUES (v_post_id, p_allow_multiple_answers, auth.uid())
        RETURNING id INTO v_poll_id;
        INSERT INTO poll_options (poll_id, option_text) SELECT v_poll_id, unnest(p_poll_options);
    END IF;

    -- Handle mentions
    SELECT array_agg(distinct m[1]) into mentioned_users
    FROM regexp_matches(p_content, '@([a-zA-Z0-9_.]+)', 'g') as m;

    IF mentioned_users IS NOT NULL THEN
        INSERT INTO public.mentions (post_id, user_id, mentioner_id)
        SELECT v_post_id, prof.user_id, auth.uid()
        FROM public.profiles prof
        WHERE prof.username = ANY(mentioned_users);
    END IF;

    SELECT jsonb_build_object(
        'id', p.id, 'content', p.content, 'image_url', p.image_url, 'created_at', p.created_at,
        'community_id', p.community_id, 'is_public', p.is_public, 'visibility', p.visibility,
        'user_id', p.user_id, 'parent_post_id', p.parent_post_id, 'root_post_id', p.root_post_id
    ) INTO v_post_data FROM posts p WHERE p.id = v_post_id;

    RETURN v_post_data;
END;
$$;

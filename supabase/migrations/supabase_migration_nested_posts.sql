-- 1. Add new columns to posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS parent_post_id UUID REFERENCES public.posts(id),
ADD COLUMN IF NOT EXISTS root_post_id UUID REFERENCES public.posts(id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_posts_root_post_id ON public.posts(root_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_parent_post_id ON public.posts(parent_post_id);

-- 2. Migrate existing comments to posts
-- We assume comments are direct children of the post they reference.
-- So parent_post_id = comment.post_id, and root_post_id = comment.post_id.
INSERT INTO public.posts (
    user_id,
    content,
    created_at,
    parent_post_id,
    root_post_id,
    is_public,
    post_type
)
SELECT
    user_id,
    content,
    created_at,
    post_id, -- parent_post_id
    post_id, -- root_post_id (since current comments are only 1 level deep)
    true,     -- is_public (defaulting to true for now, or match parent post if possible, but true is safe for public comments)
    'text'    -- post_type
FROM public.comments;

-- 3. Create function to get post thread
CREATE OR REPLACE FUNCTION public.get_post_thread(p_root_post_id UUID)
RETURNS SETOF public.post_with_details
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.get_posts_with_details()
    WHERE root_post_id = p_root_post_id
       OR id = p_root_post_id -- Include the root post itself
    ORDER BY created_at ASC;
END;
$$;

-- 4. Update create_post_with_poll to handle nesting
-- We need to update the signature and logic.
-- Since we can't easily change the signature of an existing function used by the frontend without breaking it immediately,
-- we will create a NEW function `create_nested_post` that the frontend will switch to.
-- Or better, we overload `create_post_with_poll` or just add a new param with default null.

DROP FUNCTION IF EXISTS public.create_post_with_poll(text, text, uuid, boolean, text[], boolean, text, uuid[]);

CREATE OR REPLACE FUNCTION public.create_post_with_poll(
    p_content text,
    p_image_url text,
    p_community_id uuid,
    p_is_public boolean,
    p_poll_options text[],
    p_allow_multiple_answers boolean,
    p_visibility text DEFAULT 'public',
    p_allowed_viewers uuid[] DEFAULT '{}',
    p_parent_post_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_post_id uuid;
    v_poll_id uuid;
    v_post_data jsonb;
    v_root_post_id uuid;
BEGIN
    -- Determine root_post_id
    IF p_parent_post_id IS NOT NULL THEN
        SELECT COALESCE(root_post_id, id) INTO v_root_post_id
        FROM public.posts
        WHERE id = p_parent_post_id;
        
        -- If the parent doesn't exist (shouldn't happen due to FK but good to be safe), or something else, handle it.
        -- If v_root_post_id is still null (meaning parent has no root, so parent is root), set it to parent.
        -- The COALESCE above handles: if parent.root_post_id is null, use parent.id.
    ELSE
        v_root_post_id := NULL; -- It is a new root post
    END IF;

    -- Insert the post
    INSERT INTO posts (
        user_id, content, image_url, community_id, is_public, visibility, allowed_viewers, parent_post_id, root_post_id
    )
    VALUES (
        auth.uid(), p_content, p_image_url, p_community_id, p_is_public, p_visibility, p_allowed_viewers, p_parent_post_id, v_root_post_id
    )
    RETURNING id INTO v_post_id;

    -- Create poll if options provided
    IF array_length(p_poll_options, 1) > 0 THEN
        INSERT INTO polls (post_id, allow_multiple_answers)
        VALUES (v_post_id, p_allow_multiple_answers)
        RETURNING id INTO v_poll_id;

        INSERT INTO poll_options (poll_id, option_text)
        SELECT v_poll_id, unnest(p_poll_options);
    END IF;

    -- Return the created post data
    -- We can reuse get_posts_with_details or build json manually.
    -- Let's build manually to match previous behavior but include new fields if needed.
    SELECT jsonb_build_object(
        'id', p.id,
        'content', p.content,
        'image_url', p.image_url,
        'created_at', p.created_at,
        'community_id', p.community_id,
        'is_public', p.is_public,
        'visibility', p.visibility,
        'allowed_viewers', p.allowed_viewers,
        'user_id', p.user_id,
        'parent_post_id', p.parent_post_id,
        'root_post_id', p.root_post_id,
        'poll', (
            SELECT jsonb_build_object(
                'id', pl.id,
                'allow_multiple_answers', pl.allow_multiple_answers,
                'options', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', po.id,
                        'option_text', po.option_text,
                        'vote_count', 0
                    ))
                    FROM poll_options po
                    WHERE po.poll_id = pl.id
                )
            )
            FROM polls pl
            WHERE pl.post_id = p.id
        )
    ) INTO v_post_data
    FROM posts p
    WHERE p.id = v_post_id;

    RETURN v_post_data;
END;
$$;

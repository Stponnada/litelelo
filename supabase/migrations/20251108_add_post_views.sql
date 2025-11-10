-- Add view_count column to posts table
ALTER TABLE public.posts ADD COLUMN view_count integer DEFAULT 0;

-- Create table for tracking unique views
CREATE TABLE IF NOT EXISTS public.post_views (
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    viewer_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (post_id, viewer_id)
);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_post_view(post_id uuid, viewer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Try to insert a new view record
    INSERT INTO public.post_views (post_id, viewer_id)
    VALUES (post_id, viewer_id)
    ON CONFLICT (post_id, viewer_id) DO NOTHING;

    -- If we successfully inserted (i.e., this is a new view), increment the count
    IF FOUND THEN
        UPDATE public.posts
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = post_id;
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- Grant appropriate permissions
GRANT ALL ON TABLE public.post_views TO postgres;
GRANT ALL ON TABLE public.post_views TO service_role;
GRANT SELECT, INSERT ON TABLE public.post_views TO authenticated;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.increment_post_view TO authenticated;
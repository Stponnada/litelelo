DO $$
DECLARE
    r RECORD;
    mentioned_users text[];
BEGIN
    FOR r IN SELECT id, content, user_id FROM public.posts WHERE is_deleted = false LOOP
        -- Extract mentions
        SELECT array_agg(distinct m[1]) INTO mentioned_users
        FROM regexp_matches(r.content, '@([a-zA-Z0-9_.]+)', 'g') as m;
        
        IF mentioned_users IS NOT NULL THEN
            INSERT INTO public.mentions (post_id, user_id, mentioner_id)
            SELECT r.id, prof.user_id, r.user_id
            FROM public.profiles prof
            WHERE prof.username ILIKE ANY(mentioned_users)
            AND NOT EXISTS (
                SELECT 1 FROM public.mentions m 
                WHERE m.post_id = r.id AND m.user_id = prof.user_id
            );
        END IF;
    END LOOP;
END $$;

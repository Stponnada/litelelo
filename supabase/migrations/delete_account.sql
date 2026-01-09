-- Function to allow a user to delete their own account and all associated data
CREATE OR REPLACE FUNCTION "public"."delete_own_account"() RETURNS void
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_uid uuid;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Note: Most tables should have ON DELETE CASCADE if they reference profiles or users.
    -- However, we can manually delete from main tables to be sure.
    
    -- 1. Delete notifications
    DELETE FROM public.notifications WHERE user_id = current_uid OR actor_id = current_uid;
    
    -- 2. Delete follows and friend requests
    DELETE FROM public.followers WHERE follower_id = current_uid OR following_id = current_uid;
    
    -- 3. Delete comments, likes, and bookmarks
    DELETE FROM public.comments WHERE user_id = current_uid;
    DELETE FROM public.likes WHERE user_id = current_uid;
    DELETE FROM public.bookmarks WHERE user_id = current_uid;
    
    -- 4. Delete posts and reposts
    DELETE FROM public.reposts WHERE user_id = current_uid;
    DELETE FROM public.posts WHERE user_id = current_uid;
    
    -- 5. Delete community memberships
    DELETE FROM public.community_members WHERE user_id = current_uid;

    -- 6. Delete chat data (participants and messages)
    -- Note: Messages are usually kept in group chats but we remove the participant entry.
    -- If it's a 1-on-1, users might want the messages gone, but for now we follow standard participant removal.
    DELETE FROM public.conversation_participants WHERE user_id = current_uid;
    DELETE FROM public.conversation_read_timestamps WHERE user_id = current_uid;
    
    -- 7. Delete encryption keys
    DELETE FROM public.user_encryption_keys WHERE user_id = current_uid;
    DELETE FROM public.device_keys WHERE user_id = current_uid;

    -- 8. Delete from profiles
    DELETE FROM public.profiles WHERE user_id = current_uid;
    
    -- 9. Finally, delete the user from auth.users
    DELETE FROM auth.users WHERE id = current_uid;
    
END;
$$;

-- Grant access to authenticated users
GRANT ALL ON FUNCTION "public"."delete_own_account"() TO "authenticated";

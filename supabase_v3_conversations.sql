-- Migration to add encrypted fields to conversation list for E2EE previews (v3 Fixed)
DROP FUNCTION IF EXISTS "public"."get_conversations_for_user_v3"();

CREATE OR REPLACE FUNCTION "public"."get_conversations_for_user_v3"() 
RETURNS TABLE(
    conversation_id uuid, 
    name text, 
    type text, 
    participants json, 
    last_message_content text, 
    last_message_encrypted_content text,
    last_message_encrypted_key_sender text,
    last_message_encrypted_key_recipient text,
    last_message_encryption_version integer,
    last_message_at timestamp with time zone, 
    last_message_sender_id uuid, 
    unread_count bigint, 
    is_pinned boolean, 
    is_archived boolean
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS conversation_id,
        c.name,
        c.type,
        (
            SELECT json_agg(p_details)
            FROM (
                SELECT
                    p.user_id,
                    pr.username,
                    pr.full_name,
                    pr.avatar_url
                FROM conversation_participants p
                JOIN profiles pr ON p.user_id = pr.user_id
                WHERE p.conversation_id = c.id
            ) AS p_details
        ) AS participants,
        lm.content AS last_message_content,
        lm.encrypted_content AS last_message_encrypted_content,
        lm.encrypted_key_sender AS last_message_encrypted_key_sender,
        lm.encrypted_key_recipient AS last_message_encrypted_key_recipient,
        lm.encryption_version AS last_message_encryption_version,
        lm.created_at AS last_message_at,
        lm.sender_id AS last_message_sender_id,
        COALESCE(uc.unread, 0) AS unread_count,
        cp.is_pinned,
        cp.is_archived
    FROM
        conversations c
    JOIN
        conversation_participants cp ON c.id = cp.conversation_id
    LEFT JOIN LATERAL (
        SELECT content, encrypted_content, encrypted_key_sender, encrypted_key_recipient, encryption_version, created_at, sender_id
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) lm ON true
    LEFT JOIN conversation_read_timestamps crt ON crt.conversation_id = c.id AND crt.user_id = auth.uid()
    LEFT JOIN LATERAL (
        SELECT count(*) AS unread
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.created_at > COALESCE(crt.last_read_at, '1970-01-01')
          AND m.sender_id != auth.uid()
    ) uc ON true
    WHERE
        cp.user_id = auth.uid()
    ORDER BY
        cp.is_pinned DESC,
        lm.created_at DESC NULLS LAST;
END;
$$;

GRANT ALL ON FUNCTION "public"."get_conversations_for_user_v3"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversations_for_user_v3"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversations_for_user_v3"() TO "service_role";

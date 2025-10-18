


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."event_rsvp_status" AS ENUM (
    'going',
    'interested'
);


ALTER TYPE "public"."event_rsvp_status" OWNER TO "postgres";


CREATE TYPE "public"."marketplace_category" AS ENUM (
    'Books & Notes',
    'Electronics',
    'Furniture',
    'Apparel',
    'Cycles & Vehicles',
    'Other'
);


ALTER TYPE "public"."marketplace_category" OWNER TO "postgres";


CREATE TYPE "public"."post_with_details" AS (
	"id" "uuid",
	"user_id" "uuid",
	"content" "text",
	"image_url" "text",
	"created_at" timestamp with time zone,
	"like_count" bigint,
	"dislike_count" bigint,
	"comment_count" bigint,
	"user_vote" "text",
	"profiles" "jsonb"
);


ALTER TYPE "public"."post_with_details" OWNER TO "postgres";


CREATE TYPE "public"."profile_with_follow_status" AS (
	"user_id" "uuid",
	"username" "text",
	"full_name" "text",
	"avatar_url" "text",
	"follower_count" integer,
	"is_following" boolean,
	"is_followed_by" boolean
);


ALTER TYPE "public"."profile_with_follow_status" OWNER TO "postgres";


CREATE TYPE "public"."reaction_details" AS (
	"emoji" "text",
	"user_id" "uuid",
	"full_name" "text"
);


ALTER TYPE "public"."reaction_details" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cast_poll_vote"("p_option_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    target_poll_id uuid;
    target_poll_allow_multiple boolean;
BEGIN
    -- Get poll info from the option ID
    SELECT poll_id, p.allow_multiple_answers 
    INTO target_poll_id, target_poll_allow_multiple
    FROM public.poll_options po
    JOIN public.polls p ON po.poll_id = p.id
    WHERE po.id = p_option_id;

    -- If it's a single choice poll, remove any previous vote from this user on this poll
    IF NOT target_poll_allow_multiple THEN
        DELETE FROM public.poll_votes 
        WHERE user_id = auth.uid() AND poll_id = target_poll_id;
    END IF;

    -- Insert or delete the vote (allows toggling a vote)
    IF EXISTS (SELECT 1 FROM public.poll_votes WHERE user_id = auth.uid() AND option_id = p_option_id) THEN
        DELETE FROM public.poll_votes WHERE user_id = auth.uid() AND option_id = p_option_id;
    ELSE
        INSERT INTO public.poll_votes (user_id, option_id, poll_id)
        VALUES (auth.uid(), p_option_id, target_poll_id);
    END IF;
END;
$$;


ALTER FUNCTION "public"."cast_poll_vote"("p_option_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_bot_post"("post_content" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  bot_user_id uuid;
BEGIN
  -- First, find the user_id of the birthday bot from its username
  SELECT user_id INTO bot_user_id FROM public.profiles WHERE username = 'birthday_bot';

  -- If the bot's profile was found, insert the post with the provided content
  IF bot_user_id IS NOT NULL THEN
    INSERT INTO public.posts (user_id, content)
    VALUES (bot_user_id, post_content);
  ELSE
    -- If the bot doesn't exist for some reason, raise an error
    RAISE EXCEPTION 'Birthday bot profile "birthday_bot" not found.';
  END IF;
END;
$$;


ALTER FUNCTION "public"."create_bot_post"("post_content" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_community"("p_name" "text", "p_description" "text", "p_campus" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  new_community_id uuid;
  current_user_id uuid := auth.uid();
begin
  -- 1. Create the community
  insert into public.communities (name, description, campus, created_by)
  values (p_name, p_description, p_campus, current_user_id)
  returning id into new_community_id;

  -- 2. Add the creator as the first member of the community
  insert into public.community_members (community_id, user_id)
  values (new_community_id, current_user_id);

  return new_community_id;
end;
$$;


ALTER FUNCTION "public"."create_community"("p_name" "text", "p_description" "text", "p_campus" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_dm_conversation"("recipient_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  existing_conversation_id uuid;
  new_conversation_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if a DM conversation already exists between the two users
  SELECT conversation_id INTO existing_conversation_id
  FROM (
      SELECT cp.conversation_id, array_agg(cp.user_id) as participants
      FROM conversation_participants cp
      JOIN conversations c ON cp.conversation_id = c.id
      WHERE c.type = 'dm'
      GROUP BY cp.conversation_id
      HAVING count(cp.user_id) = 2
  ) as convos
  WHERE convos.participants @> ARRAY[current_user_id, recipient_id];

  -- If it exists, return the existing conversation ID
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;

  -- If it does not exist, create a new one, specifying who created it.
  INSERT INTO public.conversations (type, created_by)
  VALUES ('dm', current_user_id)
  RETURNING id INTO new_conversation_id;

  -- Add both participants to the new conversation
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (new_conversation_id, current_user_id), (new_conversation_id, recipient_id);

  RETURN new_conversation_id;
END;
$$;


ALTER FUNCTION "public"."create_dm_conversation"("recipient_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event"("p_name" "text", "p_description" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_location" "text", "p_campus" "text", "p_image_url" "text", "p_community_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_event_id uuid;
BEGIN
    INSERT INTO public.events (name, description, start_time, end_time, location, campus, image_url, created_by, community_id)
    VALUES (p_name, p_description, p_start_time, p_end_time, p_location, p_campus, p_image_url, auth.uid(), p_community_id)
    RETURNING id INTO new_event_id;

    -- Automatically RSVP the creator as 'going'
    INSERT INTO public.event_rsvps (event_id, user_id, rsvp_status)
    VALUES (new_event_id, auth.uid(), 'going');

    RETURN new_event_id;
END;
$$;


ALTER FUNCTION "public"."create_event"("p_name" "text", "p_description" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_location" "text", "p_campus" "text", "p_image_url" "text", "p_community_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_group_chat"("group_name" "text", "participant_ids" "uuid"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_conversation_id UUID;
  creator_id UUID := auth.uid();
  participant_id UUID;
BEGIN
  -- Create the new group conversation
  INSERT INTO conversations (name, type, created_by)
  VALUES (group_name, 'group', creator_id)
  RETURNING id INTO new_conversation_id;

  -- Add the creator to the participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (new_conversation_id, creator_id);

  -- Add the other participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    -- Ensure we don't add the creator twice or have duplicates
    IF participant_id <> creator_id THEN
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (new_conversation_id, participant_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN new_conversation_id;
END;
$$;


ALTER FUNCTION "public"."create_group_chat"("group_name" "text", "participant_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_post_with_mentions"("post_content" "text", "post_image_url" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."post_with_details"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_post_id UUID;
    mentioned_username TEXT;
    mentioned_user_id UUID;
BEGIN
    INSERT INTO public.posts (user_id, content, image_url)
    VALUES (auth.uid(), post_content, post_image_url)
    RETURNING posts.id INTO new_post_id;

    -- THE FIX IS HERE: The regex now includes the dot character '.'
    FOR mentioned_username IN
        SELECT DISTINCT matches[1]
        FROM regexp_matches(post_content, '@([a-zA-Z0-9_.]+)', 'g') AS matches
    LOOP
        SELECT profiles.user_id INTO mentioned_user_id
        FROM public.profiles
        WHERE profiles.username = mentioned_username;

        IF mentioned_user_id IS NOT NULL THEN
            INSERT INTO public.mentions (post_id, user_id, mentioner_id)
            VALUES (new_post_id, mentioned_user_id, auth.uid());
        END IF;
    END LOOP;

    RETURN QUERY
    SELECT * FROM public.get_posts_with_details() WHERE id = new_post_id;
END;
$$;


ALTER FUNCTION "public"."create_post_with_mentions"("post_content" "text", "post_image_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_post_with_mentions"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_post record;
BEGIN
    -- Call the main poll function with empty poll data
    SELECT *
    INTO new_post
    FROM public.create_post_with_poll(
        p_content,
        p_image_url,
        p_community_id,
        p_is_public,
        '{}'::text[],
        false
    );

    RETURN to_json(new_post);
END;
$$;


ALTER FUNCTION "public"."create_post_with_mentions"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_post_with_poll"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean, "p_poll_options" "text"[], "p_allow_multiple_answers" boolean) RETURNS TABLE("id" "uuid", "content" "text", "image_url" "text", "created_at" timestamp with time zone, "like_count" bigint, "comment_count" bigint, "user_vote" "text", "is_bookmarked" boolean, "is_edited" boolean, "is_deleted" boolean, "community_id" "uuid", "is_public" boolean, "author_id" "uuid", "author_type" "text", "author_name" "text", "author_username" "text", "author_avatar_url" "text", "original_poster_username" "text", "poll" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_post_id uuid;
    new_poll_id uuid;
    option_text text;
    mentioned_users text[];
BEGIN
    -- Insert the post
    INSERT INTO public.posts (user_id, content, image_url, community_id, is_public)
    VALUES (auth.uid(), p_content, p_image_url, p_community_id, p_is_public)
    RETURNING posts.id INTO new_post_id;

    -- Insert the poll if options are provided
    IF array_length(p_poll_options, 1) > 0 THEN
        INSERT INTO public.polls (post_id, created_by, allow_multiple_answers)
        VALUES (new_post_id, auth.uid(), p_allow_multiple_answers)
        RETURNING polls.id INTO new_poll_id;

        FOREACH option_text IN ARRAY p_poll_options LOOP
            INSERT INTO public.poll_options (poll_id, option_text)
            VALUES (new_poll_id, option_text);
        END LOOP;
    END IF;

    -- Handle mentions
    SELECT array_agg(distinct m[1]) into mentioned_users
    FROM regexp_matches(p_content, '@([a-zA-Z0-9_.]+)', 'g') as m;

    IF mentioned_users IS NOT NULL THEN
        INSERT INTO public.mentions (post_id, user_id, mentioner_id)
        SELECT new_post_id, prof.user_id, auth.uid()
        FROM public.profiles prof
        WHERE prof.username = ANY(mentioned_users);
    END IF;

    -- Return the newly created post with all details
    RETURN QUERY
    SELECT
        p.id, p.content, p.image_url, p.created_at, p.like_count, p.comment_count,
        NULL::text as user_vote,
        false as is_bookmarked,
        p.is_edited, p.is_deleted, p.community_id, p.is_public,
        COALESCE(p.community_id, p.user_id) as author_id,
        CASE WHEN p.community_id IS NOT NULL THEN 'community' ELSE 'user' END as author_type,
        COALESCE(c.name, up.full_name) as author_name,
        COALESCE(c.id::text, up.username) as author_username,
        COALESCE(c.avatar_url, up.avatar_url) as author_avatar_url,
        op.username as original_poster_username,
        (SELECT jsonb_build_object(
            'id', poll.id,
            'allow_multiple_answers', poll.allow_multiple_answers,
            'total_votes', (SELECT SUM(vote_count) FROM poll_options WHERE poll_id = poll.id),
            'user_votes', (SELECT jsonb_agg(option_id) FROM poll_votes WHERE poll_id = poll.id AND user_id = auth.uid()),
            'options', (SELECT jsonb_agg(jsonb_build_object('id', po.id, 'option_text', po.option_text, 'vote_count', po.vote_count) ORDER BY po.id) FROM poll_options po WHERE po.poll_id = poll.id)
        ) FROM polls poll WHERE poll.post_id = p.id) AS poll
    FROM posts p
    LEFT JOIN profiles up ON p.user_id = up.user_id AND p.community_id IS NULL
    LEFT JOIN communities c ON p.community_id = c.id
    LEFT JOIN profiles op ON p.user_id = op.user_id AND p.community_id IS NOT NULL
    WHERE p.id = new_post_id;
END;
$$;


ALTER FUNCTION "public"."create_post_with_poll"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean, "p_poll_options" "text"[], "p_allow_multiple_answers" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_vote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.poll_options
    SET vote_count = vote_count - 1
    WHERE id = OLD.option_id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."decrement_vote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_listing"("p_listing_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  listing_seller_id uuid;
  image_paths text[];
BEGIN
  -- 1. Check for ownership
  SELECT seller_id INTO listing_seller_id FROM public.marketplace_listings WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF listing_seller_id <> auth.uid() THEN
    RAISE EXCEPTION 'Permission denied to delete this listing';
  END IF;

  -- 2. Get all image paths from storage for this listing
  SELECT array_agg(
    -- Extracts the path after the bucket name, e.g., "public/marketplace-images/path/to/image.jpg" -> "path/to/image.jpg"
    array_to_string(array_remove(string_to_array(image_url, '/'), ''), '/')
  )
  INTO image_paths
  FROM public.marketplace_images
  WHERE listing_id = p_listing_id;

  -- 3. Delete images from storage (if any exist)
  IF array_length(image_paths, 1) > 0 THEN
    PERFORM storage.delete_objects('marketplace-images', image_paths);
  END IF;

  -- 4. Delete the listing from the database.
  -- RLS policies will handle cascading deletes for marketplace_images table.
  DELETE FROM public.marketplace_listings WHERE id = p_listing_id;

END;
$$;


ALTER FUNCTION "public"."delete_listing"("p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_birthday_users"("p_month" integer, "p_day" integer) RETURNS TABLE("full_name" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.full_name
  FROM
    public.profiles p
  WHERE
    p.profile_complete = true
    AND date_part('month', p.birthday) = p_month
    AND date_part('day', p.birthday) = p_day;
END;
$$;


ALTER FUNCTION "public"."get_birthday_users"("p_month" integer, "p_day" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bookmarked_posts"() RETURNS TABLE("id" "uuid", "user_id" "uuid", "content" "text", "image_url" "text", "created_at" timestamp with time zone, "like_count" bigint, "comment_count" bigint, "user_vote" "text", "is_bookmarked" boolean, "is_edited" boolean, "is_deleted" boolean, "community_id" "uuid", "is_public" boolean, "author_id" "uuid", "author_type" "text", "author_name" "text", "author_username" "text", "author_avatar_url" "text", "original_poster_username" "text", "poll" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT p.id, p.user_id, p.content, p.image_url, p.created_at, p.like_count, p.comment_count, l.like_type AS user_vote, true AS is_bookmarked, p.is_edited, p.is_deleted, p.community_id, p.is_public, COALESCE(p.community_id, p.user_id) as author_id, CASE WHEN p.community_id IS NOT NULL THEN 'community' ELSE 'user' END as author_type, COALESCE(c.name, up.full_name) as author_name, COALESCE(c.id::text, up.username) as author_username, COALESCE(c.avatar_url, up.avatar_url) as author_avatar_url, op.username as original_poster_username, (SELECT jsonb_build_object('id', poll.id, 'allow_multiple_answers', poll.allow_multiple_answers, 'total_votes', (SELECT SUM(vote_count) FROM poll_options WHERE poll_id = poll.id), 'user_votes', (SELECT jsonb_agg(option_id) FROM poll_votes WHERE poll_id = poll.id AND user_id = auth.uid()), 'options', (SELECT jsonb_agg(jsonb_build_object('id', po.id, 'option_text', po.option_text, 'vote_count', po.vote_count) ORDER BY po.id) FROM poll_options po WHERE po.poll_id = poll.id)) FROM polls poll WHERE poll.post_id = p.id) AS poll
FROM posts p
JOIN bookmarks book ON p.id = book.post_id
LEFT JOIN likes l ON p.id = l.post_id AND l.user_id = auth.uid()
LEFT JOIN profiles up ON p.user_id = up.user_id AND p.community_id IS NULL
LEFT JOIN communities c ON p.community_id = c.id
LEFT JOIN profiles op ON p.user_id = op.user_id AND p.community_id IS NOT NULL
WHERE p.is_deleted = false AND book.user_id = auth.uid()
ORDER BY book.created_at DESC;
$$;


ALTER FUNCTION "public"."get_bookmarked_posts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_campus_events"("p_campus" "text") RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "start_time" timestamp with time zone, "end_time" timestamp with time zone, "location" "text", "image_url" "text", "campus" "text", "created_by" "jsonb", "community" "jsonb", "going_count" bigint, "interested_count" bigint, "user_rsvp_status" "public"."event_rsvp_status")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.description,
        e.start_time,
        e.end_time,
        e.location,
        e.image_url,
        e.campus,
        jsonb_build_object(
            'user_id', creator.user_id,
            'username', creator.username,
            'full_name', creator.full_name,
            'avatar_url', creator.avatar_url
        ) as created_by,
        CASE
            WHEN comm.id IS NOT NULL THEN jsonb_build_object(
                'id', comm.id,
                'name', comm.name,
                'avatar_url', comm.avatar_url
            )
            ELSE NULL
        END as community,
        (SELECT count(*) FROM event_rsvps WHERE event_id = e.id AND rsvp_status = 'going') as going_count,
        (SELECT count(*) FROM event_rsvps WHERE event_id = e.id AND rsvp_status = 'interested') as interested_count,
        (SELECT rsvp_status FROM event_rsvps WHERE event_id = e.id AND user_id = auth.uid()) as user_rsvp_status
    FROM
        events e
    JOIN
        profiles creator ON e.created_by = creator.user_id
    LEFT JOIN
        communities comm ON e.community_id = comm.id
    WHERE
        e.campus = p_campus
    ORDER BY
        e.start_time ASC;
END;
$$;


ALTER FUNCTION "public"."get_campus_events"("p_campus" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_campus_places_with_ratings"("p_campus" "text") RETURNS TABLE("id" "uuid", "name" "text", "category" "text", "location" "text", "campus" "text", "avg_rating" numeric, "review_count" bigint, "primary_image_url" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.id,
        cp.name,
        cp.category,
        cp.location,
        cp.campus,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(r.id) AS review_count,
        (
            SELECT cpi.image_url 
            FROM public.campus_place_images cpi 
            WHERE cpi.place_id = cp.id 
            ORDER BY cpi.created_at 
            LIMIT 1
        ) AS primary_image_url
    FROM
        public.campus_places cp
    LEFT JOIN
        public.reviews r ON cp.id = r.place_id
    WHERE
        cp.campus = p_campus
    GROUP BY
        cp.id
    ORDER BY
        cp.location,
        cp.name;
END;
$$;


ALTER FUNCTION "public"."get_campus_places_with_ratings"("p_campus" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_communities_for_user"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "avatar_url" "text", "role" "text")
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    c.id,
    c.name,
    c.avatar_url,
    cm.role -- Select the role from the community_members table
  FROM
    public.communities c
  JOIN
    public.community_members cm ON c.id = cm.community_id
  WHERE
    cm.user_id = p_user_id
  ORDER BY
    c.name;
$$;


ALTER FUNCTION "public"."get_communities_for_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_communities_list"("p_campus" "text") RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "avatar_url" "text", "member_count" bigint, "is_member" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.description,
        c.avatar_url,
        (SELECT count(*) FROM community_members cm WHERE cm.community_id = c.id) as member_count,
        EXISTS(
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
        ) as is_member
    FROM
        communities c
    WHERE
        c.campus = p_campus
    ORDER BY
        member_count DESC,
        c.name;
END;
$$;


ALTER FUNCTION "public"."get_communities_list"("p_campus" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_community_details"("p_community_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "campus" "text", "avatar_url" "text", "banner_url" "text", "created_by" "uuid", "member_count" bigint, "is_member" boolean, "conversation_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
declare
  current_user_id uuid := auth.uid();
begin
  return query
  select
    c.id,
    c.name,
    c.description,
    c.campus,
    c.avatar_url,
    c.banner_url,
    c.created_by,
    (select count(*) from public.community_members cm where cm.community_id = c.id) as member_count,
    exists(select 1 from public.community_members cm where cm.community_id = c.id and cm.user_id = current_user_id) as is_member,
    null::uuid as conversation_id -- Always return null for conversation_id
  from
    public.communities c
  where
    c.id = p_community_id;
end;
$$;


ALTER FUNCTION "public"."get_community_details"("p_community_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversations_for_user_v2"() RETURNS TABLE("conversation_id" "uuid", "name" "text", "type" "text", "participants" json, "last_message_content" "text", "last_message_at" timestamp with time zone, "last_message_sender_id" "uuid", "unread_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
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
        lm.created_at AS last_message_at,
        lm.sender_id AS last_message_sender_id,
        COALESCE(uc.unread, 0) AS unread_count
    FROM
        conversations c
    JOIN
        conversation_participants cp ON c.id = cp.conversation_id
    LEFT JOIN LATERAL (
        SELECT content, created_at, sender_id
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
        lm.created_at DESC NULLS LAST;
END;
$$;


ALTER FUNCTION "public"."get_conversations_for_user_v2"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_feed_posts"() RETURNS TABLE("id" "uuid", "user_id" "uuid", "content" "text", "image_url" "text", "created_at" timestamp with time zone, "is_edited" boolean, "is_deleted" boolean, "community_id" "uuid", "is_public" boolean, "like_count" bigint, "comment_count" bigint, "user_vote" "text", "is_bookmarked" boolean, "original_poster_username" "text", "author_id" "text", "author_type" "text", "author_name" "text", "author_username" "text", "author_avatar_url" "text", "poll" "jsonb")
    LANGUAGE "sql"
    AS $$
SELECT
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.created_at,
    p.is_edited,
    p.is_deleted,
    p.community_id,
    p.is_public,
    p.like_count,
    p.comment_count,
    l.like_type AS user_vote,
    b.post_id IS NOT NULL AS is_bookmarked,
    op.username AS original_poster_username,
    COALESCE(p.community_id::text, p.user_id::text) AS author_id,
    CASE WHEN p.community_id IS NOT NULL THEN 'community' ELSE 'user' END AS author_type,
    COALESCE(c.name, up.full_name) AS author_name,
    COALESCE(c.id::text, up.username) AS author_username,
    COALESCE(c.avatar_url, up.avatar_url) AS author_avatar_url,
    poll_details.poll
FROM
    posts p
LEFT JOIN
    likes l ON p.id = l.post_id AND l.user_id = auth.uid()
LEFT JOIN
    bookmarks b ON p.id = b.post_id AND b.user_id = auth.uid()
LEFT JOIN
    profiles up ON p.user_id = up.user_id AND p.community_id IS NULL
LEFT JOIN
    communities c ON p.community_id = c.id
LEFT JOIN
    profiles op ON p.user_id = op.user_id AND p.community_id IS NOT NULL
LEFT JOIN LATERAL (
    SELECT
        jsonb_build_object(
            'id', po.id,
            'allow_multiple_answers', po.allow_multiple_answers,
            'total_votes', COALESCE((SELECT SUM(opt.vote_count) FROM poll_options opt WHERE opt.poll_id = po.id), 0),
            'user_votes', (
                SELECT jsonb_agg(pv.option_id)
                FROM poll_votes pv
                WHERE pv.poll_id = po.id AND pv.user_id = auth.uid()
            ),
            'options', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', opt.id,
                        'option_text', opt.option_text,
                        'vote_count', opt.vote_count
                    ) ORDER BY opt.id -- THIS IS THE FIX: Changed from opt.created_at
                )
                FROM poll_options opt
                WHERE opt.poll_id = po.id
            )
        ) AS poll
    FROM polls po
    WHERE po.post_id = p.id
) poll_details ON TRUE
WHERE
    p.is_deleted = false
    AND (
        p.community_id IS NULL
        OR
        p.is_public = true
        OR
        (p.community_id IS NOT NULL AND p.is_public = false AND EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = p.community_id AND cm.user_id = auth.uid()
        ))
    )
ORDER BY
    p.created_at DESC;
$$;


ALTER FUNCTION "public"."get_feed_posts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_follow_list"("profile_user_id" "uuid", "list_type" "text") RETURNS SETOF "public"."profile_with_follow_status"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    target_ids UUID[];
BEGIN
    IF list_type = 'followers' THEN
        SELECT array_agg(follower_id) INTO target_ids FROM public.followers WHERE following_id = profile_user_id;
    ELSIF list_type = 'following' THEN
        SELECT array_agg(following_id) INTO target_ids FROM public.followers WHERE follower_id = profile_user_id;
    END IF;

    RETURN QUERY
    SELECT
        p.user_id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.follower_count,
        (EXISTS (SELECT 1 FROM public.followers WHERE following_id = p.user_id AND follower_id = auth.uid())) as is_following,
        (EXISTS (SELECT 1 FROM public.followers WHERE follower_id = p.user_id AND following_id = auth.uid())) as is_followed_by
    FROM
        public.profiles p
    WHERE
        p.user_id = ANY(coalesce(target_ids, '{}'));
END;
$$;


ALTER FUNCTION "public"."get_follow_list"("profile_user_id" "uuid", "list_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_images_for_place"("p_place_id" "uuid") RETURNS TABLE("image_url" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT cpi.image_url
    FROM public.campus_place_images cpi
    WHERE cpi.place_id = p_place_id
    ORDER BY cpi.created_at;
END;
$$;


ALTER FUNCTION "public"."get_images_for_place"("p_place_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."marketplace_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "category" "public"."marketplace_category" NOT NULL,
    "campus" "text" NOT NULL,
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."marketplace_listings" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_listings_by_seller"("p_seller_username" "text") RETURNS SETOF "public"."marketplace_listings"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT ml.*
    FROM marketplace_listings AS ml
    JOIN profiles AS p ON ml.seller_id = p.user_id
    WHERE p.username = p_seller_username AND ml.status = 'available'
    ORDER BY ml.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_listings_by_seller"("p_seller_username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_marketplace_listings"("p_campus" "text") RETURNS TABLE("id" "uuid", "seller_id" "uuid", "title" "text", "description" "text", "price" numeric, "category" "public"."marketplace_category", "campus" "text", "status" "text", "created_at" timestamp with time zone, "seller_profile" "jsonb", "primary_image_url" "text", "all_images" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        ml.id,
        ml.seller_id,
        ml.title,
        ml.description,
        ml.price,
        ml.category,
        ml.campus,
        ml.status,
        ml.created_at,
        jsonb_build_object(
            'user_id', p.user_id,
            'username', p.username,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url,
            'avg_seller_rating', p.avg_seller_rating,
            'total_seller_ratings', p.total_seller_ratings
        ) AS seller_profile,
        (SELECT mi.image_url FROM marketplace_images mi WHERE mi.listing_id = ml.id ORDER BY mi.created_at LIMIT 1) AS primary_image_url,
        (SELECT jsonb_agg(mi.image_url ORDER BY mi.created_at) FROM marketplace_images mi WHERE mi.listing_id = ml.id) AS all_images
    FROM
        marketplace_listings ml
    JOIN
        profiles p ON ml.seller_id = p.user_id
    WHERE
        ml.campus = p_campus AND ml.status = 'available'
    ORDER BY
        ml.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_marketplace_listings"("p_campus" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mentions_for_user"("profile_user_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "content" "text", "image_url" "text", "created_at" timestamp with time zone, "like_count" bigint, "comment_count" bigint, "user_vote" "text", "is_bookmarked" boolean, "is_edited" boolean, "is_deleted" boolean, "community_id" "uuid", "is_public" boolean, "author_id" "uuid", "author_type" "text", "author_name" "text", "author_username" "text", "author_avatar_url" "text", "original_poster_username" "text", "poll" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT p.id, p.user_id, p.content, p.image_url, p.created_at, p.like_count, p.comment_count, l.like_type AS user_vote, EXISTS (SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = auth.uid()) AS is_bookmarked, p.is_edited, p.is_deleted, p.community_id, p.is_public, COALESCE(p.community_id, p.user_id) as author_id, CASE WHEN p.community_id IS NOT NULL THEN 'community' ELSE 'user' END as author_type, COALESCE(c.name, up.full_name) as author_name, COALESCE(c.id::text, up.username) as author_username, COALESCE(c.avatar_url, up.avatar_url) as author_avatar_url, op.username as original_poster_username, (SELECT jsonb_build_object('id', poll.id, 'allow_multiple_answers', poll.allow_multiple_answers, 'total_votes', (SELECT SUM(vote_count) FROM poll_options WHERE poll_id = poll.id), 'user_votes', (SELECT jsonb_agg(option_id) FROM poll_votes WHERE poll_id = poll.id AND user_id = auth.uid()), 'options', (SELECT jsonb_agg(jsonb_build_object('id', po.id, 'option_text', po.option_text, 'vote_count', po.vote_count) ORDER BY po.id) FROM poll_options po WHERE po.poll_id = poll.id)) FROM polls poll WHERE poll.post_id = p.id) AS poll
FROM posts p
JOIN mentions m ON p.id = m.post_id
LEFT JOIN likes l ON p.id = l.post_id AND l.user_id = auth.uid()
LEFT JOIN profiles up ON p.user_id = up.user_id AND p.community_id IS NULL
LEFT JOIN communities c ON p.community_id = c.id
LEFT JOIN profiles op ON p.user_id = op.user_id AND p.community_id IS NOT NULL
WHERE p.is_deleted = false AND m.user_id = profile_user_id
ORDER BY p.created_at DESC;
$$;


ALTER FUNCTION "public"."get_mentions_for_user"("profile_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_messages_for_conversation"("p_conversation_id" "uuid") RETURNS TABLE("id" bigint, "conversation_id" "uuid", "sender_id" "uuid", "content" "text", "created_at" timestamp with time zone, "message_type" "text", "attachment_url" "text", "reply_to_message_id" bigint, "is_edited" boolean, "is_deleted" boolean, "profiles" "jsonb", "reactions" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.conversation_participants
        WHERE conversation_participants.conversation_id = p_conversation_id
          AND conversation_participants.user_id = auth.uid()
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH messages_with_profiles AS (
        SELECT
            m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
            m.message_type, m.attachment_url, m.reply_to_message_id, m.is_edited, m.is_deleted,
            jsonb_build_object(
                'user_id', p.user_id, 'username', p.username,
                'full_name', p.full_name, 'avatar_url', p.avatar_url
            ) as profiles
        FROM public.messages m
        JOIN public.profiles p ON m.sender_id = p.user_id
        WHERE m.conversation_id = p_conversation_id
    ),
    reactions_agg AS (
        SELECT
            mr.message_id,
            jsonb_agg(
                jsonb_build_object(
                    'message_id', mr.message_id, 'user_id', mr.user_id, 'emoji', mr.emoji,
                    'profiles', jsonb_build_object(
                        'user_id', p.user_id, 'username', p.username,
                        'full_name', p.full_name, 'avatar_url', p.avatar_url
                    )
                )
            ) AS reactions
        FROM public.message_reactions mr
        JOIN public.profiles p ON mr.user_id = p.user_id
        WHERE mr.message_id IN (SELECT id FROM messages_with_profiles)
        GROUP BY mr.message_id
    )
    SELECT
        mwp.id, mwp.conversation_id, mwp.sender_id, mwp.content, mwp.created_at,
        mwp.message_type, mwp.attachment_url, mwp.reply_to_message_id, mwp.is_edited, mwp.is_deleted,
        mwp.profiles,
        COALESCE(ra.reactions, '[]'::jsonb)
    FROM messages_with_profiles mwp
    LEFT JOIN reactions_agg ra ON mwp.id = ra.message_id
    ORDER BY mwp.created_at ASC;
END;
$$;


ALTER FUNCTION "public"."get_messages_for_conversation"("p_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mutual_followers"("p_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "username" "text", "full_name" "text", "avatar_url" "text")
    LANGUAGE "sql"
    AS $$
  -- This query finds users who are in both follow lists
  SELECT
      p.user_id,
      p.username,
      p.full_name,
      p.avatar_url
  FROM
      profiles p
  WHERE
      p.user_id IN (
          -- List of users that p_user_id follows
          SELECT following_id FROM followers WHERE follower_id = p_user_id
          INTERSECT
          -- List of users that follow p_user_id
          SELECT follower_id FROM followers WHERE following_id = p_user_id
      );
$$;


ALTER FUNCTION "public"."get_mutual_followers"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_conversation_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_conversation_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_non_community_members"("p_community_id" "uuid") RETURNS TABLE("user_id" "uuid", "username" "text", "full_name" "text", "avatar_url" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.user_id,
        p.username,
        p.full_name,
        p.avatar_url
    FROM
        public.profiles p
    WHERE
        NOT EXISTS (
            SELECT 1
            FROM public.community_members cm
            WHERE cm.community_id = p_community_id AND cm.user_id = p.user_id
        );
END;
$$;


ALTER FUNCTION "public"."get_non_community_members"("p_community_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pinned_message_for_conversation"("p_conversation_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    pinned_message_details jsonb;
BEGIN
    IF NOT is_participant(p_conversation_id) THEN
        RETURN NULL;
    END IF;

    SELECT
        jsonb_build_object(
            'id', pm.id,
            'conversation_id', pm.conversation_id,
            'message_id', pm.message_id,
            'pinned_by_user_id', pm.pinned_by_user_id,
            'created_at', pm.created_at,
            'expires_at', pm.expires_at,
            'message', to_jsonb(m.*),
            'pinner', jsonb_build_object(
                'user_id', pinner_profile.user_id,
                'username', pinner_profile.username,
                'full_name', pinner_profile.full_name
            )
        )
    INTO
        pinned_message_details
    FROM
        public.pinned_messages pm
    JOIN
        public.messages m ON pm.message_id = m.id
    JOIN
        public.profiles pinner_profile ON pm.pinned_by_user_id = pinner_profile.user_id
    WHERE
        pm.conversation_id = p_conversation_id
        AND (pm.expires_at IS NULL OR pm.expires_at > now())
    LIMIT 1;

    RETURN pinned_message_details;
END;
$$;


ALTER FUNCTION "public"."get_pinned_message_for_conversation"("p_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_posts_for_community"("p_community_id" "uuid") RETURNS TABLE("id" "uuid", "content" "text", "image_url" "text", "created_at" timestamp with time zone, "like_count" bigint, "comment_count" bigint, "user_vote" "text", "community_id" "uuid", "is_public" boolean, "author" json, "original_poster_user_id" "uuid", "original_poster_username" "text", "original_poster_full_name" "text", "original_poster_avatar_url" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH post_likes AS (
      SELECT
        likes.post_id,
        count(*) AS likes
      FROM likes
      WHERE likes.like_type = 'like'
      GROUP BY likes.post_id
    )
    SELECT
        p.id,
        p.content,
        p.image_url,
        p.created_at,
        COALESCE(pl.likes, 0) as like_count,
        p.comment_count,
        l.like_type AS user_vote,
        p.community_id,
        p.is_public,
        json_build_object(
            'author_id', c.id,
            'author_type', 'community',
            'author_name', c.name,
            'author_username', null, -- Communities don't have usernames
            'author_avatar_url', c.avatar_url
        ) AS author,
        op.user_id as original_poster_user_id,
        op.username AS original_poster_username,
        op.full_name AS original_poster_full_name,
        op.avatar_url AS original_poster_avatar_url
    FROM
        posts p
    JOIN
        communities c ON p.community_id = c.id
    JOIN
        profiles op ON p.user_id = op.user_id -- op stands for original poster
    LEFT JOIN
        post_likes pl ON p.id = pl.post_id
    LEFT JOIN
        likes l ON p.id = l.post_id AND l.user_id = auth.uid()
    WHERE
        p.community_id = p_community_id
    ORDER BY
        p.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_posts_for_community"("p_community_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_posts_for_profile"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "content" "text", "image_url" "text", "created_at" timestamp with time zone, "like_count" bigint, "comment_count" bigint, "user_vote" "text", "is_bookmarked" boolean, "is_edited" boolean, "is_deleted" boolean, "community_id" "uuid", "is_public" boolean, "author_id" "uuid", "author_type" "text", "author_name" "text", "author_username" "text", "author_avatar_url" "text", "original_poster_username" "text", "poll" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT p.id, p.user_id, p.content, p.image_url, p.created_at, p.like_count, p.comment_count, l.like_type AS user_vote, EXISTS (SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = auth.uid()) AS is_bookmarked, p.is_edited, p.is_deleted, p.community_id, p.is_public, COALESCE(p.community_id, p.user_id) as author_id, CASE WHEN p.community_id IS NOT NULL THEN 'community' ELSE 'user' END as author_type, COALESCE(c.name, up.full_name) as author_name, COALESCE(c.id::text, up.username) as author_username, COALESCE(c.avatar_url, up.avatar_url) as author_avatar_url, op.username as original_poster_username, (SELECT jsonb_build_object('id', poll.id, 'allow_multiple_answers', poll.allow_multiple_answers, 'total_votes', (SELECT SUM(vote_count) FROM poll_options WHERE poll_id = poll.id), 'user_votes', (SELECT jsonb_agg(option_id) FROM poll_votes WHERE poll_id = poll.id AND user_id = auth.uid()), 'options', (SELECT jsonb_agg(jsonb_build_object('id', po.id, 'option_text', po.option_text, 'vote_count', po.vote_count) ORDER BY po.id) FROM poll_options po WHERE po.poll_id = poll.id)) FROM polls poll WHERE poll.post_id = p.id) AS poll
FROM posts p
LEFT JOIN likes l ON p.id = l.post_id AND l.user_id = auth.uid()
LEFT JOIN profiles up ON p.user_id = up.user_id AND p.community_id IS NULL
LEFT JOIN communities c ON p.community_id = c.id
LEFT JOIN profiles op ON p.user_id = op.user_id AND p.community_id IS NOT NULL
WHERE p.is_deleted = false AND (p.user_id = p_user_id OR p.community_id IN (SELECT cm.community_id FROM community_members cm WHERE cm.user_id = p_user_id))
ORDER BY p.created_at DESC;
$$;


ALTER FUNCTION "public"."get_posts_for_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_posts_with_likes"("p_profile_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" bigint, "content" "text", "image_url" "text", "created_at" timestamp with time zone, "user_id" "uuid", "profiles" "jsonb", "like_count" bigint, "comment_count" bigint, "user_has_liked" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.content,
        p.image_url,
        p.created_at,
        p.user_id,
        COALESCE(
            jsonb_build_object(
                'user_id', pr.user_id,
                'username', pr.username,
                'avatar_url', pr.avatar_url,
                'full_name', pr.full_name
            ),
            '{"username": "deleted_user", "full_name": "Deleted User"}'::jsonb
        ) AS profiles,
        (SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id) AS comment_count,
        EXISTS(SELECT 1 FROM public.likes l WHERE l.post_id = p.id AND l.user_id = auth.uid()) AS user_has_liked
    FROM
        public.posts p
    LEFT JOIN
        public.profiles pr ON p.user_id = pr.user_id
    WHERE
        p_profile_id IS NULL OR p.user_id = p_profile_id
    ORDER BY
        p.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_posts_with_likes"("p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_details"("profile_username" "text") RETURNS TABLE("user_id" "uuid", "username" "text", "avatar_url" "text", "bio" "text", "created_at" timestamp with time zone, "full_name" "text", "email" "text", "banner_url" "text", "campus" "text", "admission_year" integer, "branch" "text", "relationship_status" "text", "dorm_building" "text", "dorm_room" "text", "dining_hall" "text", "profile_complete" boolean, "updated_at" timestamp with time zone, "id" bigint, "dual_degree_branch" "text", "birthday" "date", "gender" "text", "avg_seller_rating" numeric, "total_seller_ratings" integer, "following_count" integer, "follower_count" integer, "is_following" boolean, "is_followed_by" boolean, "roommates" "jsonb")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
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
    p.branch,
    p.relationship_status,
    p.dorm_building,
    p.dorm_room,
    p.dining_hall,
    -- "p.clubs" has been removed from here
    p.profile_complete,
    p.updated_at,
    p.id,
    p.dual_degree_branch,
    p.birthday,
    p.gender,
    p.avg_seller_rating,
    p.total_seller_ratings,
    (SELECT count(*) FROM public.followers WHERE follower_id = p.user_id)::int as following_count,
    (SELECT count(*) FROM public.followers WHERE following_id = p.user_id)::int as follower_count,
    EXISTS (
      SELECT 1 FROM public.followers
      WHERE follower_id = auth.uid() AND following_id = p.user_id
    ) as is_following,
    EXISTS (
      SELECT 1 FROM public.followers
      WHERE follower_id = p.user_id AND following_id = auth.uid()
    ) as is_followed_by,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', r.user_id,
        'username', r.username,
        'full_name', r.full_name,
        'avatar_url', r.avatar_url
      ))
      FROM public.profiles r
      WHERE
        r.user_id != p.user_id AND
        r.campus = p.campus AND
        r.dorm_building = p.dorm_building AND
        r.dorm_room = p.dorm_room AND
        p.dorm_building IS NOT NULL AND
        p.dorm_room IS NOT NULL AND
        p.campus IS NOT NULL
    ) as roommates
  FROM
    public.profiles p
  WHERE
    p.username = profile_username;
$$;


ALTER FUNCTION "public"."get_profile_details"("profile_username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_search_recommendations"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'follow_suggestions', (
            SELECT COALESCE(json_agg(s), '[]')
            FROM (
                SELECT
                    p.user_id,
                    p.username,
                    p.full_name,
                    p.avatar_url,
                    p.bio
                FROM profiles p
                WHERE p.user_id IN (
                    -- Users who follow me
                    SELECT f1.follower_id
                    FROM followers f1
                    WHERE f1.following_id = auth.uid()
                    EXCEPT
                    -- Minus users I already follow
                    SELECT f2.following_id
                    FROM followers f2
                    WHERE f2.follower_id = auth.uid()
                )
                AND p.user_id != auth.uid()
                LIMIT 5
            ) s
        ),
        'trending_posts', (
            SELECT COALESCE(json_agg(tp), '[]')
            FROM (
                SELECT
                    p.id,
                    p.content,
                    p.like_count,
                    p.comment_count,
                    p.author_name,
                    p.author_username,
                    p.author_avatar_url
                FROM get_feed_posts() p
                LEFT JOIN posts post_table ON p.id = post_table.id
                WHERE post_table.created_at > (now() - interval '7 days')
                  AND p.poll IS NULL -- Use the poll object from get_feed_posts()
                ORDER BY p.like_count DESC, p.comment_count DESC
                LIMIT 5
            ) tp
        ),
        'trending_polls', (
             SELECT COALESCE(json_agg(t_poll), '[]')
             FROM (
                SELECT
                    p.id,
                    p.content,
                    (p.poll->>'total_votes')::int as total_votes, -- Cast the jsonb value to integer
                    p.author_name,
                    p.author_username,
                    p.author_avatar_url
                FROM get_feed_posts() p
                LEFT JOIN posts post_table ON p.id = post_table.id
                WHERE post_table.created_at > (now() - interval '7 days')
                  AND p.poll IS NOT NULL -- Use the poll object from get_feed_posts()
                ORDER BY total_votes DESC, p.comment_count DESC
                LIMIT 3
            ) t_poll
        )
    ) INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_search_recommendations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unified_directory"() RETURNS TABLE("id" "text", "type" "text", "name" "text", "username" "text", "avatar_url" "text", "bio" "text", "is_following" boolean, "follower_count" integer, "member_count" bigint, "admission_year" integer, "branch" "text", "dual_degree_branch" "text", "gender" "text", "dorm_building" "text", "relationship_status" "text", "dining_hall" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    -- Select all user profiles
    SELECT
        p.user_id::text AS id,
        'user'::text AS type,
        p.full_name AS name,
        p.username,
        p.avatar_url,
        p.bio,
        EXISTS(SELECT 1 FROM followers WHERE follower_id = auth.uid() AND following_id = p.user_id) AS is_following,
        p.follower_count,
        NULL::bigint AS member_count, -- Null for users
        p.admission_year,
        p.branch,
        p.dual_degree_branch,
        p.gender,
        p.dorm_building,
        p.relationship_status,
        p.dining_hall
    FROM
        profiles p
    WHERE
        p.user_id <> auth.uid()

    UNION ALL

    -- Select all communities, padding user-specific columns with NULL
    SELECT
        c.id::text AS id,
        'community'::text AS type,
        c.name,
        c.id::text AS username, -- Use ID as a unique key for routing
        c.avatar_url,
        c.description AS bio,
        NULL::boolean AS is_following, -- Communities can't be followed in the same way
        NULL::integer AS follower_count,
        (SELECT count(*) FROM community_members cm WHERE cm.community_id = c.id) AS member_count,
        NULL::integer AS admission_year,
        NULL::text AS branch,
        NULL::text AS dual_degree_branch,
        NULL::text AS gender,
        NULL::text AS dorm_building,
        NULL::text AS relationship_status,
        NULL::text AS dining_hall
    FROM
        communities c;
END;
$$;


ALTER FUNCTION "public"."get_unified_directory"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_post_comment_count"("post_id_to_update" "uuid") RETURNS "void"
    LANGUAGE "sql"
    AS $$
  update posts
  set comment_count = comment_count + 1
  where id = post_id_to_update;
$$;


ALTER FUNCTION "public"."increment_post_comment_count"("post_id_to_update" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_vote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.poll_options
    SET vote_count = vote_count + 1
    WHERE id = NEW.option_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_vote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_community_admin"("p_community_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.community_members
    WHERE community_id = p_community_id
      AND user_id = p_user_id
      AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_community_admin"("p_community_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_community_member"("p_community_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.community_members
    WHERE community_id = p_community_id AND user_id = p_user_id
  );
END;
$$;


ALTER FUNCTION "public"."is_community_member"("p_community_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_participant"("convo_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = convo_id AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_participant"("convo_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.conversation_participants
        WHERE conversation_participants.conversation_id = p_conversation_id
          AND conversation_participants.user_id = auth.uid()
    ) THEN
        RETURN;
    END IF;

    INSERT INTO public.conversation_read_timestamps (conversation_id, user_id, last_read_at)
    VALUES (p_conversation_id, auth.uid(), now())
    ON CONFLICT (conversation_id, user_id)
    DO UPDATE SET last_read_at = now();
END;
$$;


ALTER FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_all"("search_term" "text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    -- Prepare the search term for ILIKE matching
    cleaned_search_term TEXT := '%' || search_term || '%';
BEGIN
    RETURN json_build_object(
        'users', (
            SELECT COALESCE(json_agg(u), '[]') FROM (
                SELECT
                    p.username,
                    p.full_name,
                    p.avatar_url
                FROM profiles p
                WHERE p.username ILIKE cleaned_search_term
                   OR p.full_name ILIKE cleaned_search_term
                LIMIT 5
            ) u
        ),
        'posts', (
            SELECT COALESCE(json_agg(pc), '[]') FROM (
                -- Use a subquery to combine and limit posts and comments
                SELECT id, content, author_full_name, author_username FROM (
                    -- Search in Posts (including Poll questions)
                    SELECT
                        p.id,
                        p.content,
                        -- Use COALESCE to handle community posts gracefully if author is null
                        COALESCE(author.full_name, comm.name) AS author_full_name,
                        author.username AS author_username
                    FROM posts p
                    LEFT JOIN profiles author ON p.user_id = author.user_id
                    LEFT JOIN communities comm ON p.community_id = comm.id
                    WHERE p.content ILIKE cleaned_search_term AND p.is_deleted = false
                    
                    UNION ALL
                    
                    -- Search in Comments
                    SELECT
                        c.post_id AS id, -- IMPORTANT: Link to the post, not the comment itself
                        c.content,
                        author.full_name AS author_full_name,
                        author.username AS author_username
                    FROM comments c
                    JOIN profiles author ON c.user_id = author.user_id
                    WHERE c.content ILIKE cleaned_search_term
                ) AS combined_results
                LIMIT 10 -- Limit the combined post/comment results
            ) pc
        )
    );
END;
$$;


ALTER FUNCTION "public"."search_all"("search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_community_member_role"("p_community_id" "uuid", "p_target_user_id" "uuid", "p_new_role" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Use your existing function to check if the caller is an admin
    IF NOT public.is_community_admin(p_community_id, auth.uid()) THEN
        RAISE EXCEPTION 'Permission denied: Only admins can change member roles.';
    END IF;

    -- If the check passes, update the target user's role
    UPDATE public.community_members
    SET role = p_new_role
    WHERE community_id = p_community_id
      AND user_id = p_target_user_id;
END;
$$;


ALTER FUNCTION "public"."set_community_member_role"("p_community_id" "uuid", "p_target_user_id" "uuid", "p_new_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_rsvp"("p_event_id" "uuid", "p_rsvp_status" "public"."event_rsvp_status") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_status public.event_rsvp_status;
BEGIN
    SELECT rsvp_status INTO current_status
    FROM public.event_rsvps
    WHERE event_id = p_event_id AND user_id = auth.uid();

    IF current_status IS NOT NULL AND current_status = p_rsvp_status THEN
        -- If user clicks the same status again, they are removing their RSVP
        DELETE FROM public.event_rsvps WHERE event_id = p_event_id AND user_id = auth.uid();
    ELSE
        -- Otherwise, insert or update their RSVP
        INSERT INTO public.event_rsvps (event_id, user_id, rsvp_status)
        VALUES (p_event_id, auth.uid(), p_rsvp_status)
        ON CONFLICT (event_id, user_id)
        DO UPDATE SET rsvp_status = p_rsvp_status;
    END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_rsvp"("p_event_id" "uuid", "p_rsvp_status" "public"."event_rsvp_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_details"("p_community_id" "uuid", "p_name" "text", "p_description" "text", "p_avatar_url" "text", "p_banner_url" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Check if user is an admin
  if not exists (
    select 1
    from community_members
    where community_id = p_community_id
      and user_id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Permission denied: user is not an admin of this community';
  end if;

  -- Perform update
  update communities
  set
    name = p_name,
    description = p_description,
    avatar_url = p_avatar_url,
    banner_url = p_banner_url,
    updated_at = now()
  where id = p_community_id;
end;
$$;


ALTER FUNCTION "public"."update_community_details"("p_community_id" "uuid", "p_name" "text", "p_description" "text", "p_avatar_url" "text", "p_banner_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_follow_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- When a user FOLLOWS someone (INSERT)
  IF (TG_OP = 'INSERT') THEN
    -- Increment the `following_count` of the person who is doing the following
    UPDATE public.profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    -- Increment the `follower_count` of the person who is being followed
    UPDATE public.profiles SET follower_count = follower_count + 1 WHERE user_id = NEW.following_id;

  -- When a user UNFOLLOWS someone (DELETE)
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement the `following_count` of the person who is unfollowing
    UPDATE public.profiles SET following_count = following_count - 1 WHERE user_id = OLD.follower_id;
    -- Decrement the `follower_count` of the person who was being followed
    UPDATE public.profiles SET follower_count = follower_count - 1 WHERE user_id = OLD.following_id;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_follow_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_comment_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_post_comment_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_like_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- When a like/dislike is ADDED
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.like_type = 'like') THEN
      UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF (NEW.like_type = 'dislike') THEN
      UPDATE public.posts SET dislike_count = dislike_count + 1 WHERE id = NEW.post_id;
    END IF;

  -- When a like/dislike is REMOVED
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.like_type = 'like') THEN
      UPDATE public.posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    ELSIF (OLD.like_type = 'dislike') THEN
      UPDATE public.posts SET dislike_count = dislike_count - 1 WHERE id = OLD.post_id;
    END IF;

  -- When a vote is CHANGED (e.g., from like to dislike)
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Decrement the old value
    IF (OLD.like_type = 'like') THEN
      UPDATE public.posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    ELSIF (OLD.like_type = 'dislike') THEN
      UPDATE public.posts SET dislike_count = dislike_count - 1 WHERE id = OLD.post_id;
    END IF;
    -- Increment the new value
    IF (NEW.like_type = 'like') THEN
      UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF (NEW.like_type = 'dislike') THEN
      UPDATE public.posts SET dislike_count = dislike_count + 1 WHERE id = NEW.post_id;
    END IF;
  END IF;
  
  RETURN NULL; -- The result is ignored since this is an AFTER trigger
END;
$$;


ALTER FUNCTION "public"."update_post_like_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_seller_rating_on_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE profiles
    SET
        avg_seller_rating = (
            SELECT AVG(rating) FROM seller_ratings WHERE seller_id = NEW.seller_id
        ),
        total_seller_ratings = (
            SELECT COUNT(*) FROM seller_ratings WHERE seller_id = NEW.seller_id
        )
    WHERE user_id = NEW.seller_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_seller_rating_on_profile"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookmarks" (
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campus_place_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "place_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."campus_place_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campus_places" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "campus" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "location" "text"
);


ALTER TABLE "public"."campus_places" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


ALTER TABLE "public"."comments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."communities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "campus" "text" NOT NULL,
    "avatar_url" "text",
    "banner_url" "text",
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."communities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_members" (
    "community_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL
);


ALTER TABLE "public"."community_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_read_timestamps" (
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "last_read_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."conversation_read_timestamps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "type" "text" DEFAULT 'dm'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "community_id" "uuid"
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_keys" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "public_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."device_keys" OWNER TO "postgres";


ALTER TABLE "public"."device_keys" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."device_keys_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."event_rsvps" (
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rsvp_status" "public"."event_rsvp_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_rsvps" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_rsvps" IS 'Tracks which users are going to or interested in an event.';



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone,
    "location" "text",
    "campus" "text" NOT NULL,
    "image_url" "text",
    "created_by" "uuid" NOT NULL,
    "community_id" "uuid"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON TABLE "public"."events" IS 'Stores all campus event details.';



CREATE TABLE IF NOT EXISTS "public"."followers" (
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cant_follow_self" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."followers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "like_type" "text" DEFAULT 'like'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


ALTER TABLE "public"."likes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."likes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lost_and_found_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location_found" "text",
    "image_url" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "campus" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "item_type" "text" NOT NULL
);


ALTER TABLE "public"."lost_and_found_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."marketplace_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentions" (
    "id" bigint NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mentioner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mentions" OWNER TO "postgres";


COMMENT ON TABLE "public"."mentions" IS 'Tracks user mentions within posts.';



COMMENT ON COLUMN "public"."mentions"."post_id" IS 'The post where the mention occurred.';



COMMENT ON COLUMN "public"."mentions"."user_id" IS 'The user who was mentioned.';



COMMENT ON COLUMN "public"."mentions"."mentioner_id" IS 'The user who made the mention (the post author).';



ALTER TABLE "public"."mentions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."mentions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."message_reactions" (
    "message_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" bigint NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text",
    "message_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "attachment_url" "text",
    "reply_to_message_id" bigint,
    "conversation_id" "uuid",
    "is_edited" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


ALTER TABLE "public"."messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pinned_messages" (
    "id" bigint NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "message_id" bigint NOT NULL,
    "pinned_by_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."pinned_messages" OWNER TO "postgres";


ALTER TABLE "public"."pinned_messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pinned_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."poll_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "poll_id" "uuid" NOT NULL,
    "option_text" "text" NOT NULL,
    "vote_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."poll_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."poll_votes" (
    "user_id" "uuid" NOT NULL,
    "option_id" "uuid" NOT NULL,
    "poll_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."poll_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."polls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "allow_multiple_answers" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."polls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "comment_count" bigint DEFAULT 0 NOT NULL,
    "like_count" bigint DEFAULT 0 NOT NULL,
    "dislike_count" bigint DEFAULT 0 NOT NULL,
    "community_id" "uuid",
    "is_public" boolean DEFAULT false NOT NULL,
    "is_edited" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    CONSTRAINT "community_id_required_for_public_posts" CHECK ((("is_public" = false) OR (("is_public" = true) AND ("community_id" IS NOT NULL))))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "username" "text",
    "avatar_url" "text",
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
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
    "profile_complete" boolean DEFAULT false,
    "updated_at" timestamp with time zone,
    "id" bigint NOT NULL,
    "following_count" integer DEFAULT 0 NOT NULL,
    "follower_count" integer DEFAULT 0 NOT NULL,
    "dual_degree_branch" "text",
    "birthday" "date",
    "gender" "text",
    "avg_seller_rating" numeric(2,1) DEFAULT 0.0,
    "total_seller_ratings" integer DEFAULT 0,
    CONSTRAINT "username_format_check" CHECK (("username" ~ '^[a-zA-Z0-9_.]+$'::"text"))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE "public"."profiles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."profiles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "place_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seller_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rater_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "listing_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seller_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."seller_ratings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("user_id", "post_id");



ALTER TABLE ONLY "public"."campus_place_images"
    ADD CONSTRAINT "campus_place_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campus_places"
    ADD CONSTRAINT "campus_places_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_pkey" PRIMARY KEY ("community_id", "user_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversation_read_timestamps"
    ADD CONSTRAINT "conversation_read_timestamps_pkey" PRIMARY KEY ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_community_id_key" UNIQUE ("community_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_keys"
    ADD CONSTRAINT "device_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_keys"
    ADD CONSTRAINT "device_keys_user_id_device_id_key" UNIQUE ("user_id", "device_id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("event_id", "user_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_pkey" PRIMARY KEY ("follower_id", "following_id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lost_and_found_items"
    ADD CONSTRAINT "lost_and_found_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_images"
    ADD CONSTRAINT "marketplace_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("message_id", "user_id");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_unique_user_message" UNIQUE ("message_id", "user_id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pinned_messages"
    ADD CONSTRAINT "pinned_messages_conversation_id_key" UNIQUE ("conversation_id");



ALTER TABLE ONLY "public"."pinned_messages"
    ADD CONSTRAINT "pinned_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."poll_options"
    ADD CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("user_id", "option_id");



ALTER TABLE ONLY "public"."polls"
    ADD CONSTRAINT "polls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."polls"
    ADD CONSTRAINT "polls_post_id_key" UNIQUE ("post_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."seller_ratings"
    ADD CONSTRAINT "rater_seller_unique" UNIQUE ("rater_id", "seller_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_place_id_user_id_key" UNIQUE ("place_id", "user_id");



ALTER TABLE ONLY "public"."seller_ratings"
    ADD CONSTRAINT "seller_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "unique_user_post_like" UNIQUE ("user_id", "post_id");



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "messages_reply_to_message_id_idx" ON "public"."messages" USING "btree" ("reply_to_message_id");



CREATE OR REPLACE TRIGGER "on_comment_change" AFTER INSERT OR DELETE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_comment_count"();



CREATE OR REPLACE TRIGGER "on_follow_change" AFTER INSERT OR DELETE ON "public"."followers" FOR EACH ROW EXECUTE FUNCTION "public"."update_follow_counts"();



CREATE OR REPLACE TRIGGER "on_like_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_like_counts"();



CREATE OR REPLACE TRIGGER "on_seller_rating_change" AFTER INSERT OR UPDATE ON "public"."seller_ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_seller_rating_on_profile"();



CREATE OR REPLACE TRIGGER "on_vote_delete" AFTER DELETE ON "public"."poll_votes" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_vote_count"();



CREATE OR REPLACE TRIGGER "on_vote_insert" AFTER INSERT ON "public"."poll_votes" FOR EACH ROW EXECUTE FUNCTION "public"."increment_vote_count"();



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campus_place_images"
    ADD CONSTRAINT "campus_place_images_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."campus_places"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_read_timestamps"
    ADD CONSTRAINT "conversation_read_timestamps_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_read_timestamps"
    ADD CONSTRAINT "conversation_read_timestamps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."device_keys"
    ADD CONSTRAINT "device_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lost_and_found_items"
    ADD CONSTRAINT "lost_and_found_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_images"
    ADD CONSTRAINT "marketplace_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_mentioner_id_fkey" FOREIGN KEY ("mentioner_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pinned_messages"
    ADD CONSTRAINT "pinned_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pinned_messages"
    ADD CONSTRAINT "pinned_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pinned_messages"
    ADD CONSTRAINT "pinned_messages_pinned_by_user_id_fkey" FOREIGN KEY ("pinned_by_user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poll_options"
    ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."poll_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."polls"
    ADD CONSTRAINT "polls_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."polls"
    ADD CONSTRAINT "polls_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."campus_places"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_ratings"
    ADD CONSTRAINT "seller_ratings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."seller_ratings"
    ADD CONSTRAINT "seller_ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_ratings"
    ADD CONSTRAINT "seller_ratings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can update their communities" ON "public"."communities" FOR UPDATE USING ((( SELECT 1
   FROM "public"."community_members"
  WHERE (("community_members"."community_id" = "communities"."id") AND ("community_members"."user_id" = "auth"."uid"()) AND ("community_members"."role" = 'admin'::"text"))) IS NOT NULL)) WITH CHECK ((( SELECT 1
   FROM "public"."community_members"
  WHERE (("community_members"."community_id" = "communities"."id") AND ("community_members"."user_id" = "auth"."uid"()) AND ("community_members"."role" = 'admin'::"text"))) IS NOT NULL));



CREATE POLICY "Allow access to conversation participants" ON "public"."messages" USING ("public"."is_participant"("conversation_id"));



CREATE POLICY "Allow access to fellow participants" ON "public"."conversation_participants" USING (true) WITH CHECK (true);



CREATE POLICY "Allow access to own conversations" ON "public"."conversations" FOR SELECT USING (("id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow access to participants" ON "public"."conversations" USING ("public"."is_participant"("id"));



CREATE POLICY "Allow admins to add new members" ON "public"."community_members" FOR INSERT WITH CHECK ("public"."is_community_admin"("community_id", "auth"."uid"()));



CREATE POLICY "Allow admins to remove members" ON "public"."community_members" FOR DELETE USING ((("public"."is_community_admin"("community_id", "auth"."uid"()) AND (( SELECT "count"(*) AS "count"
   FROM "public"."community_members" "community_members_1"
  WHERE (("community_members_1"."community_id" = "community_members_1"."community_id") AND ("community_members_1"."role" = 'admin'::"text"))) > 1)) OR (( SELECT "community_members_1"."role"
   FROM "public"."community_members" "community_members_1"
  WHERE (("community_members_1"."user_id" = "community_members_1"."user_id") AND ("community_members_1"."community_id" = "community_members_1"."community_id"))) <> 'admin'::"text")));



CREATE POLICY "Allow admins to update member roles" ON "public"."community_members" FOR UPDATE TO "authenticated" USING ("public"."is_community_admin"("community_id", "auth"."uid"())) WITH CHECK ("public"."is_community_admin"("community_id", "auth"."uid"()));



CREATE POLICY "Allow all access to authenticated users" ON "public"."profiles" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all read access" ON "public"."lost_and_found_items" FOR SELECT USING (true);



CREATE POLICY "Allow all read access on places" ON "public"."campus_places" FOR SELECT USING (true);



CREATE POLICY "Allow all read access on reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Allow anyone to view community members" ON "public"."community_members" FOR SELECT USING (true);



CREATE POLICY "Allow anyone to view mentions" ON "public"."mentions" FOR SELECT USING (true);



CREATE POLICY "Allow authenticated read access to communities" ON "public"."communities" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to insert" ON "public"."lost_and_found_items" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to insert reviews" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to join a conversation" ON "public"."conversation_participants" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to leave a conversation" ON "public"."conversation_participants" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to read RSVPs" ON "public"."event_rsvps" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read any public key" ON "public"."device_keys" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to read events" ON "public"."events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view images" ON "public"."marketplace_images" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view listings" ON "public"."marketplace_listings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view ratings" ON "public"."seller_ratings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow community owners to update their own communities" ON "public"."communities" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Allow conditional read access to posts" ON "public"."posts" FOR SELECT USING ((("community_id" IS NULL) OR "public"."is_community_member"("community_id", "auth"."uid"())));



CREATE POLICY "Allow creator to add participants" ON "public"."conversation_participants" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow dev to manage images table" ON "public"."campus_place_images" USING (("auth"."uid"() = '70941ce5-121b-47e3-b6c7-fef1aa069316'::"uuid")) WITH CHECK (("auth"."uid"() = '70941ce5-121b-47e3-b6c7-fef1aa069316'::"uuid"));



CREATE POLICY "Allow event creator to delete event" ON "public"."events" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Allow event creator to update event" ON "public"."events" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Allow insert for authenticated users" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow insert on messages for participants" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND ("conversation_id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow members to access community chats" ON "public"."conversations" USING ((("type" <> 'group'::"text") OR ("community_id" IS NULL) OR (("community_id" IS NOT NULL) AND "public"."is_community_member"("community_id", "auth"."uid"()))));



CREATE POLICY "Allow members to create posts" ON "public"."posts" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND (("community_id" IS NULL) OR "public"."is_community_member"("community_id", "auth"."uid"()))));



CREATE POLICY "Allow members to join communities" ON "public"."community_members" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow members to leave communities" ON "public"."community_members" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow members to see each other" ON "public"."community_members" FOR SELECT USING ("public"."is_community_member"("community_id", "auth"."uid"()));



CREATE POLICY "Allow members to see each other" ON "public"."conversation_participants" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow members to see each other in their chats" ON "public"."conversation_participants" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow participants to view other participants in their chats" ON "public"."conversation_participants" FOR SELECT USING (true);



CREATE POLICY "Allow participants to view their conversations" ON "public"."conversations" FOR SELECT USING (("id" IN ( SELECT "public"."get_my_conversation_ids"() AS "get_my_conversation_ids")));



CREATE POLICY "Allow public read on images table" ON "public"."campus_place_images" FOR SELECT USING (true);



CREATE POLICY "Allow select for all" ON "public"."communities" FOR SELECT USING (true);



CREATE POLICY "Allow select on messages for participants" ON "public"."messages" FOR SELECT USING (("conversation_id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow users to create events" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Allow users to create mentions" ON "public"."mentions" FOR INSERT WITH CHECK (("auth"."uid"() = "mentioner_id"));



CREATE POLICY "Allow users to create their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to delete images from their own listings" ON "public"."marketplace_images" FOR DELETE TO "authenticated" USING ((( SELECT "marketplace_listings"."seller_id"
   FROM "public"."marketplace_listings"
  WHERE ("marketplace_listings"."id" = "marketplace_images"."listing_id")) = "auth"."uid"()));



CREATE POLICY "Allow users to delete their own items" ON "public"."lost_and_found_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to delete their own listings" ON "public"."marketplace_listings" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Allow users to delete their own posts" ON "public"."posts" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to delete their own reactions" ON "public"."message_reactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to delete their own reviews" ON "public"."reviews" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to insert images for their own listings" ON "public"."marketplace_images" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "marketplace_listings"."seller_id"
   FROM "public"."marketplace_listings"
  WHERE ("marketplace_listings"."id" = "marketplace_images"."listing_id")) = "auth"."uid"()));



CREATE POLICY "Allow users to insert ratings for others" ON "public"."seller_ratings" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "rater_id") AND ("auth"."uid"() <> "seller_id")));



CREATE POLICY "Allow users to insert their own listings" ON "public"."marketplace_listings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "seller_id"));



CREATE POLICY "Allow users to insert their own reactions" ON "public"."message_reactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to join conversations" ON "public"."conversation_participants" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to leave conversations" ON "public"."conversation_participants" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to manage their own RSVPs" ON "public"."event_rsvps" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to manage their own device keys" ON "public"."device_keys" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to read their own participation record" ON "public"."conversation_participants" FOR SELECT USING (true);



CREATE POLICY "Allow users to see their own participation records" ON "public"."conversation_participants" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to send messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Allow users to update their own items" ON "public"."lost_and_found_items" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to update their own listings" ON "public"."marketplace_listings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Allow users to update their own posts" ON "public"."posts" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to update their own ratings" ON "public"."seller_ratings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "rater_id"));



CREATE POLICY "Allow users to update their own reactions" ON "public"."message_reactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to update their own reviews" ON "public"."reviews" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to view their own conversations" ON "public"."conversations" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Enable public read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Marketplace images are publicly viewable" ON "public"."marketplace_images" FOR SELECT USING (true);



CREATE POLICY "Participants can add/remove their own reactions" ON "public"."message_reactions" USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."conversation_participants" "cp" ON (("m"."conversation_id" = "cp"."conversation_id")))
  WHERE (("m"."id" = "message_reactions"."message_id") AND ("cp"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Participants can insert messages in their conversations" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "messages"."conversation_id") AND ("cp"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Participants can pin/unpin messages" ON "public"."pinned_messages" USING ("public"."is_participant"("conversation_id"));



CREATE POLICY "Participants can read messages in their conversations" ON "public"."messages" FOR SELECT USING (("conversation_id" IN ( SELECT "cp"."conversation_id"
   FROM "public"."conversation_participants" "cp"
  WHERE ("cp"."user_id" = "auth"."uid"()))));



CREATE POLICY "Participants can send messages in their conversations" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND ("conversation_id" IN ( SELECT "cp"."conversation_id"
   FROM "public"."conversation_participants" "cp"
  WHERE ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Participants can view pinned messages" ON "public"."pinned_messages" FOR SELECT USING ("public"."is_participant"("conversation_id"));



CREATE POLICY "Participants can view reactions in their conversations" ON "public"."message_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."conversation_participants" "cp" ON (("m"."conversation_id" = "cp"."conversation_id")))
  WHERE (("m"."id" = "message_reactions"."message_id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Posts: anyone can read" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Posts: delete own posts" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Posts: insert own posts" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Posts: update own posts" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Profiles: public read" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Profiles: update by owner" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Public can view all marketplace listings" ON "public"."marketplace_listings" FOR SELECT USING (true);



CREATE POLICY "Users can create mentions" ON "public"."mentions" FOR INSERT WITH CHECK (("auth"."uid"() = "mentioner_id"));



CREATE POLICY "Users can create their own conversations" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create their own listings" ON "public"."marketplace_listings" FOR INSERT WITH CHECK (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users can delete images for their own listings" ON "public"."marketplace_images" FOR DELETE USING ((( SELECT "marketplace_listings"."seller_id"
   FROM "public"."marketplace_listings"
  WHERE ("marketplace_listings"."id" = "marketplace_images"."listing_id")) = "auth"."uid"()));



CREATE POLICY "Users can delete images from their own listings" ON "public"."marketplace_images" FOR DELETE USING ((( SELECT "marketplace_listings"."seller_id"
   FROM "public"."marketplace_listings"
  WHERE ("marketplace_listings"."id" = "marketplace_images"."listing_id")) = "auth"."uid"()));



CREATE POLICY "Users can delete their own listings" ON "public"."marketplace_listings" FOR DELETE USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users can insert images for their own listings" ON "public"."marketplace_images" FOR INSERT WITH CHECK ((( SELECT "marketplace_listings"."seller_id"
   FROM "public"."marketplace_listings"
  WHERE ("marketplace_listings"."id" = "marketplace_images"."listing_id")) = "auth"."uid"()));



CREATE POLICY "Users can insert their own messages" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own read timestamps" ON "public"."conversation_read_timestamps" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read timestamps for their conversations" ON "public"."conversation_read_timestamps" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "conversation_read_timestamps"."conversation_id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update messages in their conversations" ON "public"."messages" FOR UPDATE USING (("conversation_id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own listings" ON "public"."marketplace_listings" FOR UPDATE USING (("auth"."uid"() = "seller_id")) WITH CHECK (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users can update their own posts" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view messages in conversations they are part of" ON "public"."messages" FOR SELECT USING (("conversation_id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own mentions" ON "public"."mentions" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "mentioner_id")));



ALTER TABLE "public"."campus_place_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campus_places" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_read_timestamps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_rsvps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lost_and_found_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pinned_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seller_ratings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_read_timestamps";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."pinned_messages";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."cast_poll_vote"("p_option_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cast_poll_vote"("p_option_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cast_poll_vote"("p_option_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_bot_post"("post_content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_bot_post"("post_content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_bot_post"("post_content" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_community"("p_name" "text", "p_description" "text", "p_campus" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_community"("p_name" "text", "p_description" "text", "p_campus" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_community"("p_name" "text", "p_description" "text", "p_campus" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_dm_conversation"("recipient_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_dm_conversation"("recipient_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_dm_conversation"("recipient_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event"("p_name" "text", "p_description" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_location" "text", "p_campus" "text", "p_image_url" "text", "p_community_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_event"("p_name" "text", "p_description" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_location" "text", "p_campus" "text", "p_image_url" "text", "p_community_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event"("p_name" "text", "p_description" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_location" "text", "p_campus" "text", "p_image_url" "text", "p_community_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_group_chat"("group_name" "text", "participant_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_group_chat"("group_name" "text", "participant_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_group_chat"("group_name" "text", "participant_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_post_with_mentions"("post_content" "text", "post_image_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_post_with_mentions"("post_content" "text", "post_image_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_post_with_mentions"("post_content" "text", "post_image_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_post_with_mentions"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_post_with_mentions"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_post_with_mentions"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_post_with_poll"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean, "p_poll_options" "text"[], "p_allow_multiple_answers" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_post_with_poll"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean, "p_poll_options" "text"[], "p_allow_multiple_answers" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_post_with_poll"("p_content" "text", "p_image_url" "text", "p_community_id" "uuid", "p_is_public" boolean, "p_poll_options" "text"[], "p_allow_multiple_answers" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_vote_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_vote_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_vote_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_listing"("p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_listing"("p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_listing"("p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_birthday_users"("p_month" integer, "p_day" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_birthday_users"("p_month" integer, "p_day" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_birthday_users"("p_month" integer, "p_day" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bookmarked_posts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_bookmarked_posts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bookmarked_posts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_campus_events"("p_campus" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_campus_events"("p_campus" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_campus_events"("p_campus" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_campus_places_with_ratings"("p_campus" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_campus_places_with_ratings"("p_campus" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_campus_places_with_ratings"("p_campus" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_communities_for_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_communities_for_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_communities_for_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_communities_list"("p_campus" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_communities_list"("p_campus" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_communities_list"("p_campus" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_community_details"("p_community_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_community_details"("p_community_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_community_details"("p_community_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversations_for_user_v2"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversations_for_user_v2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversations_for_user_v2"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_feed_posts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_feed_posts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_feed_posts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_follow_list"("profile_user_id" "uuid", "list_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_follow_list"("profile_user_id" "uuid", "list_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_follow_list"("profile_user_id" "uuid", "list_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_images_for_place"("p_place_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_images_for_place"("p_place_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_images_for_place"("p_place_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_listings" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_listings" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_listings_by_seller"("p_seller_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_listings_by_seller"("p_seller_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_listings_by_seller"("p_seller_username" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_marketplace_listings"("p_campus" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_marketplace_listings"("p_campus" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_marketplace_listings"("p_campus" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mentions_for_user"("profile_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mentions_for_user"("profile_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mentions_for_user"("profile_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_messages_for_conversation"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_messages_for_conversation"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_messages_for_conversation"("p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mutual_followers"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mutual_followers"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mutual_followers"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_conversation_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_conversation_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_conversation_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_non_community_members"("p_community_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_non_community_members"("p_community_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_non_community_members"("p_community_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pinned_message_for_conversation"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pinned_message_for_conversation"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pinned_message_for_conversation"("p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_posts_for_community"("p_community_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_posts_for_community"("p_community_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_posts_for_community"("p_community_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_posts_for_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_posts_for_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_posts_for_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_posts_with_likes"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_posts_with_likes"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_posts_with_likes"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_details"("profile_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_details"("profile_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_details"("profile_username" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_search_recommendations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_search_recommendations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_search_recommendations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unified_directory"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_directory"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_directory"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_post_comment_count"("post_id_to_update" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_post_comment_count"("post_id_to_update" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_post_comment_count"("post_id_to_update" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_vote_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_vote_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_vote_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_community_admin"("p_community_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_community_admin"("p_community_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_community_admin"("p_community_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_community_member"("p_community_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_community_member"("p_community_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_community_member"("p_community_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_participant"("convo_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_participant"("convo_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_participant"("convo_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_all"("search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_all"("search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_all"("search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_community_member_role"("p_community_id" "uuid", "p_target_user_id" "uuid", "p_new_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_community_member_role"("p_community_id" "uuid", "p_target_user_id" "uuid", "p_new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_community_member_role"("p_community_id" "uuid", "p_target_user_id" "uuid", "p_new_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_rsvp"("p_event_id" "uuid", "p_rsvp_status" "public"."event_rsvp_status") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_rsvp"("p_event_id" "uuid", "p_rsvp_status" "public"."event_rsvp_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_rsvp"("p_event_id" "uuid", "p_rsvp_status" "public"."event_rsvp_status") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_community_details"("p_community_id" "uuid", "p_name" "text", "p_description" "text", "p_avatar_url" "text", "p_banner_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_community_details"("p_community_id" "uuid", "p_name" "text", "p_description" "text", "p_avatar_url" "text", "p_banner_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_community_details"("p_community_id" "uuid", "p_name" "text", "p_description" "text", "p_avatar_url" "text", "p_banner_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_comment_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_comment_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_comment_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_like_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_like_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_like_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_seller_rating_on_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_seller_rating_on_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_seller_rating_on_profile"() TO "service_role";
























GRANT ALL ON TABLE "public"."bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."campus_place_images" TO "anon";
GRANT ALL ON TABLE "public"."campus_place_images" TO "authenticated";
GRANT ALL ON TABLE "public"."campus_place_images" TO "service_role";



GRANT ALL ON TABLE "public"."campus_places" TO "anon";
GRANT ALL ON TABLE "public"."campus_places" TO "authenticated";
GRANT ALL ON TABLE "public"."campus_places" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."communities" TO "anon";
GRANT ALL ON TABLE "public"."communities" TO "authenticated";
GRANT ALL ON TABLE "public"."communities" TO "service_role";



GRANT ALL ON TABLE "public"."community_members" TO "anon";
GRANT ALL ON TABLE "public"."community_members" TO "authenticated";
GRANT ALL ON TABLE "public"."community_members" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_read_timestamps" TO "anon";
GRANT ALL ON TABLE "public"."conversation_read_timestamps" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_read_timestamps" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."device_keys" TO "anon";
GRANT ALL ON TABLE "public"."device_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."device_keys" TO "service_role";



GRANT ALL ON SEQUENCE "public"."device_keys_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."device_keys_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."device_keys_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_rsvps" TO "anon";
GRANT ALL ON TABLE "public"."event_rsvps" TO "authenticated";
GRANT ALL ON TABLE "public"."event_rsvps" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."followers" TO "anon";
GRANT ALL ON TABLE "public"."followers" TO "authenticated";
GRANT ALL ON TABLE "public"."followers" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."likes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."likes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."likes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lost_and_found_items" TO "anon";
GRANT ALL ON TABLE "public"."lost_and_found_items" TO "authenticated";
GRANT ALL ON TABLE "public"."lost_and_found_items" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_images" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_images" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_images" TO "service_role";



GRANT ALL ON TABLE "public"."mentions" TO "anon";
GRANT ALL ON TABLE "public"."mentions" TO "authenticated";
GRANT ALL ON TABLE "public"."mentions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mentions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mentions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mentions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."message_reactions" TO "anon";
GRANT ALL ON TABLE "public"."message_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."message_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pinned_messages" TO "anon";
GRANT ALL ON TABLE "public"."pinned_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."pinned_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pinned_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pinned_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pinned_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."poll_options" TO "anon";
GRANT ALL ON TABLE "public"."poll_options" TO "authenticated";
GRANT ALL ON TABLE "public"."poll_options" TO "service_role";



GRANT ALL ON TABLE "public"."poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."poll_votes" TO "service_role";



GRANT ALL ON TABLE "public"."polls" TO "anon";
GRANT ALL ON TABLE "public"."polls" TO "authenticated";
GRANT ALL ON TABLE "public"."polls" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."seller_ratings" TO "anon";
GRANT ALL ON TABLE "public"."seller_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_ratings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;

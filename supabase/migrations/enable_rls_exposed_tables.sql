-- Enable Row-Level Security on 8 tables that were fully exposed to the anon key.
--
-- Before this, anyone with the public anon key could read/modify every row in
-- these tables (forge follows, delete comments, read every user's GPS location).
--
-- Access model:
--   * Social signals (likes, comments, followers, polls, poll_options, poll_votes)
--     stay publicly READable; writes are restricted to the owner.
--   * Writes for comments/polls/poll_options/poll_votes normally flow through
--     SECURITY DEFINER RPCs (cast_poll_vote, create_post_with_poll, handle_new_comment),
--     which bypass RLS. Owner write policies are added where the client writes directly.
--   * bookmarks and user_locations are private to the owner. The campus map still
--     works because it reads/writes via SECURITY DEFINER RPCs (get_friend_locations,
--     update_user_location).
--
-- Idempotent and transactional so it can be re-run safely.

begin;

-- LIKES ---------------------------------------------------------------------
alter table public.likes enable row level security;
drop policy if exists likes_select on public.likes;
drop policy if exists likes_insert on public.likes;
drop policy if exists likes_update on public.likes;
drop policy if exists likes_delete on public.likes;
create policy likes_select on public.likes for select using (true);
create policy likes_insert on public.likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy likes_update on public.likes for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy likes_delete on public.likes for delete to authenticated using (user_id = (select auth.uid()));

-- COMMENTS ------------------------------------------------------------------
alter table public.comments enable row level security;
drop policy if exists comments_select on public.comments;
drop policy if exists comments_insert on public.comments;
drop policy if exists comments_update on public.comments;
drop policy if exists comments_delete on public.comments;
create policy comments_select on public.comments for select using (true);
create policy comments_insert on public.comments for insert to authenticated with check (user_id = (select auth.uid()));
create policy comments_update on public.comments for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy comments_delete on public.comments for delete to authenticated using (user_id = (select auth.uid()));

-- FOLLOWERS -----------------------------------------------------------------
alter table public.followers enable row level security;
drop policy if exists followers_select on public.followers;
drop policy if exists followers_insert on public.followers;
drop policy if exists followers_delete on public.followers;
create policy followers_select on public.followers for select using (true);
create policy followers_insert on public.followers for insert to authenticated with check (follower_id = (select auth.uid()));
create policy followers_delete on public.followers for delete to authenticated using (follower_id = (select auth.uid()));

-- BOOKMARKS (private) -------------------------------------------------------
alter table public.bookmarks enable row level security;
drop policy if exists bookmarks_select on public.bookmarks;
drop policy if exists bookmarks_insert on public.bookmarks;
drop policy if exists bookmarks_delete on public.bookmarks;
create policy bookmarks_select on public.bookmarks for select to authenticated using (user_id = (select auth.uid()));
create policy bookmarks_insert on public.bookmarks for insert to authenticated with check (user_id = (select auth.uid()));
create policy bookmarks_delete on public.bookmarks for delete to authenticated using (user_id = (select auth.uid()));

-- POLLS / POLL_OPTIONS / POLL_VOTES (writes via SECURITY DEFINER RPCs) -------
alter table public.polls enable row level security;
drop policy if exists polls_select on public.polls;
create policy polls_select on public.polls for select using (true);

alter table public.poll_options enable row level security;
drop policy if exists poll_options_select on public.poll_options;
create policy poll_options_select on public.poll_options for select using (true);

alter table public.poll_votes enable row level security;
drop policy if exists poll_votes_select on public.poll_votes;
create policy poll_votes_select on public.poll_votes for select using (true);

-- USER_LOCATIONS (private; map uses SECURITY DEFINER RPCs) -------------------
alter table public.user_locations enable row level security;
drop policy if exists user_locations_select on public.user_locations;
drop policy if exists user_locations_insert on public.user_locations;
drop policy if exists user_locations_update on public.user_locations;
drop policy if exists user_locations_delete on public.user_locations;
create policy user_locations_select on public.user_locations for select to authenticated using (user_id = (select auth.uid()));
create policy user_locations_insert on public.user_locations for insert to authenticated with check (user_id = (select auth.uid()));
create policy user_locations_update on public.user_locations for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy user_locations_delete on public.user_locations for delete to authenticated using (user_id = (select auth.uid()));

commit;

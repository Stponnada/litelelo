-- Expressive profile fields (interests, music, movies, looking-for, ask-me-about)
-- that make profiles worth filling and worth browsing, plus the friends-only
-- switch: make send_friend_request idempotent so dropping the one-way "follow"
-- path can't error on legacy edges or a double-tap.

alter table public.profiles
  add column if not exists interests text[],
  add column if not exists favorite_music text,
  add column if not exists favorite_movies text,
  add column if not exists looking_for text[],
  add column if not exists ask_me_about text;

create index if not exists profiles_interests_idx on public.profiles using gin (interests);

create or replace function public.send_friend_request(recipient_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.followers (follower_id, following_id, status)
  values (auth.uid(), recipient_id, 'pending')
  on conflict (follower_id, following_id) do nothing;
end;
$function$;

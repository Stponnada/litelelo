-- "Wave" — a one-tap, low-stakes hello (the modern poke). It's the social
-- arena that makes profile-polishing primal: you want to look good before you
-- wave, and a wave back is the reward. A trigger fires a notification to the
-- recipient, mirroring how follows notify.

alter type public.notification_type add value if not exists 'wave';

create table if not exists public.waves (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid not null references auth.users(id) on delete cascade,
    recipient_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint waves_sender_recipient_key unique (sender_id, recipient_id),
    constraint waves_no_self check (sender_id <> recipient_id)
);

create index if not exists waves_recipient_idx on public.waves (recipient_id);

alter table public.waves enable row level security;
drop policy if exists waves_select on public.waves;
drop policy if exists waves_insert on public.waves;
drop policy if exists waves_delete on public.waves;
create policy waves_select on public.waves for select to authenticated
    using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
create policy waves_insert on public.waves for insert to authenticated
    with check (sender_id = (select auth.uid()));
create policy waves_delete on public.waves for delete to authenticated
    using (sender_id = (select auth.uid()));

-- Notify the recipient on a new wave (no notification on a duplicate / re-wave).
create or replace function public.handle_new_wave()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.notifications (user_id, actor_id, type, entity_id, entity_type)
    values (new.recipient_id, new.sender_id, 'wave', new.sender_id, 'user');
    return new;
end;
$$;

drop trigger if exists on_wave_created on public.waves;
create trigger on_wave_created after insert on public.waves
    for each row execute function public.handle_new_wave();

-- The directory loads every profile once for client-side search/filter. Supabase's
-- project-wide API max-rows cap (1000) was silently truncating get_unified_directory,
-- so once complete profiles crossed 1000, new users became invisible and the user
-- count froze at 1000. The client now pages through the result with .range(); offset
-- pagination is only correct with a stable sort, so order the output deterministically.

create or replace function public.get_unified_directory()
returns table("id" text, "type" text, "name" text, "username" text, "avatar_url" text, "bio" text, "is_following" boolean, "follower_count" integer, "member_count" bigint, "admission_year" integer, "branch" text, "dual_degree_branch" text, "gender" text, "dorm_building" text, "relationship_status" text, "dining_hall" text)
language plpgsql
security definer
as $$
begin
    return query
    select * from (
        -- All complete user profiles
        select
            p.user_id::text as id,
            'user'::text as type,
            p.full_name as name,
            p.username,
            p.avatar_url,
            p.bio,
            exists(select 1 from followers where follower_id = auth.uid() and following_id = p.user_id) as is_following,
            p.follower_count,
            null::bigint as member_count,
            p.admission_year,
            p.branch,
            p.dual_degree_branch,
            p.gender,
            p.dorm_building,
            p.relationship_status,
            p.dining_hall
        from profiles p
        where p.user_id <> auth.uid()
          and p.profile_complete = true

        union all

        -- All communities, padding user-specific columns with null
        select
            c.id::text as id,
            'community'::text as type,
            c.name,
            c.id::text as username,
            c.avatar_url,
            c.description as bio,
            null::boolean as is_following,
            null::integer as follower_count,
            (select count(*) from community_members cm where cm.community_id = c.id) as member_count,
            null::integer as admission_year,
            null::text as branch,
            null::text as dual_degree_branch,
            null::text as gender,
            null::text as dorm_building,
            null::text as relationship_status,
            null::text as dining_hall
        from communities c
    ) sub
    -- Stable ordering so client-side offset pagination can't drop or duplicate rows.
    order by sub.type, sub.id;
end;
$$;

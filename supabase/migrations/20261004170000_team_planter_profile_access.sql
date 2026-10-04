begin;

drop policy if exists profiles_team_planter_read
on public.profiles;

create or replace function public.get_team_planter_profile(
  target_planter_id uuid
)
returns table (
  id uuid,
  display_name text,
  role text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.display_name,
    p.role::text
  from public.profiles p
  where p.id = target_planter_id
    and p.role = 'planter'
    and p.org_id = public.current_org()
    and exists (
      select 1
      from public.church_memberships m
      join public.churches c
        on c.id = m.church_id
      where m.user_id = auth.uid()
        and m.role = 'peer'
        and c.pastor_id = p.id
        and c.org_id = p.org_id
    );
$$;

revoke all
on function public.get_team_planter_profile(uuid)
from public;

grant execute
on function public.get_team_planter_profile(uuid)
to authenticated;

commit;
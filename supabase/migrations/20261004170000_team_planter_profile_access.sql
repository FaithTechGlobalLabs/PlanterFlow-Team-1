begin;

create policy profiles_team_planter_read
on public.profiles
for select
to authenticated
using (
  role = 'planter'
  and org_id = public.current_org()
  and exists (
    select 1
    from public.church_memberships m
    join public.churches c on c.id = m.church_id
    where m.user_id = (select auth.uid())
      and m.role = 'peer'
      and c.pastor_id = profiles.id
      and c.org_id = profiles.org_id
  )
);

commit;
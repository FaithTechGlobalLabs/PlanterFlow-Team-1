-- Team members (role `peer`) join a specific church through the shared invitation flow.
-- The new enum value is only referenced by application code, never inside this migration.
alter type public.user_role add value if not exists 'peer';

alter table public.invitations add column if not exists church_id uuid references public.churches on delete cascade;

create table if not exists public.church_memberships (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  unique (church_id, user_id)
);
create index if not exists church_memberships_user_idx on public.church_memberships (user_id);

alter table public.church_memberships enable row level security;
revoke all on public.church_memberships from anon, authenticated;
grant select on public.church_memberships to authenticated;
grant all on public.church_memberships to service_role;

-- Members see their own membership; a pastor sees the members of their own church.
drop policy if exists church_memberships_select on public.church_memberships;
create policy church_memberships_select on public.church_memberships
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.churches c where c.id = church_id and c.pastor_id = (select auth.uid()))
  );

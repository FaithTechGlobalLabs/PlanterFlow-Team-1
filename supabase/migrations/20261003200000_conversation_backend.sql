-- Migration: 20261003200000_conversation_backend.sql
-- Conversation backend for prayer and support threads & messages.

create table if not exists public.conversation_threads (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('prayer', 'support')),
  entity_id uuid not null,
  planter_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text,
  status text not null default 'active' check (status in ('active', 'resolved', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entity_type, entity_id)
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversation_threads_entity_idx on public.conversation_threads(entity_type, entity_id);
create index if not exists conversation_threads_planter_idx on public.conversation_threads(planter_id, updated_at desc);
create index if not exists conversation_threads_org_idx on public.conversation_threads(org_id, updated_at desc);
create index if not exists conversation_messages_thread_idx on public.conversation_messages(thread_id, created_at asc);

-- Helper function: is_assigned_catalyst for a given planter
-- Head/Admin Catalyst has broad access; ordinary Catalyst requires explicit assignment (churches.catalyst_id = auth.uid())
create or replace function public.is_assigned_catalyst(p_planter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_catalyst() and (
    public.is_admin()
    or exists (
      select 1
      from public.churches c
      where c.pastor_id = p_planter_id
        and c.org_id = public.current_org()
        and c.catalyst_id = auth.uid()
    )
  );
$$;

alter table public.conversation_threads enable row level security;
alter table public.conversation_messages enable row level security;

revoke all on public.conversation_threads, public.conversation_messages from anon, authenticated;
grant select, insert, update on public.conversation_threads to authenticated;
grant select, insert, update on public.conversation_messages to authenticated;
grant all on public.conversation_threads, public.conversation_messages to service_role;

drop policy if exists conversation_threads_read on public.conversation_threads;
create policy conversation_threads_read on public.conversation_threads for select to authenticated using (
  org_id = public.current_org() and (
    planter_id = (select auth.uid())
    or public.is_assigned_catalyst(planter_id)
    or exists (
      select 1 from public.prayer_requests p
      where entity_type = 'prayer' and p.id = entity_id and p.visibility = 'organization'
    )
  )
);

drop policy if exists conversation_threads_insert on public.conversation_threads;
create policy conversation_threads_insert on public.conversation_threads for insert to authenticated with check (
  org_id = public.current_org() and (
    planter_id = (select auth.uid())
    or public.is_assigned_catalyst(planter_id)
  )
);

drop policy if exists conversation_threads_update on public.conversation_threads;
create policy conversation_threads_update on public.conversation_threads for update to authenticated using (
  org_id = public.current_org() and (
    planter_id = (select auth.uid())
    or public.is_assigned_catalyst(planter_id)
  )
) with check (
  org_id = public.current_org() and (
    planter_id = (select auth.uid())
    or public.is_assigned_catalyst(planter_id)
  )
);

drop policy if exists conversation_messages_read on public.conversation_messages;
create policy conversation_messages_read on public.conversation_messages for select to authenticated using (
  exists (
    select 1 from public.conversation_threads t
    where t.id = thread_id
    and t.org_id = public.current_org()
    and (
      t.planter_id = (select auth.uid())
      or public.is_assigned_catalyst(t.planter_id)
      or exists (
        select 1 from public.prayer_requests p
        where t.entity_type = 'prayer' and p.id = t.entity_id and p.visibility = 'organization'
      )
    )
  )
);

drop policy if exists conversation_messages_insert on public.conversation_messages;
create policy conversation_messages_insert on public.conversation_messages for insert to authenticated with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.conversation_threads t
    where t.id = thread_id
    and t.org_id = public.current_org()
    and (
      t.planter_id = (select auth.uid())
      or public.is_assigned_catalyst(t.planter_id)
      or exists (
        select 1 from public.prayer_requests p
        where t.entity_type = 'prayer' and p.id = t.entity_id and p.visibility = 'organization'
      )
    )
  )
);

drop policy if exists conversation_messages_update on public.conversation_messages;
create policy conversation_messages_update on public.conversation_messages for update to authenticated using (
  author_id = (select auth.uid())
);

-- Backfill conversation_threads & messages for prayer requests and check-ins
do $$
declare
  r_prayer record;
  r_checkin record;
begin
  for r_prayer in
    select id, planter_id, org_id, body, resolved, created_at
    from public.prayer_requests
  loop
    insert into public.conversation_threads (entity_type, entity_id, planter_id, org_id, title, status, created_at)
    values ('prayer', r_prayer.id, r_prayer.planter_id, r_prayer.org_id, left(r_prayer.body, 60), case when r_prayer.resolved then 'resolved' else 'active' end, r_prayer.created_at)
    on conflict (entity_type, entity_id) do nothing;
  end loop;

  for r_checkin in
    select c.id, c.planter_id, p.org_id, c.note, c.created_at
    from public.check_ins c
    join public.profiles p on p.id = c.planter_id
  loop
    insert into public.conversation_threads (entity_type, entity_id, planter_id, org_id, title, status, created_at)
    values ('support', r_checkin.id, r_checkin.planter_id, r_checkin.org_id, left(r_checkin.note, 60), 'active', r_checkin.created_at)
    on conflict (entity_type, entity_id) do nothing;
  end loop;
end $$;

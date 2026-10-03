-- Daily work extends onboarding without replacing its records.
alter table public.objective_categories add column kind text not null default 'objective' check (kind in ('objective', 'prayer'));
insert into public.objective_categories (org_id,title,description,sort_order,kind)
select o.id, c.title, c.description, c.sort_order, c.kind from public.organizations o
cross join (values
  ('Personal Relationship with Jesus', 'Growth and struggles, shared with your Catalyst. Never scored.', 4, 'objective'),
  ('Prayer Requests', 'Prayer and support for your planting journey.', 5, 'prayer')
) c(title,description,sort_order,kind)
where not exists (select 1 from public.objective_categories existing where existing.org_id=o.id and existing.title=c.title);

-- Enforce category and owner organization consistency for existing and new clients.
drop policy if exists objectives_insert on public.objectives;
create policy objectives_insert on public.objectives for insert to authenticated with check (
  planter_id=(select auth.uid()) and not public.is_catalyst()
  and exists(select 1 from public.objective_categories c where c.id=category_id and c.org_id=public.current_org() and c.kind='objective')
);
drop policy if exists objectives_update on public.objectives;
create policy objectives_update on public.objectives for update to authenticated
using (planter_id=(select auth.uid())) with check (
  planter_id=(select auth.uid()) and not public.is_catalyst()
  and exists(select 1 from public.objective_categories c where c.id=category_id and c.org_id=public.current_org() and c.kind='objective')
);

create table public.activities (
 id uuid primary key default gen_random_uuid(), objective_id uuid not null references public.objectives on delete cascade,
 description text not null check(length(trim(description)) between 1 and 500),
 cadence text not null check(cadence in ('weekly','monthly')), status text not null default 'active' check(status in ('active','done')),
 created_at timestamptz not null default now(), unique(id,objective_id)
);
create table public.progress_entries (
 id uuid primary key default gen_random_uuid(), objective_id uuid not null references public.objectives on delete cascade,
 activity_id uuid, author_id uuid not null references public.profiles,
 note text not null check(length(trim(note)) between 1 and 2000), value numeric check(value between 0 and 1000000000),
 created_at timestamptz not null default now(), foreign key(activity_id,objective_id) references public.activities(id,objective_id)
);
create table public.dialogue_messages (
 id uuid primary key default gen_random_uuid(), objective_id uuid not null references public.objectives on delete cascade,
 author_id uuid not null references public.profiles, body text not null check(length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create table public.check_ins (
 id uuid primary key default gen_random_uuid(), planter_id uuid not null references public.profiles,
 note text not null check(length(trim(note)) between 1 and 2000),
 feeling text not null check(feeling in ('encouraged','steady','stretched','struggling')),
 momentum text not null check(momentum in ('moving','steady','stuck')),
 support text not null default '' check(length(support)<=2000), created_at timestamptz not null default now()
);
create table public.prayer_requests (
 id uuid primary key default gen_random_uuid(), planter_id uuid not null references public.profiles,
 org_id uuid not null references public.organizations,
 body text not null check(length(trim(body)) between 1 and 2000),
 visibility text not null default 'private' check(visibility in ('private','organization')),
 resolved boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index activities_objective_idx on public.activities(objective_id);
create index progress_objective_idx on public.progress_entries(objective_id,created_at desc);
create index dialogue_objective_idx on public.dialogue_messages(objective_id,created_at);
create index check_ins_planter_idx on public.check_ins(planter_id,created_at desc);
create index prayer_org_idx on public.prayer_requests(org_id,planter_id);

alter table public.activities enable row level security;
alter table public.progress_entries enable row level security;
alter table public.dialogue_messages enable row level security;
alter table public.check_ins enable row level security;
alter table public.prayer_requests enable row level security;
revoke all on public.activities, public.progress_entries, public.dialogue_messages, public.check_ins, public.prayer_requests from anon, authenticated;
grant select,insert on public.activities, public.progress_entries, public.dialogue_messages, public.check_ins, public.prayer_requests to authenticated;
grant update(description,cadence,status) on public.activities to authenticated;
grant update(visibility,updated_at) on public.prayer_requests to authenticated;
grant all on public.activities, public.progress_entries, public.dialogue_messages, public.check_ins, public.prayer_requests to service_role;

create policy activities_read on public.activities for select to authenticated using(exists(select 1 from public.objectives o where o.id=objective_id));
create policy activities_insert on public.activities for insert to authenticated with check(exists(select 1 from public.objectives o where o.id=objective_id and o.planter_id=(select auth.uid())));
create policy activities_update on public.activities for update to authenticated using(exists(select 1 from public.objectives o where o.id=objective_id and o.planter_id=(select auth.uid()))) with check(exists(select 1 from public.objectives o where o.id=objective_id and o.planter_id=(select auth.uid())));
create policy progress_read on public.progress_entries for select to authenticated using(exists(select 1 from public.objectives o where o.id=objective_id));
create policy progress_insert on public.progress_entries for insert to authenticated with check(author_id=(select auth.uid()) and exists(select 1 from public.objectives o where o.id=objective_id and o.planter_id=(select auth.uid())));
create policy dialogue_read on public.dialogue_messages for select to authenticated using(exists(select 1 from public.objectives o where o.id=objective_id));
create policy dialogue_insert on public.dialogue_messages for insert to authenticated with check(author_id=(select auth.uid()) and exists(select 1 from public.objectives o where o.id=objective_id));
create policy check_ins_read on public.check_ins for select to authenticated using(planter_id=(select auth.uid()) or (public.is_catalyst() and exists(select 1 from public.profiles p where p.id=planter_id and p.org_id=public.current_org())));
create policy check_ins_insert on public.check_ins for insert to authenticated with check(planter_id=(select auth.uid()) and not public.is_catalyst());
create policy prayers_read on public.prayer_requests for select to authenticated using(org_id=public.current_org() and (planter_id=(select auth.uid()) or public.is_catalyst() or visibility='organization'));
create policy prayers_insert on public.prayer_requests for insert to authenticated with check(planter_id=(select auth.uid()) and org_id=public.current_org() and not public.is_catalyst());
create policy prayers_update on public.prayer_requests for update to authenticated using(org_id=public.current_org() and (planter_id=(select auth.uid()) or public.is_catalyst())) with check(org_id=public.current_org() and (planter_id=(select auth.uid()) or public.is_catalyst()));

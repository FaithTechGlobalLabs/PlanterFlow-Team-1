-- Apply before deploying clients that write the five objective statuses.
-- Existing activities and conversation thread statuses are unchanged.
begin;

alter table public.objectives drop constraint if exists objectives_status_check;
alter table public.objectives alter column status drop default;
update public.objectives
set status = case status
  when 'active' then 'in_progress'
  when 'paused' then 'planning'
  when 'done' then 'complete'
  else status
end
where status in ('active', 'paused', 'done');
alter table public.objectives add constraint objectives_status_check
  check (status in ('planning', 'in_progress', 'at_risk', 'complete', 'archived'));
alter table public.objectives alter column status set default 'planning';
comment on column public.objectives.status is
  'Objective board status: planning, in_progress, at_risk, complete, archived.';

commit;

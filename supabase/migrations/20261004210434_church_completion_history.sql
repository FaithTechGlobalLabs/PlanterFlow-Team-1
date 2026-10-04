-- Requires PR72's objective status migration. No historical completion dates are inferred.
begin;
alter table public.objectives
  add column has_completed boolean not null default false,
  add column first_completed_at timestamptz;
update public.objectives set has_completed = true where status in ('complete', 'done');
alter table public.objectives add constraint objectives_completion_date_requires_outcome
  check (first_completed_at is null or has_completed);

-- Invoker privileges and existing objective RLS remain unchanged. Clients cannot
-- erase earned outcomes or manufacture dates through these metadata columns.
create function public.preserve_objective_completion() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    NEW.has_completed := NEW.status in ('complete', 'done');
    NEW.first_completed_at := case when NEW.has_completed then statement_timestamp() else null end;
  else
    NEW.has_completed := OLD.has_completed or NEW.status in ('complete', 'done');
    NEW.first_completed_at := OLD.first_completed_at;
    if not OLD.has_completed and NEW.status in ('complete', 'done') then
      NEW.first_completed_at := statement_timestamp();
    end if;
  end if;
  return NEW;
end;
$$;
revoke all on function public.preserve_objective_completion() from public;
create trigger objectives_preserve_completion
  before insert or update on public.objectives
  for each row execute function public.preserve_objective_completion();
comment on column public.objectives.has_completed is 'Sticky, unique recorded outcome; reopening or archival does not remove fruit.';
comment on column public.objectives.first_completed_at is 'First completion observed after migration; null for undated historical outcomes.';
commit;

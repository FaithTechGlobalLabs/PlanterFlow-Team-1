-- Restrict ordinary profile edits without changing existing roles or accounts.
revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, locale, contact_preference, onboarded_at) on public.profiles to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (org_id = public.current_org() and public.is_catalyst()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

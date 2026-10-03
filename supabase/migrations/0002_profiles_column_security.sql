-- Restrict self-service profile updates to safe columns.
-- profiles_update only checks id = auth.uid(), so without column-level grants a
-- signed-in user could set their own role, is_admin or org_id, which
-- requireAdmin and inviteCatalyst trust.
-- See https://supabase.com/docs/guides/database/postgres/column-level-security

REVOKE UPDATE ON profiles FROM anon, authenticated;
GRANT UPDATE (display_name, locale, contact_preference, onboarded_at)
  ON profiles TO authenticated;

-- Defense in depth: the updated row must still belong to the caller.
DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

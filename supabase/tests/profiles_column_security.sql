-- Proves an authenticated user cannot escalate via profiles UPDATE.
-- Run after 0002 is applied; everything is rolled back.
--   pnpm dlx supabase db query --linked -f supabase/tests/profiles_column_security.sql
BEGIN;

INSERT INTO auth.users (id, instance_id, aud, role, email)
VALUES ('00000000-0000-0000-0000-0000000000aa',
        '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', 'rls-test@example.invalid');
INSERT INTO profiles (id, org_id, role, display_name)
VALUES ('00000000-0000-0000-0000-0000000000aa',
        '00000000-0000-0000-0000-000000000001', 'planter', 'RLS Test');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000aa', true);

DO $$
DECLARE
  col text;
BEGIN
  -- Each privileged column must be rejected.
  FOREACH col IN ARRAY ARRAY['role', 'is_admin', 'org_id'] LOOP
    BEGIN
      IF col = 'role' THEN
        UPDATE profiles SET role = 'catalyst' WHERE id = auth.uid();
      ELSIF col = 'is_admin' THEN
        UPDATE profiles SET is_admin = true WHERE id = auth.uid();
      ELSE
        UPDATE profiles SET org_id = gen_random_uuid() WHERE id = auth.uid();
      END IF;
      RAISE EXCEPTION 'FAIL: authenticated user could update %', col;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL; -- expected
    END;
  END LOOP;

  -- Safe columns must still work.
  UPDATE profiles SET contact_preference = 'email', onboarded_at = now()
  WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL: safe columns not updatable';
  END IF;
END $$;

ROLLBACK;
SELECT 'profiles column security: OK' AS result;

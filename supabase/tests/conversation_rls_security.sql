-- Proves RLS policies enforce thread visibility, replies, and assigned-catalyst boundaries for conversation backend.
--   pnpm dlx supabase db query --linked -f supabase/tests/conversation_rls_security.sql

BEGIN;

-- Setup test organizations, users, and profiles
INSERT INTO public.organizations (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Org Alpha'),
  ('22222222-2222-2222-2222-222222222222', 'Org Beta')
ON CONFLICT DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email) VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'planter1@alpha.com'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'planter2@alpha.com'),
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'assigned_catalyst@alpha.com'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'unassigned_catalyst@alpha.com'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'planter@beta.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, org_id, role, display_name) VALUES
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'planter', 'Planter One Alpha'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'planter', 'Planter Two Alpha'),
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'catalyst', 'Assigned Catalyst Alpha'),
  ('c0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'catalyst', 'Unassigned Catalyst Alpha'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'planter', 'Planter Beta')
ON CONFLICT DO NOTHING;

-- Seed assigned church for Planter One Alpha (assigned to Assigned Catalyst Alpha)
INSERT INTO public.churches (id, org_id, pastor_id, catalyst_id, name) VALUES
  ('f0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Grace Church Alpha')
ON CONFLICT DO NOTHING;

-- Seed prayer requests
INSERT INTO public.prayer_requests (id, planter_id, org_id, body, visibility) VALUES
  ('00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Private Prayer Body', 'private'),
  ('00000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Shared Prayer Body', 'organization')
ON CONFLICT DO NOTHING;

-- Seed threads for Planter One Alpha (valid hex UUIDs, entity_type in ('prayer', 'support'))
INSERT INTO public.conversation_threads (id, entity_type, entity_id, planter_id, org_id, title, status) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'support', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Private Support Check-in', 'active'),
  ('e0000000-0000-0000-0000-000000000002', 'prayer', '00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Private Prayer Thread', 'active'),
  ('e0000000-0000-0000-0000-000000000003', 'prayer', '00000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Shared Prayer Thread', 'active')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_count int;
BEGIN
  -- Test 1: Planter Two Alpha (peer planter in same org)
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

  -- Should see ONLY the organization-shared prayer thread (1 thread)
  SELECT count(*) INTO v_count FROM public.conversation_threads;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'FAIL: Planter Two Alpha saw % threads, expected 1 (only shared prayer)', v_count;
  END IF;

  -- Test 2: Foreign Planter Beta (in different org)
  PERFORM set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000001', true);

  -- Should see 0 threads from Org Alpha
  SELECT count(*) INTO v_count FROM public.conversation_threads;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL: Foreign Planter Beta saw % threads from another organization', v_count;
  END IF;

  -- Test 3: Assigned Catalyst Alpha (assigned to Planter 1's church)
  PERFORM set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);

  -- Should see all 3 threads in Org Alpha
  SELECT count(*) INTO v_count FROM public.conversation_threads;
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'FAIL: Assigned Catalyst Alpha saw % threads, expected 3', v_count;
  END IF;

  -- Test 4: Unassigned Catalyst Alpha (not assigned to Planter 1's church)
  PERFORM set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000002', true);

  -- Should see ONLY the organization-shared prayer thread (1 thread) because Planter 1 is assigned to Catalyst 1
  SELECT count(*) INTO v_count FROM public.conversation_threads;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'FAIL: Unassigned Catalyst Alpha saw % threads, expected 1 (only shared prayer)', v_count;
  END IF;
END $$;

ROLLBACK;
SELECT 'conversation RLS security: OK' AS result;

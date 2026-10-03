-- To apply: Copy and paste this entire file into the Supabase SQL Editor.

-- Create user_role enum type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('catalyst', 'planter');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations,
  role user_role NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  display_name text NOT NULL,
  locale text NOT NULL DEFAULT 'en',
  contact_preference text,
  onboarded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations,
  email text NOT NULL,
  role user_role NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  invited_by uuid REFERENCES profiles ON DELETE SET NULL,
  invited_by_name text NOT NULL,
  church_name text,
  welcome_note text,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);

-- Create index on invitations email
CREATE INDEX IF NOT EXISTS invitations_email_lower_idx ON invitations (lower(email));

-- Churches table
CREATE TABLE IF NOT EXISTS churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations,
  pastor_id uuid NOT NULL UNIQUE REFERENCES profiles ON DELETE CASCADE,
  catalyst_id uuid REFERENCES profiles ON DELETE SET NULL,
  name text NOT NULL,
  city text,
  planting_start_date date,
  vision text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Objective categories table
CREATE TABLE IF NOT EXISTS objective_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations,
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Objectives table
CREATE TABLE IF NOT EXISTS objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planter_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES objective_categories,
  title text NOT NULL,
  description text,
  cadence text NOT NULL DEFAULT 'monthly' CHECK (cadence IN ('weekly', 'monthly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'done')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Helper function: current_org
CREATE OR REPLACE FUNCTION current_org()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$;

-- Helper function: is_catalyst
CREATE OR REPLACE FUNCTION is_catalyst()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'catalyst' FROM profiles WHERE id = auth.uid();
$$;

-- Helper function: is_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_admin, false) FROM profiles WHERE id = auth.uid();
$$;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE objective_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

-- Organizations policies
DROP POLICY IF EXISTS organizations_select ON organizations;
CREATE POLICY organizations_select ON organizations
  FOR SELECT
  USING (id = current_org());

-- Profiles policies
DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT
  USING (org_id = current_org());

DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Invitations policies
DROP POLICY IF EXISTS invitations_select ON invitations;
CREATE POLICY invitations_select ON invitations
  FOR SELECT
  USING (invited_by = auth.uid());

-- Churches policies
DROP POLICY IF EXISTS churches_select ON churches;
CREATE POLICY churches_select ON churches
  FOR SELECT
  USING (org_id = current_org());

DROP POLICY IF EXISTS churches_insert ON churches;
CREATE POLICY churches_insert ON churches
  FOR INSERT
  WITH CHECK (pastor_id = auth.uid() AND org_id = current_org());

DROP POLICY IF EXISTS churches_update ON churches;
CREATE POLICY churches_update ON churches
  FOR UPDATE
  USING (pastor_id = auth.uid() AND org_id = current_org());

-- Objective categories policies
DROP POLICY IF EXISTS objective_categories_select ON objective_categories;
CREATE POLICY objective_categories_select ON objective_categories
  FOR SELECT
  USING (org_id = current_org());

DROP POLICY IF EXISTS objective_categories_insert ON objective_categories;
CREATE POLICY objective_categories_insert ON objective_categories
  FOR INSERT
  WITH CHECK (org_id = current_org() AND is_catalyst());

DROP POLICY IF EXISTS objective_categories_update ON objective_categories;
CREATE POLICY objective_categories_update ON objective_categories
  FOR UPDATE
  USING (org_id = current_org() AND is_catalyst());

DROP POLICY IF EXISTS objective_categories_delete ON objective_categories;
CREATE POLICY objective_categories_delete ON objective_categories
  FOR DELETE
  USING (org_id = current_org() AND is_catalyst());

-- Objectives policies
DROP POLICY IF EXISTS objectives_select ON objectives;
CREATE POLICY objectives_select ON objectives
  FOR SELECT
  USING (
    planter_id = auth.uid()
    OR (is_catalyst() AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = objectives.planter_id
      AND profiles.org_id = current_org()
    ))
  );

DROP POLICY IF EXISTS objectives_insert ON objectives;
CREATE POLICY objectives_insert ON objectives
  FOR INSERT
  WITH CHECK (planter_id = auth.uid());

DROP POLICY IF EXISTS objectives_update ON objectives;
CREATE POLICY objectives_update ON objectives
  FOR UPDATE
  USING (planter_id = auth.uid());

-- Seed data: British Columbia organization
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'British Columbia')
ON CONFLICT (id) DO NOTHING;

-- Seed data: Objective categories for BC
INSERT INTO objective_categories (org_id, title, description, sort_order)
SELECT
  '00000000-0000-0000-0000-000000000001',
  t.title,
  NULL,
  t.sort_order
FROM (VALUES
  ('Engage the City', 1),
  ('Make Disciples', 2),
  ('Plant the Church', 3)
) AS t(title, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM objective_categories
  WHERE org_id = '00000000-0000-0000-0000-000000000001'
  AND objective_categories.title = t.title
);

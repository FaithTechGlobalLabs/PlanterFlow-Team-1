BEGIN;

-- Does the signed-in peer belong to this planter's church?
CREATE OR REPLACE FUNCTION public.is_church_team_member(
  target_planter_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_memberships m
    JOIN public.churches c ON c.id = m.church_id
    JOIN public.profiles p ON p.id = m.user_id
    WHERE c.pastor_id = target_planter_id
      AND m.user_id = auth.uid()
      AND m.role = 'peer'
      AND p.role = 'peer'
      AND p.org_id = c.org_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_church_team_member(uuid)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_church_team_member(uuid)
TO authenticated;

-- Add team visibility while retaining existing planter/Catalyst policies.
CREATE POLICY objectives_team_read
ON public.objectives
FOR SELECT TO authenticated
USING (
  team_visible
  AND public.is_church_team_member(planter_id)
);

-- Existing activity/progress SELECT policies already follow objective access.
CREATE POLICY activities_team_insert
ON public.activities
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.objectives o
    WHERE o.id = activities.objective_id
      AND o.team_visible
      AND public.is_church_team_member(o.planter_id)
  )
);

CREATE POLICY activities_team_update
ON public.activities
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.objectives o
    WHERE o.id = activities.objective_id
      AND o.team_visible
      AND public.is_church_team_member(o.planter_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.objectives o
    WHERE o.id = activities.objective_id
      AND o.team_visible
      AND public.is_church_team_member(o.planter_id)
  )
);

CREATE POLICY progress_team_insert
ON public.progress_entries
FOR INSERT TO authenticated
WITH CHECK (
  author_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.objectives o
    WHERE o.id = progress_entries.objective_id
      AND o.team_visible
      AND public.is_church_team_member(o.planter_id)
  )
);

-- Objective visibility must not expose existing private dialogue.
CREATE POLICY dialogue_private_roles
ON public.dialogue_messages
AS RESTRICTIVE
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('planter', 'catalyst')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('planter', 'catalyst')
  )
);

COMMIT;
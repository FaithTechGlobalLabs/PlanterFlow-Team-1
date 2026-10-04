BEGIN;

CREATE TABLE public.objective_team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL
    REFERENCES public.objectives(id) ON DELETE CASCADE,
  author_id uuid NOT NULL
    REFERENCES public.profiles(id),
  body text NOT NULL
    CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX objective_team_messages_objective_idx
ON public.objective_team_messages(objective_id, created_at);

ALTER TABLE public.objective_team_messages
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.objective_team_messages
FROM anon, authenticated;

GRANT SELECT, INSERT ON public.objective_team_messages
TO authenticated;

GRANT ALL ON public.objective_team_messages
TO service_role;

-- The objective's existing RLS also applies to this lookup.
-- Planters/Catalysts retain history when sharing is turned off.
-- Peers need current membership and an actively shared objective.
CREATE POLICY team_messages_read
ON public.objective_team_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.objectives o
    WHERE o.id = objective_team_messages.objective_id
      AND (
        o.planter_id = (SELECT auth.uid())
        OR public.is_assigned_catalyst(o.planter_id)
        OR (
          o.team_visible
          AND public.is_church_team_member(o.planter_id)
        )
      )
  )
);

-- Replies are allowed only while the objective is shared.
CREATE POLICY team_messages_insert
ON public.objective_team_messages
FOR INSERT TO authenticated
WITH CHECK (
  author_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.objectives o
    WHERE o.id = objective_team_messages.objective_id
      AND o.team_visible
      AND (
        o.planter_id = (SELECT auth.uid())
        OR public.is_assigned_catalyst(o.planter_id)
        OR public.is_church_team_member(o.planter_id)
      )
  )
);

COMMIT;
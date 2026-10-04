ALTER TABLE public.objectives
ADD COLUMN team_visible boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.objectives.team_visible IS
  'Whether members of the planter''s church can access this objective.';
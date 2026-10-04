import { isMeaningfulProgress, type GrowthProgress } from "./church-growth";

/** Counts supplied authorized records only; response authors must be authenticated IDs. */
export function catalystCareThisMonth({
  viewerId,
  now,
  objectives,
  progress,
  responses,
}: {
  viewerId: string;
  now: Date;
  objectives: { id: string; planter_id: string }[];
  progress: (GrowthProgress & { created_at: string })[];
  responses: {
    id: string;
    author_id: string;
    created_at: string;
    body?: string;
  }[];
}) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).getTime();
  const within = (at: string) =>
    Date.parse(at) >= start && Date.parse(at) <= now.getTime();
  const owner = new Map(objectives.map((o) => [o.id, o.planter_id]));
  const qualifying = progress.filter(
    (p) => within(p.created_at) && isMeaningfulProgress(p),
  );
  return {
    period: now.toISOString().slice(0, 7),
    churchesWithProgress: new Set(
      qualifying
        .filter((p) => owner.has(p.objective_id))
        .map((p) => owner.get(p.objective_id)),
    ).size,
    ownResponses: new Set(
      responses
        .filter(
          (r) =>
            r.author_id === viewerId &&
            within(r.created_at) &&
            (r.body === undefined || Boolean(r.body.trim())),
        )
        .map((r) => r.id),
    ).size,
  };
}

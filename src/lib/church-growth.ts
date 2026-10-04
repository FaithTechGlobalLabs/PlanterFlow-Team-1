import { treeStageFromPlantingDate, type TreeStage } from "./tree-stage";

export const GROWTH_LIMITS = { branches: 6, leaves: 18, fruit: 5 } as const;
export const isCompletedOutcome = (status?: string) =>
  status === "done" || status === "complete";
export const isGrowingObjective = (status?: string) =>
  ["active", "planning", "in_progress", "at_risk"].includes(status ?? "");

/** Date-only planting dates are calendar dates, never the viewer's local timezone. */
export function plantingDate(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? date
    : null;
}

export type GrowthObjective = {
  id: string;
  status?: string;
  has_completed?: boolean;
  first_completed_at?: string | null;
};
export type GrowthProgress = {
  id: string;
  objective_id: string;
  note?: string | null;
  value?: number | null;
};
export function isMeaningfulProgress(p: {
  note?: string | null;
  value?: number | null;
}) {
  return (
    Boolean(p.note?.trim()) ||
    (typeof p.value === "number" && Number.isFinite(p.value))
  );
}
export type ChurchGrowth = {
  stage: TreeStage | null;
  planned: boolean;
  branches: number;
  progress: number;
  completed: number;
  currentCompleted: number;
  historyAvailable: boolean;
  visible: { branches: number; leaves: number; fruit: number };
};

/** Caller supplies authorized church records only; this is not an authorization layer.
 * Completion metadata is maintained by the database trigger, not client clicks.
 * Before migration, only current completion can be described reliably.
 */
export function churchGrowth({
  startDate,
  objectives,
  progress,
  now,
}: {
  startDate?: string | null;
  objectives: readonly GrowthObjective[];
  progress: readonly GrowthProgress[];
  now: Date;
}): ChurchGrowth {
  const date = plantingDate(startDate);
  const byId = new Map(objectives.map((o) => [o.id, o]));
  const progressIds = new Set(
    progress
      .filter(
        (p) => p.id && byId.has(p.objective_id) && isMeaningfulProgress(p),
      )
      .map((p) => p.id),
  );
  const branches = byId.size;
  const currentCompleted = [...byId.values()].filter((o) =>
    isCompletedOutcome(o.status),
  ).length;
  const completed = [...byId.values()].filter(
    (o) => o.has_completed === true || isCompletedOutcome(o.status),
  ).length;
  return {
    stage:
      date && Number.isFinite(now.getTime())
        ? treeStageFromPlantingDate(date, now)
        : null,
    planned: Boolean(date && date > now),
    branches,
    progress: progressIds.size,
    completed,
    currentCompleted,
    historyAvailable: [...byId.values()].every(
      (o) => typeof o.has_completed === "boolean",
    ),
    visible: {
      branches: Math.min(branches, GROWTH_LIMITS.branches),
      leaves: Math.min(progressIds.size, GROWTH_LIMITS.leaves),
      fruit: Math.min(completed, GROWTH_LIMITS.fruit),
    },
  };
}

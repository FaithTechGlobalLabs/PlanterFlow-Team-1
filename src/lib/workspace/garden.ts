import { treeStageFromPlantingDate, type TreeStage } from "@/lib/tree-stage";
import type { WorkspaceData } from "./types";

export const stageLabels: Record<TreeStage, string> = {
  seed: "Seed · first 3 months",
  sprout: "Sprout · 3–12 months",
  sapling: "Sapling · year 1–2",
  young: "Young tree · year 2–3",
  established: "Established · year 3+",
};
export function gardenSummary(data: WorkspaceData) {
  const now = new Date(data.asOf);
  const start = data.church?.planting_start_date
    ? new Date(data.church.planting_start_date)
    : null;
  const stage =
    start && Number.isFinite(start.getTime())
      ? treeStageFromPlantingDate(start, now)
      : null;
  const active = data.objectives.filter((o) => o.status === "active");
  // A suggestion, not a deadline warning: earliest target, then oldest creation.
  const next = [...active].sort(
    (a, b) =>
      (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
      a.created_at.localeCompare(b.created_at) ||
      a.id.localeCompare(b.id),
  )[0];
  const weekStart = new Date(now);
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(
    weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7),
  );
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart.getTime() + i * 86400000)
      .toISOString()
      .slice(0, 10);
    return data.progress.some(
      (p) =>
        p.author_id === data.viewer.id &&
        p.created_at.slice(0, 10) === day &&
        new Date(p.created_at) <= now,
    );
  });
  const completed = data.objectives.filter((o) => o.status === "done").length;
  return {
    stage,
    active,
    next,
    completed,
    days,
    shared: data.objectives.filter((o) => o.team_visible).length,
  };
}
export function journeyMoments(data: WorkspaceData) {
  // Completion has no persisted completed_at: do not fabricate a completion date.
  return [
    ...data.objectives.map((o) => ({
      id: `objective-${o.id}`,
      at: o.created_at,
      title: o.title,
      detail: "Objective planted",
      objectiveId: o.id,
    })),
    ...data.progress.map((p) => ({
      id: `progress-${p.id}`,
      at: p.created_at,
      title: p.note,
      detail: `${data.people.find((person) => person.id === p.author_id)?.display_name || "A contributor"} · ${data.objectives.find((o) => o.id === p.objective_id)?.title || "Objective progress"}`,
      objectiveId: p.objective_id,
    })),
    ...(data.team?.members ?? []).map((p) => ({
      id: `member-${p.id}`,
      at: p.joined_at,
      title: `${p.display_name} joined your Church Team`,
      detail: "Growing together",
      objectiveId: null,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));
}
export function gardenDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

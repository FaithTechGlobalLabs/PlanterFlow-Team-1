import type { TreeStage } from "@/lib/tree-stage";
import {
  churchGrowth,
  isGrowingObjective,
  isMeaningfulProgress,
} from "@/lib/church-growth";
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
  const growth = churchGrowth({
    startDate: data.church?.planting_start_date,
    objectives: data.objectives,
    progress: data.progress,
    now,
  });
  const stage = growth.stage;
  const active = data.objectives.filter((o) => isGrowingObjective(o.status));
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
        isMeaningfulProgress(p) &&
        p.created_at.slice(0, 10) === day &&
        new Date(p.created_at) <= now,
    );
  });
  const completed = growth.completed;
  return {
    stage,
    active,
    next,
    completed,
    growth,
    days,
    shared: data.objectives.filter((o) => o.team_visible).length,
  };
}
export function journeyMoments(data: WorkspaceData) {
  // Older outcomes may have no first_completed_at: never fabricate their dates.
  return [
    ...data.objectives.map((o) => ({
      id: `objective-${o.id}`,
      at: o.created_at,
      title: o.title,
      detail: "Objective planted",
      objectiveId: o.id,
    })),
    ...data.progress
      .filter((p) => isMeaningfulProgress(p))
      .map((p) => ({
        id: `progress-${p.id}`,
        at: p.created_at,
        title: p.note.trim() || `Recorded value: ${p.value}`,
        detail: `${data.people.find((person) => person.id === p.author_id)?.display_name || "A contributor"} · ${data.objectives.find((o) => o.id === p.objective_id)?.title || "Objective progress"}`,
        objectiveId: p.objective_id,
      })),
    ...data.objectives
      .filter((o) => o.has_completed && o.first_completed_at)
      .map((o) => ({
        id: `outcome-${o.id}`,
        at: o.first_completed_at!,
        title: o.title,
        detail: "First completed · a recorded outcome",
        objectiveId: o.id,
      })),
    ...data.messages
      .filter((m) => m.body.trim())
      .map((m) => ({
        id: `care-${m.id}`,
        at: m.created_at,
        title: "A conversation response",
        detail: `${data.people.find((person) => person.id === m.author_id)?.display_name || "A contributor"} · ${data.objectives.find((o) => o.id === m.objective_id)?.title || "Church care"}`,
        objectiveId: m.objective_id,
      })),
    ...(data.threads ?? []).flatMap((thread) =>
      thread.messages
        .filter((m) => m.body.trim())
        .map((m) => ({
          id: `conversation-${m.id}`,
          at: m.created_at,
          title:
            thread.entity_type === "support"
              ? "A support conversation response"
              : "A prayer conversation response",
          detail: `${data.people.find((person) => person.id === m.author_id)?.display_name || "A contributor"} · Shared care`,
          objectiveId: null,
        })),
    ),
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

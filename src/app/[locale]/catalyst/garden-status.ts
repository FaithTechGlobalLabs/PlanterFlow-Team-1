// Shapes the Catalyst garden from records the Catalyst is assigned to.
// Statuses come from real check-ins, progress entries and acknowledgements;
// only a message linked to the check-in (check_in_id) counts as reviewing it.

import { isOpenObjective, normalizeObjectiveStatus } from "@/lib/workspace/objective-status";
import { treeStageFromPlantingDate, type TreeStage } from "@/lib/tree-stage";

export const CHECK_IN_DUE_AFTER_DAYS = 7;
const DAY_MS = 86_400_000;

export type GardenChurch = {
  completedObjectives?: number;
  currentObjective?: string;
  churchId: string;
  churchName: string;
  city: string | null;
  pastorId: string;
  pastorName: string;
  stage: TreeStage | null;
  lastActivityAt: string | null;
  lastCheckInAt: string | null;
  supportRequested: boolean;
  checkInDue: boolean;
  replyDue: boolean;
};

type ChurchRow = {
  id: string;
  name: string;
  city: string | null;
  planting_start_date: string | null;
  pastor_id: string;
};
type PastorRow = { id: string; display_name: string };
type CheckInRow = {
  id: string;
  planter_id: string;
  support: string;
  created_at: string;
};
type ObjectiveRow = {
  id: string;
  planter_id: string;
  title?: string;
  status?: string;
};
type ProgressRow = { objective_id: string; created_at: string };

export function buildGarden(
  input: {
    churches: ChurchRow[];
    pastors: PastorRow[];
    checkIns: CheckInRow[];
    objectives: ObjectiveRow[];
    progress: ProgressRow[];
    // Check-in ids this Catalyst has acknowledged.
    acknowledgedCheckInIds: string[];
  },
  now: Date,
): GardenChurch[] {
  const pastorName = new Map(input.pastors.map((p) => [p.id, p.display_name]));
  const objectiveOwner = new Map(
    input.objectives.map((o) => [o.id, o.planter_id]),
  );
  const acknowledged = new Set(input.acknowledgedCheckInIds);
  const latest = (dates: string[]) =>
    dates.reduce<string | null>((a, b) => (a && a > b ? a : b), null);

  return input.churches
    .map((church) => {
      const checkIns = input.checkIns.filter(
        (c) => c.planter_id === church.pastor_id,
      );
      const lastCheckIn = checkIns.reduce<CheckInRow | null>(
        (a, b) => (a && a.created_at > b.created_at ? a : b),
        null,
      );
      const progressDates = input.progress
        .filter((p) => objectiveOwner.get(p.objective_id) === church.pastor_id)
        .map((p) => p.created_at);
      const reviewed = Boolean(lastCheckIn && acknowledged.has(lastCheckIn.id));
      const daysSinceCheckIn = lastCheckIn
        ? (now.getTime() - new Date(lastCheckIn.created_at).getTime()) / DAY_MS
        : Infinity;

      return {
        completedObjectives: input.objectives.filter(
          (o) => o.planter_id === church.pastor_id && (o.status !== undefined && normalizeObjectiveStatus(o.status) === "complete"),
        ).length,
        currentObjective: input.objectives.find(
          (o) => o.planter_id === church.pastor_id && (o.status !== undefined && isOpenObjective(o.status)),
        )?.title,
        churchId: church.id,
        churchName: church.name,
        city: church.city,
        pastorId: church.pastor_id,
        pastorName: pastorName.get(church.pastor_id) ?? "",
        stage: church.planting_start_date
          ? treeStageFromPlantingDate(
              new Date(`${church.planting_start_date}T00:00:00`),
              now,
            )
          : null,
        lastActivityAt: latest([
          ...progressDates,
          ...checkIns.map((c) => c.created_at),
        ]),
        lastCheckInAt: lastCheckIn?.created_at ?? null,
        supportRequested: Boolean(lastCheckIn?.support.trim()) && !reviewed,
        checkInDue: daysSinceCheckIn > CHECK_IN_DUE_AFTER_DAYS,
        replyDue: Boolean(lastCheckIn) && !reviewed,
      };
    })
    .sort(
      (a, b) =>
        attention(b) - attention(a) || a.churchName.localeCompare(b.churchName),
    );
}

// Support requests first, then overdue check-ins, then unanswered check-ins.
function attention(church: GardenChurch) {
  return (
    (church.supportRequested ? 4 : 0) +
    (church.checkInDue ? 2 : 0) +
    (church.replyDue ? 1 : 0)
  );
}

export function needsPresence(church: GardenChurch) {
  return church.supportRequested || church.replyDue || church.checkInDue;
}

// Whole calendar days between two instants, never negative.
export function daysSince(iso: string, now: Date): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS),
  );
}

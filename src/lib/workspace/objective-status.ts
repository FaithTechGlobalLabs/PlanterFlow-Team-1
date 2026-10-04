export const OBJECTIVE_STATUSES = [
  "planning", "in_progress", "at_risk", "complete", "archived",
] as const;
export type ObjectiveStatus = typeof OBJECTIVE_STATUSES[number];
export const OBJECTIVE_STATUS_LABELS: Record<ObjectiveStatus, string> = {
  planning: "Planning", in_progress: "In Progress", at_risk: "At Risk",
  complete: "Complete", archived: "Archived",
};

// Read compatibility during rollout; all new writes use the five-status model.
export function normalizeObjectiveStatus(status: string): ObjectiveStatus {
  if (status === "active") return "in_progress";
  if (status === "paused") return "planning";
  if (status === "done") return "complete";
  if ((OBJECTIVE_STATUSES as readonly string[]).includes(status)) return status as ObjectiveStatus;
  throw new Error(`Unknown objective status: ${status}`);
}
export function isOpenObjective(status: string): boolean {
  return ["planning", "in_progress", "at_risk"].includes(normalizeObjectiveStatus(status));
}

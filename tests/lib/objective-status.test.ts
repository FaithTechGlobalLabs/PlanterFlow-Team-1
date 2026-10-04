import { describe, expect, it } from "vitest";
import { isOpenObjective, normalizeObjectiveStatus, OBJECTIVE_STATUSES } from "@/lib/workspace/objective-status";
describe("objective status rollout", () => {
  it("preserves the agreed meaning of legacy statuses", () => {
    expect(normalizeObjectiveStatus("active")).toBe("in_progress");
    expect(normalizeObjectiveStatus("paused")).toBe("planning");
    expect(normalizeObjectiveStatus("done")).toBe("complete");
    OBJECTIVE_STATUSES.forEach(status => expect(normalizeObjectiveStatus(status)).toBe(status));
  });
  it("includes Planning and At Risk in open counts but excludes finished history", () => {
    expect(OBJECTIVE_STATUSES.filter(isOpenObjective)).toEqual(["planning", "in_progress", "at_risk"]);
  });
  it("does not silently discard unknown database states", () => {
    expect(() => normalizeObjectiveStatus("invalid")).toThrow("Unknown objective status");
  });
});

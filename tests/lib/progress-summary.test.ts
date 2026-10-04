import { describe, expect, it } from "vitest";
import { summarizeProgress } from "@/lib/workspace/progress-summary";
import type { Progress } from "@/lib/workspace/types";
const entry = (created_at: string): Progress => ({
  id: created_at,
  objective_id: "goal",
  activity_id: null,
  author_id: "sample-planter",
  note: "Update",
  value: null,
  created_at,
});describe("dashboard progress rhythm", () => {
  it("places Sunday and Monday updates in their correct UTC weeks", () => {
    const result = summarizeProgress([
      entry("2026-09-27T23:59:59Z"), entry("2026-09-28T00:00:00Z"),
      entry("2026-10-03T20:00:00Z"), entry("2026-09-06T23:59:59Z"),
    ], "2026-10-03T18:00:00Z");
    expect(result.map(week => week.count)).toEqual([0, 0, 1, 1]);
    expect(result[3].label).toBe("Sep 28");
  });
  it("shows empty weeks rather than inventing progress", () => {
    expect(summarizeProgress([], "2026-10-03T18:00:00Z").map(week => week.count)).toEqual([0,0,0,0]);
  });
});

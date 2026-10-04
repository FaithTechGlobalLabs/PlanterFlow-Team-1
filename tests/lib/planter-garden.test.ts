import { describe, it, expect } from "vitest";
import { sampleWorkspace } from "@/lib/workspace/sample";
import { gardenSummary, journeyMoments } from "@/lib/workspace/garden";

describe("truthful planter garden", () => {
  it("uses existing planting age independently of activity", () => {
    const data = {
      ...sampleWorkspace,
      church: { ...sampleWorkspace.church!, planting_start_date: "2025-01-01" },
      progress: [],
    };
    expect(gardenSummary(data).stage).toBe("sapling");
    expect(gardenSummary({ ...data, asOf: "2029-01-01T00:00:00Z" }).stage).toBe(
      "established",
    );
    expect(gardenSummary(sampleWorkspace).stage).toBeNull();
  });
  it("counts only explicit completion as fruit and does not decay after inactivity", () => {
    const data = {
      ...sampleWorkspace,
      objectives: sampleWorkspace.objectives.map((o, i) => ({
        ...o,
        status: i === 0 ? ("complete" as const) : o.status,
      })),
    };
    expect(gardenSummary(data).completed).toBe(1);
    expect(
      gardenSummary({ ...data, asOf: "2029-01-01T00:00:00Z" }).completed,
    ).toBe(1);
  });
  it("counts unique personal progress days inside the current UTC week", () => {
    const p = sampleWorkspace.progress[0];
    const data = {
      ...sampleWorkspace,
      asOf: "2026-10-04T12:00:00Z",
      progress: [
        { ...p, created_at: "2026-10-02T12:00:00Z" },
        { ...p, created_at: "2026-10-02T18:00:00Z" },
        {
          ...p,
          author_id: "another-person",
          created_at: "2026-10-03T12:00:00Z",
        },
        { ...p, created_at: "2026-09-27T12:00:00Z" },
        { ...p, created_at: "2026-10-04T18:00:00Z" },
      ],
    };
    expect(gardenSummary(data).days.filter(Boolean)).toHaveLength(1);
  });
  it("suggests an active objective by target date, never a completed objective", () => {
    const objectives = sampleWorkspace.objectives.map((o, i) => ({
      ...o,
      due_date: i === 1 ? "2026-10-05" : null,
    }));
    expect(gardenSummary({ ...sampleWorkspace, objectives }).next.id).toBe(
      objectives[1].id,
    );
    expect(
      gardenSummary({ ...sampleWorkspace, objectives: [] }).next,
    ).toBeUndefined();
  });
  it("records only dated creation, progress and membership moments", () => {
    const moments = journeyMoments(sampleWorkspace);
    expect(moments).toHaveLength(
      sampleWorkspace.objectives.length + sampleWorkspace.progress.length,
    );
    expect(moments.some((m) => m.detail === "Objective completed")).toBe(false);
  });
});

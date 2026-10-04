import { describe, it, expect } from "vitest";
import { churchGrowth, plantingDate } from "@/lib/church-growth";
import { gardenSummary } from "@/lib/workspace/garden";
import { buildGarden } from "@/app/[locale]/catalyst/garden-status";
import { sampleWorkspace } from "@/lib/workspace/sample";

const now = new Date("2026-10-04T12:00:00Z");
const calculate = (startDate: string | null) =>
  churchGrowth({ startDate, objectives: [], progress: [], now });
describe("shared church growth", () => {
  it.each([
    ["2026-07-05", "seed"],
    ["2026-07-04", "sprout"],
    ["2025-10-05", "sprout"],
    ["2025-10-04", "sapling"],
    ["2024-10-05", "sapling"],
    ["2024-10-04", "young"],
    ["2023-10-05", "young"],
    ["2023-10-04", "established"],
  ])("resolves calendar boundary %s as %s", (date, stage) => {
    expect(calculate(date).stage).toBe(stage);
  });
  it.each([
    null,
    "",
    "not-a-date",
    "2026-02-30",
    "2026-13-01",
    "2026-10-04T12:00:00Z",
  ])("rejects missing/invalid date %s", (date) => {
    expect(calculate(date).stage).toBeNull();
    expect(plantingDate(date)).toBeNull();
  });
  it("distinguishes a future planned planting from missing data", () => {
    expect(calculate("2027-01-01")).toMatchObject({
      stage: "seed",
      planned: true,
    });
    expect(calculate(null).planned).toBe(false);
  });
  it("deduplicates progress and objectives, ignores empty records and unrelated objectives", () => {
    const p = { id: "p", objective_id: "o", note: "A real step" };
    const growth = churchGrowth({
      now,
      objectives: [
        { id: "o", status: "complete" },
        { id: "o", status: "complete" },
      ],
      progress: [
        p,
        p,
        { ...p, note: "Edited" },
        { id: "empty", objective_id: "o", note: " " },
        { id: "other", objective_id: "other", note: "Private" },
        { id: "measure", objective_id: "o", value: 0 },
      ],
    });
    expect(growth).toMatchObject({ completed: 1, progress: 2, branches: 1 });
  });
  it("supports old and PR72 statuses without treating archive or at-risk as completion", () => {
    expect(
      churchGrowth({
        now,
        objectives: [
          "done",
          "complete",
          "planning",
          "in_progress",
          "at_risk",
          "archived",
          "paused",
        ].map((status, i) => ({ id: String(i), status })),
        progress: [],
      }).completed,
    ).toBe(2);
  });
  it("keeps exact counts beyond artwork limits and does not decay with time", () => {
    const objectives = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      status: "complete",
    }));
    const progress = objectives.map((o) => ({
      id: o.id,
      objective_id: o.id,
      note: "A step",
    }));
    const input = { objectives, progress, startDate: "2024-01-01" };
    const current = churchGrowth({ ...input, now });
    expect(current).toMatchObject({
      completed: 25,
      progress: 25,
      visible: { branches: 6, leaves: 18, fruit: 5 },
    });
    expect(
      churchGrowth({ ...input, now: new Date("2030-01-01T00:00:00Z") }),
    ).toMatchObject({ completed: 25, progress: 25 });
  });
  it("falls back honestly when completion metadata is unavailable", () => {
    const input = {
      now,
      progress: [],
      objectives: [{ id: "o", status: "complete" }],
    };
    expect(churchGrowth(input).completed).toBe(1);
    expect(
      churchGrowth({
        ...input,
        objectives: [{ id: "o", status: "in_progress" }],
      }).completed,
    ).toBe(0);
    expect(
      churchGrowth({ ...input, objectives: [{ id: "o", status: "complete" }] })
        .completed,
    ).toBe(1);
  });
  it("retains one outcome through reopening, recompletion and archival", () => {
    for (const status of ["in_progress", "complete", "archived"]) {
      const growth = churchGrowth({
        now,
        progress: [],
        objectives: [
          {
            id: "earned",
            status,
            has_completed: true,
            first_completed_at: null,
          },
        ],
      });
      expect(growth.completed).toBe(1);
      expect(growth.currentCompleted).toBe(status === "complete" ? 1 : 0);
      expect(growth.historyAvailable).toBe(true);
    }
  });
  it("does not inflate growth from profile edits, dates or empty numeric values", () => {
    const input = {
      now,
      objectives: [{ id: "o", status: "in_progress", has_completed: false }],
      progress: [{ id: "bad", objective_id: "o", value: NaN, note: " " }],
    };
    expect(churchGrowth(input)).toMatchObject({ completed: 0, progress: 0 });
    expect(churchGrowth({ ...input, startDate: "2020-01-01" })).toMatchObject({
      completed: 0,
      progress: 0,
    });
  });
  it("produces identical growth from Catalyst and Planter adapters", () => {
    const data = {
      ...sampleWorkspace,
      asOf: now.toISOString(),
      church: { ...sampleWorkspace.church!, planting_start_date: "2025-01-01" },
    };
    const garden = buildGarden(
      {
        churches: [
          {
            id: "church",
            name: data.church.name,
            city: null,
            pastor_id: data.planter.id,
            planting_start_date: data.church.planting_start_date,
          },
        ],
        pastors: [data.planter],
        objectives: data.objectives,
        progress: data.progress,
        checkIns: [],
        acknowledgedCheckInIds: [],
      },
      now,
    );
    expect(garden[0].growth).toEqual(gardenSummary(data).growth);
  });
  it("attributes acknowledged check-ins once and only within the church", () => {
    const base = {
      churches: [
        {
          id: "c",
          name: "Church",
          city: null,
          pastor_id: "p",
          planting_start_date: null,
        },
      ],
      pastors: [],
      objectives: [],
      progress: [],
      checkIns: [
        {
          id: "mine",
          planter_id: "p",
          support: "",
          created_at: now.toISOString(),
        },
        {
          id: "other",
          planter_id: "other",
          support: "",
          created_at: now.toISOString(),
        },
      ],
      acknowledgedCheckInIds: ["mine", "mine", "other"],
    };
    expect(buildGarden(base, now)[0].careCount).toBe(1);
  });
});

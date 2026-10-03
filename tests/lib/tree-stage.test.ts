import { describe, it, expect } from "vitest";
import { treeStageFromPlantingDate } from "@/lib/tree-stage";

const now = new Date("2026-10-03");

describe("treeStageFromPlantingDate", () => {
  it("returns seed for a church planted under 3 months ago", () => {
    expect(treeStageFromPlantingDate(new Date("2026-08-01"), now)).toBe("seed");
  });

  it("returns sprout between 3 and 12 months", () => {
    expect(treeStageFromPlantingDate(new Date("2026-03-01"), now)).toBe("sprout");
  });

  it("returns sapling between year 1 and 2", () => {
    expect(treeStageFromPlantingDate(new Date("2025-06-01"), now)).toBe("sapling");
  });

  it("returns young between year 2 and 3", () => {
    expect(treeStageFromPlantingDate(new Date("2024-06-01"), now)).toBe("young");
  });

  it("returns established from year 3 onward", () => {
    expect(treeStageFromPlantingDate(new Date("2021-01-01"), now)).toBe("established");
  });

  it("treats a future planting date as seed", () => {
    expect(treeStageFromPlantingDate(new Date("2027-01-01"), now)).toBe("seed");
  });
});

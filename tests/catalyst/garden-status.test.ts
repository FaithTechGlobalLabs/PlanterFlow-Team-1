import { describe, it, expect } from "vitest";
import { buildGarden, daysSince, needsPresence } from "@/app/[locale]/catalyst/garden-status";

const now = new Date("2026-10-03T19:00:00Z");

const church = (id: string, pastor: string, name: string) => ({
  id,
  name,
  city: "Vancouver",
  planting_start_date: "2025-09-01",
  pastor_id: pastor,
});

const checkIn = (id: string, planter: string, support: string, created_at: string) => ({
  id,
  planter_id: planter,
  support,
  created_at,
});

const base = {
  churches: [church("c1", "p1", "Hope Church"), church("c2", "p2", "River Church")],
  pastors: [
    { id: "p1", display_name: "Daniel Park" },
    { id: "p2", display_name: "Jamie Lee" },
  ],
  objectives: [
    { id: "o1", planter_id: "p1" },
    { id: "o2", planter_id: "p2" },
  ],
  checkIns: [] as ReturnType<typeof checkIn>[],
  progress: [] as { objective_id: string; created_at: string }[],
  acknowledgedCheckInIds: [] as string[],
};

describe("buildGarden", () => {
  it("flags a support request until the Catalyst acknowledges that check-in", () => {
    const checkIns = [checkIn("ci1", "p1", "Pray for our family", "2026-10-03T16:00:00Z")];
    const [hope] = buildGarden({ ...base, checkIns }, now);
    expect(hope).toMatchObject({ churchName: "Hope Church", supportRequested: true, replyDue: true, checkInDue: false });

    const acknowledged = buildGarden({ ...base, checkIns, acknowledgedCheckInIds: ["ci1"] }, now).find(
      (c) => c.churchId === "c1",
    );
    expect(acknowledged).toMatchObject({ supportRequested: false, replyDue: false });
  });

  it("does not count an acknowledgement of an older check-in as reviewing the latest", () => {
    const [hope] = buildGarden(
      {
        ...base,
        checkIns: [
          checkIn("old", "p1", "", "2026-09-30T16:00:00Z"),
          checkIn("new", "p1", "Need a venue", "2026-10-03T16:00:00Z"),
        ],
        acknowledgedCheckInIds: ["old"],
      },
      now,
    );
    expect(hope).toMatchObject({ supportRequested: true, replyDue: true });
  });

  it("puts a new check-in without a support request in the presence list for review", () => {
    const garden = buildGarden({ ...base, checkIns: [checkIn("ci1", "p1", "", "2026-10-03T16:00:00Z")] }, now);
    const hope = garden.find((c) => c.churchId === "c1")!;
    expect(hope).toMatchObject({ supportRequested: false, checkInDue: false, replyDue: true });
    expect(needsPresence(hope)).toBe(true);
  });

  it("marks a check-in due after a quiet week or when there has never been one", () => {
    const garden = buildGarden({ ...base, checkIns: [checkIn("ci1", "p1", "", "2026-09-20T16:00:00Z")] }, now);
    expect(garden.find((c) => c.churchId === "c1")?.checkInDue).toBe(true);
    expect(garden.find((c) => c.churchId === "c2")?.checkInDue).toBe(true);
  });

  it("uses progress entries and check-ins, not objective edits, for last activity", () => {
    const river = buildGarden(
      {
        ...base,
        checkIns: [checkIn("ci1", "p2", "", "2026-10-01T16:00:00Z")],
        progress: [{ objective_id: "o2", created_at: "2026-10-02T16:00:00Z" }],
      },
      now,
    ).find((c) => c.churchId === "c2");
    expect(river?.lastActivityAt).toBe("2026-10-02T16:00:00Z");
  });

  it("lists churches needing support first", () => {
    const garden = buildGarden(
      {
        ...base,
        checkIns: [
          checkIn("a", "p1", "", "2026-10-03T16:00:00Z"),
          checkIn("b", "p2", "Need volunteers", "2026-10-03T16:00:00Z"),
        ],
        acknowledgedCheckInIds: ["a"],
      },
      now,
    );
    expect(garden.map((c) => c.churchName)).toEqual(["River Church", "Hope Church"]);
    expect(garden.filter(needsPresence).map((c) => c.churchName)).toEqual(["River Church"]);
  });

  it("derives the tree stage from the planting start date", () => {
    const [hope] = buildGarden(base, now);
    expect(hope.stage).toBe("sapling");
  });
});

describe("daysSince", () => {
  it("returns whole days and never goes negative", () => {
    expect(daysSince("2026-09-26T19:00:00Z", now)).toBe(7);
    expect(daysSince("2026-10-04T19:00:00Z", now)).toBe(0);
  });
});

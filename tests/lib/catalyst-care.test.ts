import { describe, it, expect } from "vitest";
import { catalystCareThisMonth } from "@/lib/catalyst-care";
const now = new Date("2026-10-04T12:00:00Z");
describe("factual monthly Catalyst care", () => {
  it("uses authenticated actors, unique IDs, UTC month and authorized objective ownership", () => {
    const response = {
      id: "r",
      author_id: "me",
      created_at: "2026-10-02T00:00:00Z",
      body: "A reply",
    };
    const result = catalystCareThisMonth({
      viewerId: "me",
      now,
      objectives: [{ id: "o", planter_id: "p" }],
      progress: [
        {
          id: "p",
          objective_id: "o",
          created_at: "2026-10-03T00:00:00Z",
          note: "A step",
        },
        {
          id: "private",
          objective_id: "not supplied",
          created_at: "2026-10-03T00:00:00Z",
          note: "Unrelated",
        },
      ],
      responses: [
        response,
        response,
        { ...response, id: "other", author_id: "other" },
        { ...response, id: "old", created_at: "2026-09-30T23:59:59Z" },
        { ...response, id: "future", created_at: "2026-10-05T00:00:00Z" },
        { ...response, id: "empty", body: " " },
      ],
    });
    expect(result).toEqual({
      period: "2026-10",
      churchesWithProgress: 1,
      ownResponses: 1,
    });
  });
  it("does not infer contribution from assignment or blank progress", () => {
    expect(
      catalystCareThisMonth({
        viewerId: "me",
        now,
        objectives: [{ id: "o", planter_id: "p" }],
        progress: [
          {
            id: "p",
            objective_id: "o",
            created_at: now.toISOString(),
            note: " ",
          },
        ],
        responses: [],
      }),
    ).toMatchObject({ churchesWithProgress: 0, ownResponses: 0 });
  });
});

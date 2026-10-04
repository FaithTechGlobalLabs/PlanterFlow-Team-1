import { describe, it, expect, vi, beforeEach } from "vitest";

type Insert = { table: string; payload: unknown };

const mocks = vi.hoisted(() => ({
  session: { user: { id: "catalyst-1" }, profile: { role: "catalyst" } } as {
    user: { id: string } | null;
    profile: { role: string } | null;
  },
  objectiveVisible: true,
  assigned: true,
  checkInBelongs: true,
  insertError: null as null | { code: string },
  inserts: [] as Insert[],
  refresh: vi.fn(),
}));

vi.mock("next/cache", () => ({ refresh: mocks.refresh }));
vi.mock("@/lib/auth/session", () => ({ getSessionProfile: async () => mocks.session }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from(table: string) {
      const result = () => {
        if (table === "objectives") return mocks.objectiveVisible ? { id: "o1", planter_id: "p1" } : null;
        if (table === "churches") return mocks.assigned ? { id: "c1" } : null;
        if (table === "check_ins") return mocks.checkInBelongs ? { id: "ci1" } : null;
        return null;
      };
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => ({ data: result() }),
        insert: async (payload: unknown) => {
          mocks.inserts.push({ table, payload });
          return { error: mocks.insertError };
        },
      };
      return builder;
    },
  }),
}));

import { acknowledgeCheckIn, sendReply } from "@/app/[locale]/catalyst/planters/[id]/actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  mocks.session = { user: { id: "catalyst-1" }, profile: { role: "catalyst" } };
  mocks.objectiveVisible = true;
  mocks.assigned = true;
  mocks.checkInBelongs = true;
  mocks.insertError = null;
  mocks.inserts = [];
  mocks.refresh.mockClear();
});

describe("sendReply", () => {
  it("saves the reply with the session user as author", async () => {
    const result = await sendReply({}, form({ objectiveId: "o1", body: "  Praying for you.  ", author_id: "someone-else" }));
    expect(result).toEqual({ ok: true });
    expect(mocks.inserts).toEqual([
      {
        table: "dialogue_messages",
        payload: { objective_id: "o1", author_id: "catalyst-1", body: "Praying for you.", check_in_id: null },
      },
    ]);
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("refuses an objective the Catalyst can't see", async () => {
    mocks.objectiveVisible = false;
    const result = await sendReply({}, form({ objectiveId: "foreign", body: "Hello" }));
    expect(result).toEqual({ error: "not_found", body: "Hello" });
    expect(mocks.inserts).toEqual([]);
  });

  it("refuses a church assigned to another Catalyst", async () => {
    mocks.assigned = false;
    const result = await sendReply({}, form({ objectiveId: "o1", body: "Hello" }));
    expect(result.error).toBe("not_found");
    expect(mocks.inserts).toEqual([]);
  });

  it("refuses planters", async () => {
    mocks.session = { user: { id: "planter-1" }, profile: { role: "planter" } };
    const result = await sendReply({}, form({ objectiveId: "o1", body: "Hello" }));
    expect(result.error).toBe("forbidden");
    expect(mocks.inserts).toEqual([]);
  });

  it("rejects an empty reply without writing", async () => {
    const result = await sendReply({}, form({ objectiveId: "o1", body: "   " }));
    expect(result.error).toBe("reply_required");
    expect(mocks.inserts).toEqual([]);
  });

  it("keeps the text when saving fails", async () => {
    mocks.insertError = { code: "42501" };
    const result = await sendReply({}, form({ objectiveId: "o1", body: "Hello" }));
    expect(result).toEqual({ error: "send_failed", body: "Hello" });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

describe("acknowledgeCheckIn", () => {
  it("posts the support note into the goal conversation, linked to the check-in", async () => {
    const result = await acknowledgeCheckIn({}, form({ checkInId: "ci1", objectiveId: "o1", body: "Thank you — I'll call this week." }));
    expect(result).toEqual({ ok: true });
    expect(mocks.inserts).toEqual([
      {
        table: "dialogue_messages",
        payload: {
          objective_id: "o1",
          author_id: "catalyst-1",
          body: "Thank you — I'll call this week.",
          check_in_id: "ci1",
        },
      },
    ]);
  });

  it("refuses a check-in from a different pastor", async () => {
    mocks.checkInBelongs = false;
    const result = await acknowledgeCheckIn({}, form({ checkInId: "other", objectiveId: "o1", body: "Hi" }));
    expect(result.error).toBe("not_found");
    expect(mocks.inserts).toEqual([]);
  });
});

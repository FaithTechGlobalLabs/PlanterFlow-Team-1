import { describe, it, expect, vi, beforeEach } from "vitest";

type Query = {
  table: string;
  op: "select" | "insert" | "update" | "delete";
  payload?: unknown;
  filters: [string, unknown][];
};
type Result = { data?: unknown; error?: { code?: string } | null; count?: number | null };

const mocks = vi.hoisted(() => ({
  profile: null as null | { role: string; org_id: string },
  respond: (() => ({ data: null, error: null })) as (q: Query) => Result,
  calls: [] as Query[],
  refresh: vi.fn(),
}));

vi.mock("next/cache", () => ({ refresh: mocks.refresh }));
vi.mock("@/lib/auth/session", () => ({
  getSessionProfile: async () => ({ user: mocks.profile && { id: "u1" }, profile: mocks.profile }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from(table: string) {
      const q: Query = { table, op: "select", filters: [] };
      mocks.calls.push(q);
      const settle = () => Promise.resolve(mocks.respond(q));
      const builder = {
        select: () => builder,
        insert: (payload: unknown) => ((q.op = "insert"), (q.payload = payload), builder),
        update: (payload: unknown) => ((q.op = "update"), (q.payload = payload), builder),
        delete: () => ((q.op = "delete"), builder),
        eq: (column: string, value: unknown) => (q.filters.push([column, value]), builder),
        order: () => builder,
        limit: () => builder,
        maybeSingle: settle,
        then: (ok: (r: Result) => unknown, fail: (e: unknown) => unknown) => settle().then(ok, fail),
      };
      return builder;
    },
  }),
}));

import {
  addCategory,
  deleteCategory,
  moveCategory,
  updateCategory,
} from "@/app/[locale]/catalyst/categories/actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const writes = () => mocks.calls.filter((q) => q.op !== "select");

beforeEach(() => {
  mocks.profile = { role: "catalyst", org_id: "org-a" };
  mocks.respond = () => ({ data: null, error: null });
  mocks.calls = [];
  mocks.refresh.mockClear();
});

describe("addCategory", () => {
  it("uses the session organization and appends after the last category", async () => {
    mocks.respond = (q) => (q.op === "select" ? { data: { sort_order: 3 } } : { error: null });

    const result = await addCategory({}, form({ title: "Serve the City", org_id: "org-b" }));

    expect(result).toEqual({ ok: true });
    expect(writes()).toEqual([
      expect.objectContaining({
        op: "insert",
        payload: { org_id: "org-a", title: "Serve the City", description: null, sort_order: 4 },
      }),
    ]);
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("refuses planters without writing", async () => {
    mocks.profile = { role: "planter", org_id: "org-a" };
    const result = await addCategory({}, form({ title: "Mine" }));
    expect(result.error).toBe("forbidden");
    expect(writes()).toEqual([]);
  });

  it("returns what was typed when validation fails", async () => {
    const result = await addCategory({}, form({ title: "", description: "Keep me" }));
    expect(result).toEqual({ error: "title_required", values: { title: "", description: "Keep me" } });
    expect(mocks.calls).toEqual([]);
  });

  it("keeps the typed values when the insert fails", async () => {
    mocks.respond = (q) => (q.op === "insert" ? { error: { code: "XX000" } } : { data: null });
    const result = await addCategory({}, form({ title: "Serve the City" }));
    expect(result).toEqual({ error: "save_failed", values: { title: "Serve the City", description: null } });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

describe("updateCategory", () => {
  it("reports a category outside the organization as not found", async () => {
    mocks.respond = () => ({ data: [], error: null });
    const result = await updateCategory({}, form({ id: "foreign", title: "Renamed" }));
    expect(result.error).toBe("not_found");
  });
});

describe("deleteCategory", () => {
  it("blocks deleting a category that has objectives", async () => {
    mocks.respond = (q) => (q.table === "objectives" ? { count: 2, error: null } : { data: [] });
    const result = await deleteCategory({}, form({ id: "engage" }));
    expect(result.error).toBe("in_use");
    expect(writes()).toEqual([]);
  });

  it("refuses to delete the prayer category", async () => {
    mocks.respond = (q) =>
      q.table === "objective_categories" && q.op === "select" ? { data: { kind: "prayer" } } : { count: 0, data: [] };
    const result = await deleteCategory({}, form({ id: "prayer" }));
    expect(result.error).toBe("prayer_protected");
    expect(writes()).toEqual([]);
  });

  it("treats a foreign-key violation as in use", async () => {
    mocks.respond = (q) =>
      q.table === "objectives" ? { count: 0, error: null } : { data: null, error: { code: "23503" } };
    const result = await deleteCategory({}, form({ id: "engage" }));
    expect(result.error).toBe("in_use");
  });

  it("deletes an unused category", async () => {
    mocks.respond = (q) =>
      q.table === "objectives" ? { count: 0, error: null } : { data: [{ id: "spare" }], error: null };
    const result = await deleteCategory({}, form({ id: "spare" }));
    expect(result).toEqual({ ok: true });
    expect(writes()).toEqual([expect.objectContaining({ op: "delete", filters: [["id", "spare"]] })]);
  });
});

describe("moveCategory", () => {
  it("swaps neighbours even when stored positions are duplicated", async () => {
    mocks.respond = (q) =>
      q.op === "select"
        ? {
            data: [
              { id: "a", sort_order: 1 },
              { id: "b", sort_order: 1 },
              { id: "c", sort_order: 1 },
            ],
          }
        : { error: null };

    const result = await moveCategory({}, form({ id: "c", direction: "up" }));

    expect(result).toEqual({ ok: true });
    expect(writes().map((q) => [q.filters[0][1], q.payload])).toEqual([
      ["c", { sort_order: 2 }],
      ["b", { sort_order: 3 }],
    ]);
  });

  it("does nothing when the first category moves up", async () => {
    mocks.respond = (q) => (q.op === "select" ? { data: [{ id: "a", sort_order: 1 }] } : { error: null });
    const result = await moveCategory({}, form({ id: "a", direction: "up" }));
    expect(result).toEqual({ ok: true });
    expect(writes()).toEqual([]);
  });
});

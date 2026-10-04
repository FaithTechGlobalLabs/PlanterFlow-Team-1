import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  session: {
    user: { id: "catalyst-1" },
    profile: { role: "catalyst", is_admin: false, org_id: "org-1" },
  } as {
    user: { id: string } | null;
    profile: { role: string; is_admin?: boolean; org_id?: string } | null;
  },
  planter: { id: "planter-1", display_name: "Alex Pastor", role: "planter", org_id: "org-1" } as any,
  church: { name: "Grace Church", city: "Vancouver", planting_start_date: "2025-01-01" } as any,
  categories: [{ id: "cat-1", title: "Discipleship", sort_order: 1 }],
  objectives: [
    {
      id: "obj-1",
      title: "Launch Life Groups",
      description: "Multiply small groups",
      category_id: "cat-1",
      cadence: "weekly",
      status: "active",
      created_at: "2026-01-01",
    },
  ],
  checkIns: [
    {
      id: "ci-1",
      note: "Good week overall",
      feeling: "hopeful",
      momentum: "building",
      support: "Prayer for leaders",
      created_at: "2026-02-01",
    },
  ],
  progress: [{ objective_id: "obj-1", note: "3 new leaders trained", value: 3, created_at: "2026-02-02" }],
  messages: [{ id: "msg-1", objective_id: "obj-1", author_id: "catalyst-1", body: "Great progress!", created_at: "2026-02-03" }],
  authors: [{ id: "catalyst-1", display_name: "Coach Olivia" }],
  assignedChurch: { id: "c1" } as any,
}));

vi.mock("@/lib/auth/session", () => ({
  getSessionProfile: async () => mocks.session,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from(table: string) {
      const builder = {
        select: () => builder,
        eq: (_col: string, val: any) => {
          if (table === "profiles" && val === "planter-1") {
            return { maybeSingle: async () => ({ data: mocks.planter }) };
          }
          if (table === "churches" && val === "planter-1") {
            return {
              maybeSingle: async () => ({ data: mocks.assignedChurch ? mocks.church : null }),
              eq: () => builder,
            };
          }
          return builder;
        },
        in: () => builder,
        order: () => builder,
        maybeSingle: async () => {
          if (table === "profiles") return { data: mocks.planter };
          if (table === "churches") return { data: mocks.assignedChurch ? mocks.church : null };
          return { data: null };
        },
        then: (resolve: any) => {
          if (table === "objective_categories") resolve({ data: mocks.categories });
          else if (table === "objectives") resolve({ data: mocks.objectives });
          else if (table === "check_ins") resolve({ data: mocks.checkIns });
          else if (table === "progress_entries") resolve({ data: mocks.progress });
          else if (table === "dialogue_messages") resolve({ data: mocks.messages });
          else if (table === "profiles") resolve({ data: mocks.authors });
          else resolve({ data: [] });
        },
      };
      return builder;
    },
  }),
}));

import { GET } from "@/app/api/export/planter/[id]/route";

beforeEach(() => {
  mocks.session = {
    user: { id: "catalyst-1" },
    profile: { role: "catalyst", is_admin: false, org_id: "org-1" },
  };
  mocks.planter = { id: "planter-1", display_name: "Alex Pastor", role: "planter", org_id: "org-1" };
  mocks.assignedChurch = { id: "c1" };
});

describe("GET /api/export/planter/[id]", () => {
  it("denies unauthenticated requests", async () => {
    mocks.session = { user: null, profile: null };
    const req = new Request("http://localhost/api/export/planter/planter-1");
    const res = await GET(req, { params: Promise.resolve({ id: "planter-1" }) });
    expect(res.status).toBe(401);
  });

  it("denies access if Catalyst is not assigned to planter's church", async () => {
    mocks.assignedChurch = null;
    const req = new Request("http://localhost/api/export/planter/planter-1");
    const res = await GET(req, { params: Promise.resolve({ id: "planter-1" }) });
    expect(res.status).toBe(403);
  });

  it("allows assigned Catalyst and returns JSON data format when requested", async () => {
    const req = new Request("http://localhost/api/export/planter/planter-1?format=json");
    const res = await GET(req, { params: Promise.resolve({ id: "planter-1" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.planter.name).toBe("Alex Pastor");
    expect(data.objectives.length).toBe(1);
    expect(data.objectives[0].title).toBe("Launch Life Groups");
  });

  it("renders printable HTML export for assigned Catalyst", async () => {
    const req = new Request("http://localhost/api/export/planter/planter-1");
    const res = await GET(req, { params: Promise.resolve({ id: "planter-1" }) });
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("Alex Pastor");
    expect(html).toContain("Grace Church");
    expect(html).toContain("FIRST FRUITS · AUTHORIZED PLANTER REPORT");
  });
});

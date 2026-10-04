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
  queryError: null as any,
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
            return {
              maybeSingle: async () =>
                mocks.queryError
                  ? { data: null, error: mocks.queryError }
                  : { data: mocks.planter, error: null },
            };
          }
          if (table === "churches" && val === "planter-1") {
            return {
              maybeSingle: async () =>
                mocks.queryError
                  ? { data: null, error: mocks.queryError }
                  : { data: mocks.assignedChurch ? mocks.church : null, error: null },
              eq: () => builder,
            };
          }
          return builder;
        },
        in: () => builder,
        order: () => builder,
        maybeSingle: async () => {
          if (mocks.queryError) return { data: null, error: mocks.queryError };
          if (table === "profiles") return { data: mocks.planter, error: null };
          if (table === "churches") return { data: mocks.assignedChurch ? mocks.church : null, error: null };
          return { data: null, error: null };
        },
        then: (resolve: any) => {
          if (mocks.queryError) {
            resolve({ data: null, error: mocks.queryError });
            return;
          }
          if (table === "objective_categories") resolve({ data: mocks.categories, error: null });
          else if (table === "objectives") resolve({ data: mocks.objectives, error: null });
          else if (table === "check_ins") resolve({ data: mocks.checkIns, error: null });
          else if (table === "progress_entries") resolve({ data: mocks.progress, error: null });
          else if (table === "dialogue_messages") resolve({ data: mocks.messages, error: null });
          else if (table === "profiles") resolve({ data: mocks.authors, error: null });
          else resolve({ data: [], error: null });
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
  mocks.queryError = null;
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

  it("denies access to an unassigned admin user", async () => {
    mocks.session = {
      user: { id: "admin-1" },
      profile: { role: "catalyst", is_admin: true, org_id: "org-1" },
    };
    mocks.assignedChurch = null;
    const req = new Request("http://localhost/api/export/planter/planter-1");
    const res = await GET(req, { params: Promise.resolve({ id: "planter-1" }) });
    expect(res.status).toBe(403);
  });

  it("allows access to the planter themselves (self-export)", async () => {
    mocks.session = {
      user: { id: "planter-1" },
      profile: { role: "planter", org_id: "org-1" },
    };
    mocks.assignedChurch = null;
    const req = new Request("http://localhost/api/export/planter/planter-1?format=json");
    const res = await GET(req, { params: Promise.resolve({ id: "planter-1" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.planter.id).toBe("planter-1");
    expect(data.categoryGroups.length).toBe(1);
    expect(data.categoryGroups[0].categoryTitle).toBe("Discipleship");
  });

  it("supports route alignment ending in .pdf", async () => {
    const req = new Request("http://localhost/api/export/planter/planter-1.pdf?format=json");
    const res = await GET(req, { params: Promise.resolve({ id: "planter-1.pdf" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.planter.id).toBe("planter-1");
  });

  it("allows assigned Catalyst and returns JSON data format when requested", async () => {
    const req = new Request("http://localhost/api/export/planter/planter-1?format=json");
    const res = await GET(req, { params: Promise.resolve({ id: "planter-1" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.planter.name).toBe("Alex Pastor");
    expect(data.categoryGroups[0].objectives[0].title).toBe("Launch Life Groups");
  });

  it("generates binary PDF export for assigned Catalyst", async () => {
    const req = new Request("http://localhost/api/export/planter/planter-1");
    const res = await GET(req, { params: Promise.resolve({ id: "planter-1" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain('filename="planter-report-planter-1.pdf"');

    const buffer = await res.arrayBuffer();
    const pdfHeader = new TextDecoder().decode(buffer.slice(0, 4));
    expect(pdfHeader).toBe("%PDF");
  });

  it("handles Supabase query failures and returns 500 error", async () => {
    mocks.queryError = { message: "Database connection failure", code: "500" };
    const req = new Request("http://localhost/api/export/planter/planter-1");
    const res = await GET(req, { params: Promise.resolve({ id: "planter-1" }) });
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe("Failed to fetch database records.");
  });
});

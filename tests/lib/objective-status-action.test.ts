import { beforeEach, describe, expect, it, vi } from "vitest";
import { OBJECTIVE_STATUSES } from "@/lib/workspace/objective-status";

const mocks = vi.hoisted(() => ({ session: vi.fn(), client: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSessionProfile: mocks.session }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/workspace/conversation", () => ({ postThreadMessage: vi.fn(), updateThreadStatus: vi.fn() }));
import { saveWorkspace } from "@/app/[locale]/dashboard/actions";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const id = "33333333-3333-4333-8333-333333333333";
let update = vi.fn();
let eq = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: owner }, profile: { id: owner, role: "planter", org_id: other } });
  const query: Record<string, unknown> = {};
  eq = vi.fn(() => query);
  update = vi.fn(() => query);
  Object.assign(query, { eq, update, select: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data: { id, planter_id: owner, title: "Goal", team_visible: true }, error: null })),
    single: vi.fn(async () => ({ data: { id }, error: null })),
  });
  mocks.client.mockResolvedValue({ from: vi.fn(() => query) });
});
function form(status: string) {
  const value = new FormData();
  value.set("intent", "objective_status"); value.set("objective_id", id); value.set("status", status);
  return value;
}
describe("objective status authorization", () => {
  it.each(OBJECTIVE_STATUSES)("allows owner to save %s, scoped to their id", async status => {
    expect(await saveWorkspace(form(status))).toEqual({ ok: true, id });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status }));
    expect(eq).toHaveBeenCalledWith("planter_id", owner);
  });
  it.each(["peer", "catalyst"])("rejects %s before updating", async role => {
    mocks.session.mockResolvedValue({ user: { id: other }, profile: { id: other, role, org_id: other } });
    expect((await saveWorkspace(form("complete"))).ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
  it("rejects another planter", async () => {
    mocks.session.mockResolvedValue({ user: { id: other }, profile: { id: other, role: "planter", org_id: other } });
    expect((await saveWorkspace(form("complete"))).ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
  it.each(["active", "paused", "done", "invalid"])("rejects obsolete/invalid write %s", async status => {
    expect((await saveWorkspace(form(status))).ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});

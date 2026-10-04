import { describe, it, expect, vi } from "vitest";
import { acceptInvitationForUser, deliverInvitation } from "@/lib/invitation-engine";
import { validateInviteTeam } from "@/lib/validation/onboarding";

const future = new Date(Date.now() + 86_400_000).toISOString();
const peerInvite = {
  id: "inv1", email: "Team@Example.com", role: "peer", church_id: "church1",
  org_id: "org1", is_admin: false, accepted_at: null, expires_at: future,
};

// Minimal chainable stand-in for the Supabase admin client.
function fakeAdmin(opts: { invitation?: unknown; claimed?: boolean; profileError?: boolean; memberError?: boolean }) {
  const calls: { table: string; op: string; payload?: unknown }[] = [];
  const from = (table: string) => {
    let op = "select";
    let payload: unknown;
    const chain: Record<string, unknown> = {};
    const self = () => chain;
    Object.assign(chain, {
      select: () => { if (op === "select") op = "select"; return chain; },
      eq: self, is: self,
      insert: (p: unknown) => { op = "insert"; payload = p; calls.push({ table, op, payload }); return chain; },
      update: (p: unknown) => { op = "update"; payload = p; calls.push({ table, op, payload }); return chain; },
      delete: () => { op = "delete"; calls.push({ table, op }); return chain; },
      maybeSingle: async () =>
        table === "invitations" && op === "update"
          ? { data: opts.claimed === false ? null : { id: "inv1" } }
          : { data: opts.invitation ?? null },
      then: (res: (v: unknown) => unknown) =>
        res({ error: (table === "profiles" && op === "insert" && opts.profileError) || (table === "church_memberships" && opts.memberError) ? { message: "x" } : null }),
    });
    return chain;
  };
  return { admin: { from } as never, calls };
}

const base = { token: "t", user: { id: "u1", email: "team@example.com" }, name: "Sam", locale: "en", password: "password1", roles: ["peer"], setPassword: async () => true };

describe("acceptInvitationForUser", () => {
  it("creates profile and church membership from invitation values, then accepts once", async () => {
    const { admin, calls } = fakeAdmin({ invitation: peerInvite });
    const result = await acceptInvitationForUser({ ...base, admin });
    expect(result).toEqual({ ok: true, invitation: { role: "peer", church_id: "church1" } });
    expect(calls.find((c) => c.table === "profiles")?.payload).toMatchObject({ role: "peer", org_id: "org1", is_admin: false });
    expect(calls.find((c) => c.table === "church_memberships")?.payload).toEqual({ church_id: "church1", user_id: "u1", role: "peer" });
  });

  it("rejects a session whose email differs from the invitation", async () => {
    const { admin } = fakeAdmin({ invitation: peerInvite });
    expect(await acceptInvitationForUser({ ...base, admin, user: { id: "u2", email: "other@example.com" } })).toEqual({ error: "session" });
  });

  it("rejects wrong roles, expired, accepted, and church-less team invitations", async () => {
    for (const inv of [
      { ...peerInvite, role: "planter" },
      { ...peerInvite, expires_at: "2020-01-01T00:00:00Z" },
      { ...peerInvite, accepted_at: "2026-01-01T00:00:00Z" },
      { ...peerInvite, church_id: null },
      null,
    ]) {
      const { admin } = fakeAdmin({ invitation: inv });
      expect(await acceptInvitationForUser({ ...base, admin })).toEqual({ error: "unavailable" });
    }
  });

  it("refuses a second concurrent acceptance when the claim fails", async () => {
    const { admin, calls } = fakeAdmin({ invitation: peerInvite, claimed: false });
    expect(await acceptInvitationForUser({ ...base, admin })).toEqual({ error: "unavailable" });
    expect(calls.some((c) => c.table === "profiles")).toBe(false);
  });

  it("rolls back the profile and the claim when membership creation fails", async () => {
    const { admin, calls } = fakeAdmin({ invitation: peerInvite, memberError: true });
    expect(await acceptInvitationForUser({ ...base, admin })).toEqual({ error: "generic" });
    expect(calls.some((c) => c.table === "profiles" && c.op === "delete")).toBe(true);
    expect(calls.filter((c) => c.table === "invitations" && c.op === "update").pop()?.payload).toEqual({ accepted_at: null });
  });
});

describe("deliverInvitation", () => {
  const input = (inviteUserByEmail: unknown, generateLink?: unknown) => ({
    admin: { from: () => ({ delete: () => ({ eq: async () => ({}) }) }), auth: { admin: { inviteUserByEmail, generateLink } } } as never,
    invitation: { id: "i", token: "t" }, email: "a@b.co", redirectTo: "http://x", data: {}, appLink: "http://app/en/team-invite/t", errorNamespace: "inviteTeam", logTag: "t",
  });

  it("succeeds when the invite email sends", async () => {
    expect(await deliverInvitation(input(vi.fn().mockResolvedValue({ error: null })))).toEqual({ ok: true });
  });

  it("falls back to the reusable app link when the email fails", async () => {
    const r = await deliverInvitation(input(vi.fn().mockResolvedValue({ error: { code: "over_email_send_rate_limit", message: "rate limit" } })));
    expect(r).toEqual({ inviteLink: "http://app/en/team-invite/t", email: "a@b.co" });
  });

  it("maps an existing account to a translated error", async () => {
    expect(await deliverInvitation(input(vi.fn().mockResolvedValue({ error: { message: "already been registered" } })))).toEqual({ error: "inviteTeam.errors.exists" });
  });
});

describe("validateInviteTeam", () => {
  it("normalizes email and rejects invalid ones", () => {
    const ok = new FormData(); ok.set("email", " Team@Example.com "); ok.set("welcomeNote", " hi ");
    expect(validateInviteTeam(ok)).toEqual({ values: { email: "team@example.com", welcomeNote: "hi" } });
    const bad = new FormData(); bad.set("email", "nope");
    expect(validateInviteTeam(bad)).toEqual({ error: "inviteTeam.errors.email" });
  });
});

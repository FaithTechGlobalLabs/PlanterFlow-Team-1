import { describe, it, expect } from "vitest";
import { buildInviteStatuses, INVITES_SHOWN } from "@/app/[locale]/catalyst/invite-status";

const now = new Date("2026-10-03T20:00:00Z");

const row = (id: string, created_at: string, extra: { accepted_at?: string; expires_at?: string } = {}) => ({
  id,
  email: `${id}@example.com`,
  church_name: null,
  accepted_at: extra.accepted_at ?? null,
  expires_at: extra.expires_at ?? "2026-10-10T20:00:00Z",
  created_at,
});

describe("buildInviteStatuses", () => {
  it("labels pending, accepted and expired invitations", () => {
    const [pending, expired, accepted] = buildInviteStatuses(
      [
        row("accepted", "2026-10-03T10:00:00Z", { accepted_at: "2026-10-03T11:00:00Z" }),
        row("expired", "2026-09-20T10:00:00Z", { expires_at: "2026-09-27T10:00:00Z" }),
        row("pending", "2026-10-03T09:00:00Z"),
      ],
      now,
    );
    expect([pending.status, expired.status, accepted.status]).toEqual(["pending", "expired", "accepted"]);
  });

  it("lists pending first, newest first within a status", () => {
    const list = buildInviteStatuses(
      [row("old", "2026-10-01T09:00:00Z"), row("new", "2026-10-03T09:00:00Z")],
      now,
    );
    expect(list.map((i) => i.id)).toEqual(["new", "old"]);
  });

  it("shows at most the newest invitations", () => {
    const rows = Array.from({ length: INVITES_SHOWN + 5 }, (_, i) =>
      row(`i${i}`, `2026-10-03T${String(i).padStart(2, "0")}:00:00Z`),
    );
    expect(buildInviteStatuses(rows, now)).toHaveLength(INVITES_SHOWN);
  });
});

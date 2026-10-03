import { describe, it, expect } from "vitest";
import { invitationStatus } from "@/lib/invitations";

const now = new Date("2026-10-03T12:00:00Z");

describe("invitationStatus", () => {
  it("is valid when unaccepted and before expiry", () => {
    expect(
      invitationStatus({ accepted_at: null, expires_at: "2026-10-09T12:00:00Z" }, now)
    ).toBe("valid");
  });

  it("is expired once expires_at has passed", () => {
    expect(
      invitationStatus({ accepted_at: null, expires_at: "2026-10-02T12:00:00Z" }, now)
    ).toBe("expired");
  });

  it("is accepted when accepted_at is set, even before expiry", () => {
    expect(
      invitationStatus(
        { accepted_at: "2026-10-01T12:00:00Z", expires_at: "2026-10-09T12:00:00Z" },
        now
      )
    ).toBe("accepted");
  });
});

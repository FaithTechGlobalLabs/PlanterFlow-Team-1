import { describe, it, expect, vi } from "vitest";
import { generateInviteLink } from "@/lib/invite-link";

function adminWith(result: { data: unknown; error: unknown }) {
  const generateLink = vi.fn().mockResolvedValue(result);
  return { admin: { auth: { admin: { generateLink } } } as never, generateLink };
}

describe("generateInviteLink", () => {
  it("returns the action link without sending mail", async () => {
    const { admin, generateLink } = adminWith({
      data: { properties: { action_link: "https://x.supabase.co/verify?token=t" } },
      error: null,
    });

    const link = await generateInviteLink(admin, "a@b.co", "http://app/en/invite/tok", {
      invitation_token: "tok",
    });

    expect(link).toBe("https://x.supabase.co/verify?token=t");
    expect(generateLink).toHaveBeenCalledWith({
      type: "invite",
      email: "a@b.co",
      options: { redirectTo: "http://app/en/invite/tok", data: { invitation_token: "tok" } },
    });
  });

  it("returns null when Supabase refuses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { admin } = adminWith({ data: null, error: { code: "x", message: "nope" } });

    expect(await generateInviteLink(admin, "a@b.co", "http://app", {})).toBeNull();
  });
});

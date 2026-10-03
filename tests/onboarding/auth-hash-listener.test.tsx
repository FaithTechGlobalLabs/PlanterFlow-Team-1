import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const replace = vi.fn();
const setSession = vi.fn();

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { setSession } }),
}));

import { AuthHashListener } from "@/components/auth-hash-listener";

describe("AuthHashListener", () => {
  beforeEach(() => {
    replace.mockReset();
    setSession.mockReset();
    window.location.hash = "";
  });

  it("sets the session from an invite hash, then goes home", async () => {
    setSession.mockResolvedValue({ error: null });
    window.location.hash =
      "#access_token=acc123&expires_in=3600&refresh_token=ref456&type=invite";

    render(<AuthHashListener />);

    await waitFor(() =>
      expect(setSession).toHaveBeenCalledWith({
        access_token: "acc123",
        refresh_token: "ref456",
      })
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("sends an expired-link hash to the unavailable page", () => {
    window.location.hash = "#error=access_denied&error_code=otp_expired";

    render(<AuthHashListener />);

    expect(replace).toHaveBeenCalledWith("/invite/unavailable");
    expect(setSession).not.toHaveBeenCalled();
  });

  it("does nothing when the hash has no tokens", () => {
    render(<AuthHashListener />);

    expect(setSession).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("strips tokens from history and keeps recovery out of onboarding", async () => {
    setSession.mockResolvedValue({ error: null });
    window.location.hash = "#access_token=acc123&refresh_token=ref456&type=recovery";
    render(<AuthHashListener />);
    expect(window.location.hash).toBe("");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/recover/update"));
  });

  it("sends the user to the unavailable page if the session cannot be set", async () => {
    setSession.mockResolvedValue({ error: new Error("bad token") });
    window.location.hash = "#access_token=acc123&refresh_token=ref456";

    render(<AuthHashListener />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/invite/unavailable"));
  });
});

// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser } }),
}));

import { proxy } from "@/proxy";

const call = (path: string) =>
  proxy(new NextRequest(new URL(path, "http://localhost:3000")));

describe("proxy: non-localized invitation routes (#55)", () => {
  it.each(["/invite/welcome", "/invite/abc123token", "/invite"])(
    "passes %s through without a locale redirect or auth lookup",
    async (path) => {
      getUser.mockClear();
      const res = await call(path);
      expect(res.headers.get("location")).toBeNull();
      expect(res.headers.get("x-middleware-next")).toBe("1");
      expect(getUser).not.toHaveBeenCalled();
    }
  );
});

describe("proxy: localized routes", () => {
  it("still redirects /invite-pastor to the default locale", async () => {
    const res = await call("/invite-pastor");
    expect(res.headers.get("location")).toContain("/en/invite-pastor");
  });

  it("keeps /en/invite/<token> public for signed-out users", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await call("/en/invite/abc123token");
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects signed-out users from protected pages to login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await call("/en");
    expect(res.headers.get("location")).toContain("/en/login");
  });
});

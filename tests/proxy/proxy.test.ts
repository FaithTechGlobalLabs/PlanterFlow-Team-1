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

describe("proxy: legacy non-localized invite links", () => {
  it.each([
    ["/invite/abc123token", "/en/invite/abc123token"],
    ["/invite/welcome", "/en/invite/welcome"],
    ["/invite", "/en/invite"],
    ["/invite-pastor", "/en/invite-pastor"],
  ])("redirects %s to %s", async (from, to) => {
    const res = await call(from);
    expect(new URL(res.headers.get("location")!).pathname).toBe(to);
  });
});

describe("proxy: localized routes", () => {
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

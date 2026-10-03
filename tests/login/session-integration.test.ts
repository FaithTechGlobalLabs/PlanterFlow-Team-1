import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const auth = vi.hoisted(() => ({ user: null as { id: string } | null }));
vi.mock("next-intl/middleware", () => ({
  default: () => (request: NextRequest) => NextResponse.next({ request: { headers: request.headers } }),
}));
vi.mock("@/i18n/routing", () => ({ routing: { locales: ["en"], defaultLocale: "en" } }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (values: unknown[], headers: Record<string, string>) => void } }) => ({
    auth: { getUser: async () => {
      options.cookies.setAll([{ name: "sb-test-session", value: "refreshed", options: { path: "/" } }], { "Cache-Control": "private, no-store" });
      return { data: { user: auth.user } };
    } },
  }),
}));

import { proxy } from "@/proxy";

describe("session refresh and route redirects", () => {
  beforeEach(() => {
    auth.user = null;
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
  });

  it("preserves refreshed cookies when redirecting a signed-out user", async () => {
    const response = await proxy(new NextRequest("http://localhost:3000/en"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/en/login");
    expect(response.cookies.get("sb-test-session")?.value).toBe("refreshed");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("preserves refreshed cookies when redirecting an authenticated login", async () => {
    auth.user = { id: "member" };
    const response = await proxy(new NextRequest("http://localhost:3000/en/login"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/en");
    expect(response.cookies.get("sb-test-session")?.value).toBe("refreshed");
  });

  it("forwards the fresh cookie to the downstream page", async () => {
    auth.user = { id: "member" };
    const response = await proxy(new NextRequest("http://localhost:3000/en"));
    expect(response.headers.get("x-middleware-request-cookie")).toContain("sb-test-session=refreshed");
  });

  it("allows password recovery and leaves callback handling to the route", async () => {
    const recovery = await proxy(new NextRequest("http://localhost:3000/en/recover/update"));
    expect(recovery.headers.get("location")).toBeNull();
    const callback = await proxy(new NextRequest("http://localhost:3000/auth/callback?code=example"));
    expect(callback.headers.get("location")).toBeNull();
    expect(callback.cookies.get("sb-test-session")).toBeUndefined();
  });
});

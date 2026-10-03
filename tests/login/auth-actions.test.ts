import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), reset: vi.fn(), update: vi.fn(), user: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: {
  signInWithPassword: mocks.signIn, resetPasswordForEmail: mocks.reset,
  updateUser: mocks.update, getUser: mocks.user,
} }) }));
vi.mock("next-intl/server", () => ({ getLocale: async () => "en" }));
vi.mock("@/i18n/routing", () => ({ redirect: mocks.redirect }));
import { signIn } from "@/app/[locale]/login/actions";
import { requestPasswordReset, updatePassword } from "@/app/[locale]/recover/actions";

function form(values: Record<string, string>) {
  const result = new FormData();
  Object.entries(values).forEach(([key, value]) => result.set(key, value));
  return result;
}

describe("auth actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://firstfruits.example");
  });
  it("uses a generic invalid-credentials response and never redirects on failure", async () => {
    mocks.signIn.mockResolvedValue({ error: { status: 400, code: "invalid_credentials" } });
    expect(await signIn({}, form({ email: "user@example.com", password: "wrong" }))).toEqual({ error: "login.errors.invalid" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("preserves the locale after successful sign-in", async () => {
    mocks.signIn.mockResolvedValue({ error: null });
    await signIn({}, form({ email: " user@example.com ", password: "secret" }));
    expect(mocks.signIn).toHaveBeenCalledWith({ email: "user@example.com", password: "secret" });
    expect(mocks.redirect).toHaveBeenCalledWith({ href: "/", locale: "en" });
  });
  it("handles network failures without exposing the underlying error", async () => {
    mocks.signIn.mockRejectedValue(new Error("internal connection details"));
    expect(await signIn({}, form({ email: "user@example.com", password: "secret" }))).toEqual({ error: "login.errors.generic" });
  });
  it("sends reset links only to the configured origin", async () => {
    mocks.reset.mockResolvedValue({ error: null });
    expect(await requestPasswordReset({}, form({ email: "user@example.com" }))).toEqual({ sent: true });
    expect(mocks.reset).toHaveBeenCalledWith("user@example.com", { redirectTo: "https://firstfruits.example/auth/callback?locale=en" });
  });
  it("does not change a password without a verified session", async () => {
    mocks.user.mockResolvedValue({ data: { user: null }, error: null });
    expect(await updatePassword({}, form({ password: "long-password", confirmPassword: "long-password" }))).toEqual({ error: "recover.errors.link" });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects mismatching passwords before querying Supabase", async () => {
    expect(await updatePassword({}, form({ password: "long-password", confirmPassword: "other-password" }))).toEqual({ error: "recover.errors.match" });
    expect(mocks.user).not.toHaveBeenCalled();
  });
});

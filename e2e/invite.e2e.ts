// End-to-end coverage for the invitation flow. Runs against the Supabase
// project in .env.local using throwaway users and invitations, all removed in
// afterEach. Start with `pnpm test:e2e` (reuses a running `pnpm dev`).
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const BC_ORG_ID = "00000000-0000-0000-0000-000000000001";
const BASE = "http://localhost:3000";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

let cleanup: { email: string; token: string } | null = null;

async function createInvitation(role: "catalyst" | "planter", isAdmin = false) {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const { data, error } = await admin
    .from("invitations")
    .insert({
      org_id: BC_ORG_ID,
      email,
      role,
      is_admin: isAdmin,
      invited_by: null,
      invited_by_name: "E2E Tester",
      church_name: role === "planter" ? "E2E Church" : null,
    })
    .select("token")
    .single();
  if (error) throw error;
  cleanup = { email, token: data.token };
  return { email, token: data.token as string };
}

// Same thing the invite email does, minus sending mail: returns the Supabase
// verify link that lands on redirectTo with the session in the URL hash.
async function emailLink(email: string, token: string) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${BASE}/en/invite/${token}` },
  });
  if (error) throw error;
  return data.properties.action_link;
}

async function userByEmail(email: string) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find((u) => u.email === email) ?? null;
}

test.afterEach(async () => {
  if (!cleanup) return;
  const user = await userByEmail(cleanup.email);
  if (user) await admin.auth.admin.deleteUser(user.id); // cascades to profiles
  await admin.from("invitations").delete().eq("token", cleanup.token);
  cleanup = null;
});

test("legacy /invite/<token> link redirects to the localized route", async ({ page }) => {
  const { token } = await createInvitation("catalyst");
  await page.goto(`/invite/${token}`);
  await expect(page).toHaveURL(`${BASE}/en/invite/${token}`);
  await expect(page.getByRole("heading", { name: "You belong here." })).toBeVisible();
});

test("legacy /invite/welcome is not treated as an invitation token", async ({ page }) => {
  await page.goto("/invite/welcome");
  await expect(page).toHaveURL(`${BASE}/en/login`);
  await expect(page.getByText("This invitation needs to be reissued.")).toHaveCount(0);
});

test("unknown token shows the unavailable page", async ({ page }) => {
  await page.goto("/en/invite/not-a-real-token");
  await expect(page).toHaveURL(`${BASE}/en/invite/unavailable`);
});

test("the shared app link can be opened repeatedly until the invitation is accepted", async ({ browser }) => {
  const { email, token } = await createInvitation("planter");
  for (let i = 0; i < 3; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`/en/invite/${token}`);
    await expect(page).toHaveURL(`${BASE}/en/invite/${token}?s=1`.replace("?s=1", ""), { timeout: 15000 });
    await expect(page.getByRole("button", { name: "Accept and continue" })).toBeEnabled();
    await context.close();
  }
  // Signing in does not create an account or profile.
  const user = await userByEmail(email);
  const { data: profile } = await admin.from("profiles").select("id").eq("id", user!.id).maybeSingle();
  expect(profile).toBeNull();
});

test("admin catalyst accepts via the email link and reaches onboarding", async ({ page }) => {
  const { email, token } = await createInvitation("catalyst", true);
  await page.goto(await emailLink(email, token));

  // The hash listener sets the session; home then routes the profile-less user back to the invite.
  await expect(page).toHaveURL(`${BASE}/en/invite/${token}`);
  const submit = page.getByRole("button", { name: "Accept and continue" });
  await expect(submit).toBeEnabled();

  await page.getByLabel("Your name").fill("E2E Catalyst");
  await page.getByLabel("Create password").fill("e2e-password-123");
  await submit.click();

  await expect(page).toHaveURL(`${BASE}/en/onboarding/catalyst`);

  const user = await userByEmail(email);
  expect(user).not.toBeNull();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin, display_name, org_id")
    .eq("id", user!.id)
    .single();
  expect(profile).toMatchObject({
    role: "catalyst",
    is_admin: true,
    display_name: "E2E Catalyst",
    org_id: BC_ORG_ID,
  });

  // The invitation is single-use.
  await page.context().clearCookies();
  await page.goto(`/en/invite/${token}`);
  await expect(page).toHaveURL(`${BASE}/en/invite/unavailable`);
});

test("pastor accepts via the email link and reaches church onboarding", async ({ page }) => {
  const { email, token } = await createInvitation("planter");
  await page.goto(await emailLink(email, token));
  await expect(page).toHaveURL(`${BASE}/en/invite/${token}`);
  await expect(page.getByText("E2E Church", { exact: false })).toBeVisible();
  // Wait for the hash listener's session (and the remount it causes) before typing.
  const submit = page.getByRole("button", { name: "Accept and continue" });
  await expect(submit).toBeEnabled();

  await page.getByLabel("Your name").fill("E2E Pastor");
  await page.getByLabel("Create password").fill("e2e-password-123");
  await submit.click();

  await expect(page).toHaveURL(`${BASE}/en/onboarding/church`);
});

// End-to-end coverage for the team invitation flow at /[locale]/team-invite.
// Unlike /invite there is no emailed session: the invitee opens the link signed
// out, sets a name and password, and the account is created for the email on the
// invitation. Uses the Supabase project in .env.local with throwaway users and
// invitations, all removed in afterEach.
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const BC_ORG_ID = "00000000-0000-0000-0000-000000000001";
const BASE = "http://localhost:3000";
const DAY_MS = 24 * 60 * 60 * 1000;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

let cleanup: { email: string; token: string } | null = null;

async function createInvitation(createdAt?: Date) {
  const email = `e2e-team-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const { data, error } = await admin
    .from("invitations")
    .insert({
      org_id: BC_ORG_ID,
      email,
      role: "planter",
      invited_by: null,
      invited_by_name: "E2E Tester",
      ...(createdAt && { created_at: createdAt.toISOString() }),
    })
    .select("token")
    .single();
  if (error) throw error;
  cleanup = { email, token: data.token };
  return { email, token: data.token as string };
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

test("signed-out visitor can open a team invite and sees the church", async ({ page }) => {
  const { token } = await createInvitation();
  await page.goto(`/en/team-invite/${token}`);
  await expect(page).toHaveURL(`${BASE}/en/team-invite/${token}`);
  await expect(page.getByRole("heading", { name: /^Join .+\.$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept and continue" })).toBeEnabled();
});

test("unknown token shows the link-isn't-working message", async ({ page }) => {
  await page.goto("/en/team-invite/not-a-real-token");
  await expect(page.getByRole("heading", { name: "This invite link isn’t working" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept and continue" })).toHaveCount(0);
});

test("an invite older than 7 days is rejected and creates no account", async ({ page }) => {
  const { email, token } = await createInvitation(new Date(Date.now() - 8 * DAY_MS));
  await page.goto(`/en/team-invite/${token}`);
  await expect(page.getByRole("heading", { name: "This invite link isn’t working" })).toBeVisible();
  expect(await userByEmail(email)).toBeNull();

  const { data: invite } = await admin
    .from("invitations")
    .select("accepted_at")
    .eq("token", token)
    .single();
  expect(invite?.accepted_at).toBeNull();
});

test("team member joins the inviting church and picks a language", async ({ page }) => {
  const { email, token } = await createInvitation();
  await page.goto(`/en/team-invite/${token}`);

  await page.getByLabel("Your name").fill("E2E Team Member");
  await page.getByLabel("Password").fill("e2e-password-123");
  await page.getByRole("button", { name: "Accept and continue" }).click();

  await expect(page).toHaveURL(`${BASE}/en/team-invite/welcome`);
  await expect(page.getByRole("heading", { name: "Welcome to the team." })).toBeVisible();

  // org_id and role come from the invitation, never from the form.
  const user = await userByEmail(email);
  expect(user).not.toBeNull();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, org_id, display_name, locale")
    .eq("id", user!.id)
    .single();
  expect(profile).toMatchObject({
    role: "planter",
    org_id: BC_ORG_ID,
    display_name: "E2E Team Member",
    locale: "en",
  });

  await page.getByLabel("Preferred language").selectOption("es");
  await page.getByRole("button", { name: /^Join / }).click();
  await expect(page).not.toHaveURL(/team-invite\/welcome/);

  const { data: saved } = await admin
    .from("profiles")
    .select("locale")
    .eq("id", user!.id)
    .single();
  expect(saved?.locale).toBe("es");

  // The invitation is single-use.
  await page.context().clearCookies();
  await page.goto(`/en/team-invite/${token}`);
  await expect(page.getByRole("heading", { name: "This invite link isn’t working" })).toBeVisible();
});

test("a password under 8 characters is refused", async ({ page }) => {
  const { email, token } = await createInvitation();
  await page.goto(`/en/team-invite/${token}`);

  await page.getByLabel("Your name").fill("E2E Team Member");
  await page.getByLabel("Password").fill("short");
  // minLength blocks native submit; bypass it to prove the server enforces the rule too.
  await page.getByLabel("Password").evaluate((el) => el.closest("form")!.setAttribute("novalidate", ""));
  await page.getByRole("button", { name: "Accept and continue" }).click();

  await expect(page.getByText("Use a password with at least 8 characters.")).toBeVisible();
  expect(await userByEmail(email)).toBeNull();
});

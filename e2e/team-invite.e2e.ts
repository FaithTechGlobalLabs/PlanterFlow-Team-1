// Pastor invites Team Member -> magic link -> accept -> joins church.
// Needs migration 20261004000000_team_invitations.sql applied to the Supabase project in .env.local.
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const BC_ORG_ID = "00000000-0000-0000-0000-000000000001";
const BASE = "http://localhost:3000";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const created: { emails: string[]; token?: string; churchId?: string } = { emails: [] };

async function userByEmail(email: string) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find((u) => u.email === email) ?? null;
}

test.afterEach(async () => {
  if (created.token) await admin.from("invitations").delete().eq("token", created.token);
  if (created.churchId) await admin.from("churches").delete().eq("id", created.churchId);
  for (const email of created.emails) {
    const u = await userByEmail(email);
    if (u) await admin.auth.admin.deleteUser(u.id);
  }
  created.emails = []; created.token = undefined; created.churchId = undefined;
});

test("team member accepts via the email link and joins the pastor's church", async ({ page }) => {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const pastorEmail = `e2e-pastor-${stamp}@example.com`;
  const teamEmail = `e2e-team-${stamp}@example.com`;
  created.emails.push(pastorEmail, teamEmail);

  const { data: pastor } = await admin.auth.admin.createUser({ email: pastorEmail, email_confirm: true });
  await admin.from("profiles").insert({ id: pastor.user!.id, org_id: BC_ORG_ID, role: "planter", display_name: "E2E Pastor" });
  const { data: church } = await admin.from("churches").insert({ org_id: BC_ORG_ID, pastor_id: pastor.user!.id, name: "E2E Team Church", city: "Vancouver", planting_start_date: "2026-01-01" }).select("id").single();
  created.churchId = church!.id;

  const { data: inv, error } = await admin.from("invitations").insert({
    org_id: BC_ORG_ID, church_id: church!.id, email: teamEmail, role: "peer",
    invited_by: pastor.user!.id, invited_by_name: "E2E Pastor", church_name: "E2E Team Church",
  }).select("token").single();
  if (error) throw error;
  created.token = inv!.token;

  const { data: link } = await admin.auth.admin.generateLink({ type: "invite", email: teamEmail, options: { redirectTo: `${BASE}/en/team-invite/${inv!.token}` } });
  await page.goto(link!.properties!.action_link);
  await expect(page).toHaveURL(`${BASE}/en/team-invite/${inv!.token}`);
  await expect(page.getByRole("heading", { name: "Join E2E Team Church." })).toBeVisible();

  const submit = page.getByRole("button", { name: "Accept and continue" });
  await expect(submit).toBeEnabled(); // session set; page has finished remounting
  await page.getByLabel("Your name").fill("E2E Team");
  await page.getByLabel("Create password").fill("e2e-password-123");
  await submit.click();
  await expect(page).toHaveURL(`${BASE}/en/team-invite/welcome`);

  const user = await userByEmail(teamEmail);
  const { data: membership } = await admin.from("church_memberships").select("church_id, role").eq("user_id", user!.id).single();
  expect(membership).toMatchObject({ church_id: church!.id, role: "peer" });

  // Single use.
  await page.context().clearCookies();
  await page.goto(`/en/team-invite/${inv!.token}`);
  await expect(page).toHaveURL(`${BASE}/en/invite/unavailable`);
});

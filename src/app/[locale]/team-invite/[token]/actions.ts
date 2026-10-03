"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
// ASSUMPTION: adjust these import names to match src/lib/supabase/*.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteCutoff, isInviteExpired } from "../_shared/data";

export type AcceptState = { error?: string };

export async function acceptInvite(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Enter your name so your team knows who you are." };
  if (password.length < 8) return { error: "Use a password with at least 8 characters." };

  const admin = createAdminClient();
  const invalid = { error: "This invite is no longer valid. Ask for a new link." };

  const { data: invite } = await admin
    .from("invitations")
    .select("id, org_id, role, email, accepted_at, created_at")
    .eq("token", token)
    .maybeSingle();
  if (!invite || invite.accepted_at) return invalid;
  if (isInviteExpired(invite.created_at)) {
    return { error: "This invite has expired. Ask for a new link." };
  }

  // Claim atomically: unused AND unexpired, decided in one statement, so the
  // invite works once and can't be accepted after it expires.
  const { data: claimed } = await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id)
    .is("accepted_at", null)
    .gte("created_at", inviteCutoff()) // expiry enforced in the same statement as the claim
    .select("id")
    .maybeSingle();
  if (!claimed) return invalid;

  // Undo everything so the person can retry.
  async function fail(message: string, userId?: string): Promise<AcceptState> {
    if (userId) await admin.auth.admin.deleteUser(userId);
    await admin.from("invitations").update({ accepted_at: null }).eq("id", invite!.id);
    return { error: message };
  }

  // The account is created for the email on the invitation, never one from the form.
  // email_confirm: the invite link was sent to that address, which is the confirmation.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    const exists = createError?.code === "email_exists" || /already/i.test(createError?.message ?? "");
    return fail(
      exists
        ? "An account with this email already exists. Sign in instead."
        : "We couldn't create your account. Try again.",
    );
  }
  const userId = created.user.id;

  // Start their session (sets the login cookie).
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password,
  });
  if (signInError) return fail("Account created but sign-in failed. Try again.", userId);

  // org_id and role come from the invitation, not the form.
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    org_id: invite.org_id,
    role: invite.role,
    display_name: name,
    locale: "en",
  });
  if (profileError) return fail("We couldn't finish joining. Try again.", userId);

  redirect({ href: "/team-invite/welcome", locale: await getLocale() });
  return {};
}

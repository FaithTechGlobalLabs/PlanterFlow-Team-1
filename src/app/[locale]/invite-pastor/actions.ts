"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth/session";
import { validateInvitePastor } from "@/lib/validation/onboarding";

interface ActionState {
  error?: string;
}

export async function invitePastor(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState | never> {
  const validation = validateInvitePastor(formData);
  if ("error" in validation) {
    return { error: validation.error };
  }

  const { email, churchName, welcomeNote } = validation.values;

  const { user, profile } = await getSessionProfile();

  if (!user || !profile || profile.role !== "catalyst") {
    return { error: "invitePastor.errors.generic" };
  }

  const admin = createAdminClient();

  const { data: invitation, error: insertError } = await admin
    .from("invitations")
    .insert({
      org_id: profile.org_id,
      email,
      role: "planter",
      invited_by: user.id,
      invited_by_name: profile.display_name,
      church_name: churchName,
      welcome_note: welcomeNote,
    })
    .select("id, token")
    .single();

  if (insertError) {
    return { error: "invitePastor.errors.generic" };
  }

  const headersList = await headers();
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  const locale = await getLocale();
  const origin = `${protocol}://${host}`;
  const redirectTo = `${origin}/${locale}/invite/${invitation.token}`;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      invitation_token: invitation.token,
      invited_by_name: profile.display_name,
      church_name: churchName,
    },
  });

  if (inviteError) {
    await admin.from("invitations").delete().eq("id", invitation.id);

    console.error("[invite-pastor] inviteUserByEmail failed:", inviteError.code, inviteError.message);

    const errorMessage = inviteError.message || "";
    if (/already been registered|already exists/i.test(errorMessage)) {
      return { error: "invitePastor.errors.exists" };
    }
    if (inviteError.code === "over_email_send_rate_limit" || /rate limit/i.test(errorMessage)) {
      return { error: "invitePastor.errors.rate_limit" };
    }
    return { error: "invitePastor.errors.generic" };
  }

  redirect({ href: `/invite-pastor/sent/${invitation.id}`, locale });
  return {};
}

"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { getSiteUrl } from "@/lib/auth/site-url";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth/session";
import { validateInviteCatalyst } from "@/lib/validation/onboarding";

interface ActionState {
  error?: string;
}

export async function inviteCatalyst(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState | never> {
  const validation = validateInviteCatalyst(formData);
  if ("error" in validation) {
    return { error: validation.error };
  }

  const { email, welcomeNote, makeAdmin } = validation.values;

  const { user, profile } = await getSessionProfile();

  if (!user || !profile || profile.role !== "catalyst" || !profile.is_admin) {
    return { error: "inviteCatalyst.errors.generic" };
  }

  if (!hasAdminCredentials()) return { error: "authSetup.description" };
  const admin = createAdminClient();
  const origin = getSiteUrl();

  const { data: invitation, error: insertError } = await admin
    .from("invitations")
    .insert({
      org_id: profile.org_id,
      email,
      role: "catalyst",
      is_admin: makeAdmin,
      invited_by: user.id,
      invited_by_name: profile.display_name,
      welcome_note: welcomeNote,
    })
    .select("id, token")
    .single();

  if (insertError) {
    return { error: "inviteCatalyst.errors.generic" };
  }

  const locale = await getLocale();
  const redirectTo = `${origin}/${locale}/invite/${invitation.token}`;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      invitation_token: invitation.token,
      invited_by_name: profile.display_name,
    },
  });

  if (inviteError) {
    await admin.from("invitations").delete().eq("id", invitation.id);

    console.error("[invite-catalyst] inviteUserByEmail failed:", inviteError.code, inviteError.message);

    const errorMessage = inviteError.message || "";
    if (/already been registered|already exists/i.test(errorMessage)) {
      return { error: "inviteCatalyst.errors.exists" };
    }
    if (inviteError.code === "over_email_send_rate_limit" || /rate limit/i.test(errorMessage)) {
      return { error: "inviteCatalyst.errors.rate_limit" };
    }
    return { error: "inviteCatalyst.errors.generic" };
  }

  redirect({ href: `/invite-catalyst/sent/${invitation.id}`, locale });
  return {};
}

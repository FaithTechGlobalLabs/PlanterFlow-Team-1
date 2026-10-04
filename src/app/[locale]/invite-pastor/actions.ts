"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { getSiteUrl } from "@/lib/auth/site-url";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth/session";
import { deliverInvitation } from "@/lib/invitation-engine";
import { validateInvitePastor } from "@/lib/validation/onboarding";

interface ActionState {
  error?: string;
  inviteLink?: string;
  email?: string;
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

  if (!hasAdminCredentials()) return { error: "authSetup.description" };
  const admin = createAdminClient();
  const origin = getSiteUrl();

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

  const locale = await getLocale();
  const redirectTo = `${origin}/${locale}/invite/${invitation.token}`;

  const result = await deliverInvitation({
    admin,
    invitation,
    email,
    redirectTo,
    data: {
      invitation_token: invitation.token,
      invited_by_name: profile.display_name,
      church_name: churchName,
    },
    appLink: `${origin}/${locale}/invite/${invitation.token}`,
    errorNamespace: "invitePastor",
    logTag: "invite-pastor",
  });
  if ("error" in result) return result;
  if ("inviteLink" in result) return result;

  redirect({ href: `/invite-pastor/sent/${invitation.id}`, locale });
  return {};
}

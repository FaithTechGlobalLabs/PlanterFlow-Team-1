"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { getSiteUrl } from "@/lib/auth/site-url";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth/session";
import { deliverInvitation } from "@/lib/invitation-engine";
import { validateInviteTeam } from "@/lib/validation/onboarding";

interface ActionState {
  error?: string;
  inviteLink?: string;
  email?: string;
}

export async function inviteTeamMember(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState | never> {
  const validation = validateInviteTeam(formData);
  if ("error" in validation) {
    return { error: validation.error };
  }
  const { email, welcomeNote } = validation.values;

  const { user, profile } = await getSessionProfile();
  if (!user || !profile || profile.role !== "planter") {
    return { error: "inviteTeam.errors.generic" };
  }

  if (!hasAdminCredentials()) return { error: "authSetup.description" };
  const admin = createAdminClient();

  // org, church, role and inviter are derived here, never read from the client.
  const { data: church } = await admin
    .from("churches")
    .select("id, name, org_id")
    .eq("pastor_id", user.id)
    .maybeSingle();
  if (!church) {
    return { error: "inviteTeam.errors.no_church" };
  }

  const { data: invitation, error: insertError } = await admin
    .from("invitations")
    .insert({
      org_id: church.org_id,
      church_id: church.id,
      email,
      role: "peer",
      invited_by: user.id,
      invited_by_name: profile.display_name,
      church_name: church.name,
      welcome_note: welcomeNote,
    })
    .select("id, token")
    .single();
  if (insertError) {
    return { error: "inviteTeam.errors.generic" };
  }

  const locale = await getLocale();
  const origin = getSiteUrl();
  const redirectTo = `${origin}/${locale}/team-invite/${invitation.token}`;

  const result = await deliverInvitation({
    admin,
    invitation,
    email,
    redirectTo,
    data: {
      invitation_token: invitation.token,
      invited_by_name: profile.display_name,
      church_name: church.name,
    },
    appLink: `${origin}/${locale}/team-invite/${invitation.token}`,
    errorNamespace: "inviteTeam",
    logTag: "invite-team",
  });
  if ("error" in result) return result;
  if ("inviteLink" in result) return result;

  redirect({ href: `/invite-team/sent/${invitation.id}`, locale });
  return {};
}

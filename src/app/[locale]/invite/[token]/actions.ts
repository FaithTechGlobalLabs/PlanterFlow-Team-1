"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAcceptInvitation } from "@/lib/validation/onboarding";
import { invitationStatus } from "@/lib/invitations";

interface ActionState {
  error?: string;
}

export async function acceptInvitation(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState | never> {
  const validation = validateAcceptInvitation(formData);
  if ("error" in validation) {
    return { error: validation.error };
  }

  const { name, password, locale } = validation.values;
  const token = formData.get("token")?.toString() || "";

  const admin = createAdminClient();
  const { data: invitation } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invitation || invitationStatus(invitation) !== "valid") {
    const currentLocale = await getLocale();
    redirect({ href: "/invite/unavailable", locale: currentLocale });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: "invite.errors.session" };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password,
    data: { display_name: name },
  });

  if (updateError) {
    return { error: "invite.errors.generic" };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({
      id: user.id,
      org_id: invitation.org_id,
      role: invitation.role,
      is_admin: invitation.is_admin === true,
      display_name: name,
      locale,
    });

  if (profileError) {
    return { error: "invite.errors.generic" };
  }

  await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  const redirectPath =
    invitation.role === "catalyst" ? "/onboarding/catalyst" : "/onboarding/church";
  redirect({ href: redirectPath, locale });
  return {};
}

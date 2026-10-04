"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { validateAcceptInvitation } from "@/lib/validation/onboarding";
import { acceptInvitationForUser } from "@/lib/invitation-engine";

interface ActionState {
  error?: string;
}

export async function acceptTeamInvitation(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState | never> {
  const validation = validateAcceptInvitation(formData);
  if ("error" in validation) {
    return { error: validation.error };
  }

  const { name, password, locale } = validation.values;
  const token = formData.get("token")?.toString() || "";

  if (!hasAdminCredentials()) return { error: "authSetup.description" };
  const admin = createAdminClient();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "invite.errors.session" };

  const result = await acceptInvitationForUser({
    admin,
    token,
    user,
    name,
    locale,
    password,
    roles: ["peer"],
    setPassword: async (pw, displayName) => {
      const { error } = await supabase.auth.updateUser({ password: pw, data: { display_name: displayName } });
      return !error;
    },
  });

  if ("error" in result) {
    if (result.error === "unavailable") {
      redirect({ href: "/invite/unavailable", locale: await getLocale() });
    }
    return { error: result.error === "session" ? "invite.errors.session" : "invite.errors.generic" };
  }

  redirect({ href: "/team-invite/welcome", locale });
  return {};
}

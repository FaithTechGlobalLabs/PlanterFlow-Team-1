"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth/session";
import { validateChurch } from "@/lib/validation/onboarding";

interface ActionState {
  error?: string;
}

export async function saveChurch(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState | never> {
  const validation = validateChurch(formData);
  if ("error" in validation) {
    return { error: validation.error };
  }

  const { name, city, plantingStartDate, vision } = validation.values;

  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return { error: "onboarding.church.errors.generic" };
  }

  if (!hasAdminCredentials()) return { error: "authSetup.description" };
  const { data: invitation } = await createAdminClient()
    .from("invitations")
    .select("invited_by")
    .ilike("email", user.email!)
    .eq("role", "planter")
    .not("accepted_at", "is", null)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const supabase = await createClient();
  const { error } = await supabase
    .from("churches")
    .insert({
      org_id: profile.org_id,
      pastor_id: user.id,
      catalyst_id: invitation?.invited_by ?? null,
      name,
      city,
      planting_start_date: plantingStartDate,
      vision,
    });

  if (error) {
    return { error: "onboarding.church.errors.generic" };
  }

  const locale = await getLocale();
  redirect({ href: "/onboarding/first-goal", locale });
  return {};
}

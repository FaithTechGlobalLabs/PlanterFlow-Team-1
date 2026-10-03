"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

interface ActionState {
  error?: string;
}

export async function completeCatalystOnboarding(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState | never> {
  const contactPreference = formData.get("contactPreference")?.toString().trim() || null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "onboarding.catalyst.errors.generic" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      contact_preference: contactPreference || null,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "onboarding.catalyst.errors.generic" };
  }

  const locale = await getLocale();
  redirect({ href: "/", locale });
  return {};
}

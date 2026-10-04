"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";

export async function finishTeamOnboarding() {
  const locale = await getLocale();
  const { user, profile } = await getSessionProfile();
  if (!user || profile?.role !== "peer") {
    redirect({ href: "/", locale });
  }

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user!.id);

  redirect({ href: "/", locale });
}

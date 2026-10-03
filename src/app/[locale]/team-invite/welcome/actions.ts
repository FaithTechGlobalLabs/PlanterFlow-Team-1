"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LANGUAGES } from "../_shared/data";

export type LanguageState = { error?: string };

export async function saveLanguage(
  _prev: LanguageState,
  formData: FormData,
): Promise<LanguageState> {
  const language = String(formData.get("language") ?? "");
  if (!LANGUAGES.some((l) => l.code === language)) {
    return { error: "Choose a language from the list." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ locale: language }).eq("id", user.id);
  if (error) return { error: "We couldn't save that. Try again." };

  redirect({ href: "/", locale: await getLocale() }); // TODO: role-based home, e.g. /dashboard
  return {};
}

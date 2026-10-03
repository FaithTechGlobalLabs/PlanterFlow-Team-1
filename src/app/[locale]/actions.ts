"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const locale = await getLocale();
  redirect({ href: "/login", locale });
}

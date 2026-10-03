"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

interface SignInState {
  error?: string;
}

export async function signIn(
  prevState: SignInState | undefined,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "login.errors.required" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.status === 429) return { error: "login.errors.rate_limit" };
      return { error: error.status && error.status >= 500 ? "login.errors.generic" : "login.errors.invalid" };
    }
  } catch {
    return { error: "login.errors.generic" };
  }

  const locale = await getLocale();
  return redirect({ href: "/", locale });
}

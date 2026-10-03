"use server";

import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/auth/site-url";

type RecoveryState = { error?: string; sent?: boolean; updated?: boolean };

export async function requestPasswordReset(_previous: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const email = String(formData.get("email") || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "recover.errors.email" };
  try {
    const locale = await getLocale();
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?locale=${encodeURIComponent(locale)}`,
    });
    if (error) return { error: "recover.errors.generic" };
    return { sent: true };
  } catch {
    return { error: "recover.errors.generic" };
  }
}

export async function updatePassword(_previous: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "recover.errors.password" };
  if (password !== formData.get("confirmPassword")) return { error: "recover.errors.match" };
  try {
    const supabase = await createClient();
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !user) return { error: "recover.errors.link" };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: "recover.errors.generic" };
    return { updated: true };
  } catch {
    return { error: "recover.errors.generic" };
  }
}

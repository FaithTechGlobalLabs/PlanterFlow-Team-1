import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";

export type Profile = {
  id: string;
  org_id: string;
  role: "catalyst" | "planter" | "peer";
  is_admin: boolean;
  display_name: string;
  locale: string;
  contact_preference: string | null;
  onboarded_at: string | null;
};

export async function getSessionProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile as Profile | null };
}

export async function requireRole(role: Profile["role"], locale: string) {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile || profile.role !== role) {
    redirect({ href: "/", locale });
  }

  return { user: user!, profile: profile! };
}

export async function requireAdmin(locale: string) {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile || profile.role !== "catalyst" || !profile.is_admin) {
    redirect({ href: "/", locale });
  }

  return { user: user!, profile: profile! };
}

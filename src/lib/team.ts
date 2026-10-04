import "server-only";
import { createClient } from "@/lib/supabase/server";

/** The church a team member belongs to, via their own membership row. */
export async function getTeamChurch(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("church_memberships")
    .select("churches(name, city)")
    .eq("user_id", userId)
    .maybeSingle();
  const church = data?.churches as unknown as { name: string; city: string | null } | null | undefined;
  return church ?? null;
}

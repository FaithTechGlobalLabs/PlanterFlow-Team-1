import "server-only";
// ASSUMPTION: adjust this import name to whatever src/lib/supabase/admin.ts exports.
import { createAdminClient } from "@/lib/supabase/admin";
import type { Invite, Role } from "./data";

// Uses the service role because the person opening the link isn't a member
// yet, so row-level security would (correctly) hide the invitations table.
export async function getInvite(token: string): Promise<Invite | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("token, role, accepted_at, organizations(name)")
    .eq("token", token)
    .maybeSingle();

  if (!data || data.accepted_at) return null;

  const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  return {
    token: data.token,
    role: data.role as Role,
    churchName: org?.name ?? "your church",
    // TODO (optional): add invitations.invited_by -> profiles.id and join
    // profiles(display_name) here to show "Invited by Daniel".
  };
}

import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Builds the same Supabase invite link the email contains, without sending mail.
 * Used when the invite email can't be sent (rate limit, SMTP) so the inviter can
 * share the link themselves. Returns null if the link can't be generated.
 */
export async function generateInviteLink(
  admin: AdminClient,
  email: string,
  redirectTo: string,
  data: Record<string, string | null>
): Promise<string | null> {
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo, data },
  });

  if (error || !link?.properties?.action_link) {
    console.error("[invite-link] generateLink failed:", error?.code, error?.message);
    return null;
  }

  return link.properties.action_link;
}

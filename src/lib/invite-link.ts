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
  const attempt = async (type: "invite" | "magiclink") => {
    const { data: link, error } = await admin.auth.admin.generateLink({
      type,
      email,
      options: { redirectTo, data },
    });
    return { url: link?.properties?.action_link ?? null, error };
  };

  const invite = await attempt("invite");
  if (invite.url) return invite.url;

  // An account that already confirmed (e.g. a first link was used before the form was
  // submitted) can't be re-invited, but a magic link signs the same address back in.
  const magic = await attempt("magiclink");
  if (magic.url) return magic.url;

  console.error("[invite-link] generateLink failed:", magic.error?.code, magic.error?.message);
  return null;
}

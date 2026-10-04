import "server-only";
import { invitationStatus } from "@/lib/invitations";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export interface DeliverInput {
  admin: AdminClient;
  invitation: { id: string; token: string };
  email: string;
  redirectTo: string;
  data: Record<string, string | null>;
  /** Reusable app URL for the invitation, shared when the email can't be sent. */
  appLink: string;
  /** Translation namespace holding `errors.exists | rate_limit | generic`. */
  errorNamespace: string;
  logTag: string;
}

export type DeliverResult = { ok: true } | { inviteLink: string; email: string } | { error: string };

/**
 * Sends the Supabase invite email for an already-inserted invitation. If the email
 * can't be sent, falls back to a reusable app link.
 * Shared by the catalyst, pastor, and team invitation flows.
 */
export async function deliverInvitation(input: DeliverInput): Promise<DeliverResult> {
  const { admin, invitation, email, redirectTo, data, appLink, errorNamespace, logTag } = input;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo, data });
  if (!inviteError) return { ok: true };

  console.error(`[${logTag}] inviteUserByEmail failed:`, inviteError.code, inviteError.message);
  const errorMessage = inviteError.message || "";
  if (/already been registered|already exists/i.test(errorMessage)) {
    await admin.from("invitations").delete().eq("id", invitation.id);
    return { error: `${errorNamespace}.errors.exists` };
  }

  // The email couldn't be sent. Hand the inviter the app invite URL: it signs the invitee in
  // on every visit (see /api/invite-session), so it can be copied and reused until accepted.
  return { inviteLink: appLink, email };
}

export interface AcceptInput {
  admin: AdminClient;
  token: string;
  /** The authenticated user from the magic-link session. */
  user: { id: string; email?: string | null };
  name: string;
  locale: string;
  /** Only invitations with one of these roles are accepted. */
  roles: string[];
  /** Persists the password on the signed-in session. */
  setPassword: (password: string, name: string) => Promise<boolean>;
  password: string;
}

export type AcceptResult =
  | { ok: true; invitation: { role: string; church_id: string | null } }
  | { error: "unavailable" | "session" | "generic" };

/**
 * Validates and consumes an invitation for the signed-in user: the token must be valid,
 * unused, unexpired, and match the session email. Profile (and church membership for team
 * invitations) are created from server-trusted invitation values, and the invitation is
 * claimed atomically so it can be accepted exactly once.
 */
export async function acceptInvitationForUser(input: AcceptInput): Promise<AcceptResult> {
  const { admin, token, user, name, locale, roles, setPassword, password } = input;

  const { data: invitation } = await admin.from("invitations").select("*").eq("token", token).maybeSingle();
  if (!invitation || !roles.includes(invitation.role) || invitationStatus(invitation) !== "valid") {
    return { error: "unavailable" };
  }
  if (!user.email || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: "session" };
  }
  if (invitation.role === "peer" && !invitation.church_id) return { error: "unavailable" };

  // Claim first: only one concurrent request can flip accepted_at from null.
  const { data: claimed } = await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id)
    .is("accepted_at", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return { error: "unavailable" };

  const release = async () => {
    await admin.from("invitations").update({ accepted_at: null }).eq("id", invitation.id);
  };

  if (!(await setPassword(password, name))) {
    await release();
    return { error: "generic" };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    org_id: invitation.org_id,
    role: invitation.role,
    is_admin: invitation.is_admin === true,
    display_name: name,
    locale,
  });
  if (profileError) {
    await release();
    return { error: "generic" };
  }

  if (invitation.church_id) {
    const { error: memberError } = await admin.from("church_memberships").insert({
      church_id: invitation.church_id,
      user_id: user.id,
      role: invitation.role,
    });
    if (memberError) {
      await admin.from("profiles").delete().eq("id", user.id);
      await release();
      return { error: "generic" };
    }
  }

  return { ok: true, invitation: { role: invitation.role, church_id: invitation.church_id } };
}

import { NextResponse } from "next/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { invitationStatus } from "@/lib/invitations";
import { generateInviteLink } from "@/lib/invite-link";
import { getSiteUrl } from "@/lib/auth/site-url";
import { routing } from "@/i18n/routing";

// Reusable invite link. Each visit to an app invite URL without a session lands here and
// mints a fresh single-use Supabase sign-in link, so a copied/forwarded link keeps working
// until the invitation is accepted or expires.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const requested = new URL(request.url).searchParams.get("locale") ?? "";
  const locale = (routing.locales as readonly string[]).includes(requested) ? requested : routing.defaultLocale;
  const site = getSiteUrl();
  const unavailable = NextResponse.redirect(`${site}/${locale}/invite/unavailable`);
  unavailable.headers.set("Cache-Control", "private, no-store");

  if (!hasAdminCredentials()) return unavailable;
  const admin = createAdminClient();
  const { data: invitation } = await admin.from("invitations").select("*").eq("token", token).maybeSingle();
  if (!invitation || invitationStatus(invitation) !== "valid") return unavailable;

  const path = invitation.role === "peer" ? "team-invite" : "invite";
  // `s=1` tells the page a sign-in was just attempted, so it doesn't bounce back here.
  const redirectTo = `${site}/${locale}/${path}/${token}?s=1`;
  const link = await generateInviteLink(admin, invitation.email, redirectTo, { invitation_token: token });
  if (!link) return unavailable;

  const response = NextResponse.redirect(link);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

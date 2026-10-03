"use server";

import { redirect } from "next/navigation";
// ASSUMPTION: adjust these import names to match your src/lib/supabase files.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LANGUAGES } from "./data";

export type JoinState = { error?: string };

export async function joinChurch(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const language = String(formData.get("language") ?? "");

  if (name.length < 2) return { error: "Enter your name so your team knows who you are." };
  if (!LANGUAGES.some((l) => l.code === language)) {
    return { error: "Choose a language from the list." };
  }

  // profiles.id = auth user id, so the person must be signed in.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first, then open your invite link again." };

  const admin = createAdminClient();
  const invalid = { error: "This invite is no longer valid. Ask for a new link." };

  const { data: invite } = await admin
    .from("invitations")
    .select("id, org_id, role, email, accepted_at")
    .eq("token", token)
    .maybeSingle();
  if (!invite || invite.accepted_at) return invalid;

  // Stops anyone who merely has the link from taking someone else's seat.
  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return { error: "This invite was sent to a different email address." };
  }

  // Claim the invite atomically so it can only be used once.
  const { data: claimed } = await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id)
    .is("accepted_at", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return invalid;

  const { error } = await admin.from("profiles").upsert({
    id: user.id,
    org_id: invite.org_id,
    role: invite.role,
    display_name: name,
    locale: language,
  });

  if (error) {
    // Un-claim so they can retry.
    await admin.from("invitations").update({ accepted_at: null }).eq("id", invite.id);
    return { error: "We couldn't finish joining. Try again." };
  }

  redirect("/"); // TODO: role-based home, e.g. /dashboard
}

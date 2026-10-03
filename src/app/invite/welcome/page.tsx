import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import InviteShell from "../_shared/shell";
import { ROLE_LABELS, type Role } from "../_shared/data";
import WelcomeForm from "./welcome-form";

export const metadata: Metadata = { title: "Welcome · First Fruits" };

export default async function WelcomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/"); // TODO: send to the login page once it exists

  // Service role + the verified user id, so this works before profile RLS policies exist.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, organizations(name)")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/");

  const org = Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations;
  const churchName = org?.name ?? "your church";

  return (
    <InviteShell>
      <p className="mt-12 text-xs font-semibold uppercase tracking-wide text-[#3D7A5A]">
        {churchName}
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Welcome to the team.</h1>
      <p className="mt-5 text-base text-[#5B6B78]">Your church and permissions are already set.</p>

      <section className="mt-6 rounded-2xl bg-white p-6 sm:p-7">
        <h2 className="text-2xl font-bold tracking-tight">Make yourself at home</h2>
        <p className="mt-3 text-base text-[#5B6B78]">One quick step before joining the garden.</p>
        <WelcomeForm churchName={churchName} roleLabel={ROLE_LABELS[profile.role as Role]} />
      </section>
    </InviteShell>
  );
}

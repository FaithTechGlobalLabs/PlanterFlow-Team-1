import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { AuthSetupPending } from "@/components/auth-setup-pending";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { Status } from "@/components/ui/Status";
import { Button } from "@/components/ui/Button";
import { PlanterHome } from "@/components/planter/planter-home";
import { loadWorkspace } from "@/lib/workspace/data";

import { getTeamChurch } from "@/lib/team";
import { signOut } from "./actions";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const { user, profile } = await getSessionProfile();
  const t = await getTranslations();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  if (!profile) {
    if (!hasAdminCredentials()) return <AuthSetupPending />;
    const admin = createAdminClient();
    const { data: invitation } = await admin
      .from("invitations")
      .select("token, role")
      .ilike("email", user!.email!)
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invitation) {
      redirect({
        href: `/${invitation.role === "peer" ? "team-invite" : "invite"}/${invitation.token}`,
        locale,
      });
    }
    redirect({ href: "/invite/unavailable", locale });
  }

  if (profile!.role === "catalyst") {
    if (!profile!.onboarded_at) {
      redirect({ href: "/onboarding/catalyst", locale });
    }

    // /catalyst is the canonical Catalyst landing page; the #61 workspace stays at /dashboard.
    redirect({ href: "/catalyst", locale });
  }

  if (profile!.role === "peer") {
    if (!profile!.onboarded_at) {
      redirect({ href: "/team-invite/welcome", locale });
    }
    const teamChurch = await getTeamChurch(user!.id);
    return (
      <OnboardingPage
        eyebrow={t("home.team.eyebrow")}
        title={teamChurch?.name ?? ""}
        subline={t("home.team.subline")}
      >
        <FormCard title={profile!.display_name}>
          <Status>{t("home.team.chip")}</Status>
          <Button variant="primary" href="/dashboard" fullWidth={false}>
            {t("home.team.open_workspace")}
          </Button>
          <form action={signOut}>
            <Button
              variant="secondary"
              type="submit"
              fullWidth={false}
              className="min-w-[222px]"
            >
              {t("common.sign_out")}
            </Button>
          </form>
        </FormCard>
      </OnboardingPage>
    );
  }

  const supabase = await createClient();
  const { data: church } = await supabase
    .from("churches")
    .select("*")
    .eq("pastor_id", user!.id)
    .maybeSingle();

  if (!church) {
    redirect({ href: "/onboarding/church", locale });
  }

  const { count: objectivesCount } = await supabase
    .from("objectives")
    .select("*", { count: "exact", head: true })
    .eq("planter_id", user!.id);

  if (objectivesCount === 0) {
    redirect({ href: "/onboarding/first-goal", locale });
  }

  const workspace = await loadWorkspace(profile!);
  if (!workspace)
    throw new Error("We couldn't load your church. Please try again.");
  return <PlanterHome data={workspace} />;
}

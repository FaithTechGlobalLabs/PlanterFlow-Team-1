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
import { TreeSapling } from "@/components/ui/TreeSapling";
import { treeStageFromPlantingDate } from "@/lib/tree-stage";
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
      redirect({ href: `/${invitation.role === "peer" ? "team-invite" : "invite"}/${invitation.token}`, locale });
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
        subline="View shared objectives and contribute with your Church Team."      >
        <FormCard title={profile!.display_name}>
          <Status>{t("home.team.chip")}</Status>
          <Button variant="primary" href="/dashboard" fullWidth={false}>
            Open workspace
          </Button>
          <form action={signOut}>
            <Button variant="secondary" type="submit" fullWidth={false} className="min-w-[222px]">
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

  const { data: firstObjective } = await supabase
    .from("objectives")
    .select("title")
    .eq("planter_id", user!.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const stage = treeStageFromPlantingDate(new Date(church.planting_start_date));

  return (
    <OnboardingPage
      eyebrow={t("home.planter.eyebrow")}
      title={church.name}
      subline={t("home.planter.subline")}
    >
      <FormCard title={church.city ?? church.name}>
        <Button variant="primary" href="/dashboard" fullWidth={false}>Open workspace</Button>
        <Button variant="secondary" href="/invite-team" fullWidth={false} className="min-w-[222px]">
          {t("home.planter.invite_team")}
        </Button>
        <TreeSapling />
        <Status>{t(`home.planter.stage.${stage}`)}</Status>
        <p className="text-[15px] text-[var(--color-muted)]">{firstObjective?.title}</p>
        <form action={signOut}>
          <Button variant="secondary" type="submit" fullWidth={false} className="min-w-[222px]">
            {t("common.sign_out")}
          </Button>
        </form>
      </FormCard>
    </OnboardingPage>
  );
}

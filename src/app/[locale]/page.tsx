import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { Status } from "@/components/ui/Status";
import { Button } from "@/components/ui/Button";
import { TreeSapling } from "@/components/ui/TreeSapling";
import { treeStageFromPlantingDate } from "@/lib/tree-stage";
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
    const admin = createAdminClient();
    const { data: invitation } = await admin
      .from("invitations")
      .select("token")
      .ilike("email", user!.email!)
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invitation) {
      redirect({ href: `/invite/${invitation.token}`, locale });
    }
    redirect({ href: "/invite/unavailable", locale });
  }

  if (profile!.role === "catalyst") {
    if (!profile!.onboarded_at) {
      redirect({ href: "/onboarding/catalyst", locale });
    }

    const supabase = await createClient();
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile!.org_id)
      .single();

    return (
      <OnboardingPage
        eyebrow={t("home.catalyst.eyebrow")}
        title={org?.name ?? ""}
        subline={t("home.catalyst.subline")}
      >
        <FormCard title={profile!.display_name}>
          <Status>
            {profile!.is_admin ? t("home.catalyst.chip_admin") : t("invite.catalyst.chip")}
          </Status>
          <Button variant="primary" href="/invite-pastor" fullWidth={false} className="min-w-[222px]">
            {t("home.catalyst.invite")}
          </Button>
          {profile!.is_admin && (
            <Button variant="secondary" href="/invite-catalyst" fullWidth={false} className="min-w-[222px]">
              {t("home.catalyst.invite_catalyst")}
            </Button>
          )}
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

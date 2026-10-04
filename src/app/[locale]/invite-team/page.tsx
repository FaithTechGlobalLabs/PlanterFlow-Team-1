import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { InviteTeamForm } from "./invite-team-form";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function InviteTeamPage({ params }: PageProps) {
  const { locale } = await params;
  const { user } = await requireRole("planter", locale);
  const t = await getTranslations();

  const supabase = await createClient();
  const { data: church } = await supabase
    .from("churches")
    .select("name")
    .eq("pastor_id", user.id)
    .maybeSingle();
  if (!church) {
    redirect({ href: "/onboarding/church", locale });
  }

  return (
    <OnboardingPage
      eyebrow={t("inviteTeam.eyebrow")}
      title={t("inviteTeam.title")}
      subline={t("inviteTeam.subline")}
    >
      <FormCard title={t("inviteTeam.card_title")} description={t("inviteTeam.assigned", { church: church!.name })}>
        <InviteTeamForm />
      </FormCard>
    </OnboardingPage>
  );
}

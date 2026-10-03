import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { FirstGoalForm } from "./first-goal-form";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function FirstGoalPage({ params }: PageProps) {
  const { locale } = await params;
  const { user, profile } = await requireRole("planter", locale);
  const t = await getTranslations();

  const supabase = await createClient();
  const { data: church } = await supabase
    .from("churches")
    .select("id")
    .eq("pastor_id", user.id)
    .maybeSingle();

  if (!church) {
    redirect({ href: "/onboarding/church", locale });
  }

  const { count: objectivesCount } = await supabase
    .from("objectives")
    .select("*", { count: "exact", head: true })
    .eq("planter_id", user.id);

  if (objectivesCount && objectivesCount > 0) {
    redirect({ href: "/", locale });
  }

  const { data: categories } = await supabase
    .from("objective_categories")
    .select("id, title")
    .eq("org_id", profile.org_id)
    .order("sort_order", { ascending: true });

  return (
    <OnboardingPage
      eyebrow={t("onboarding.firstGoal.eyebrow")}
      title={t("onboarding.firstGoal.title")}
      subline={t("onboarding.firstGoal.subline")}
    >
      <FormCard
        title={t("onboarding.firstGoal.card_title")}
        description={t("onboarding.firstGoal.card_body")}
      >
        <FirstGoalForm categories={categories || []} />
      </FormCard>
    </OnboardingPage>
  );
}

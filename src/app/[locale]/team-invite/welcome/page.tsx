import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { requireRole } from "@/lib/auth/session";
import { getTeamChurch } from "@/lib/team";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { Button } from "@/components/ui/Button";
import { finishTeamOnboarding } from "./actions";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TeamWelcomePage({ params }: PageProps) {
  const { locale } = await params;
  const { user, profile } = await requireRole("peer", locale);
  const t = await getTranslations();
  const church = await getTeamChurch(user.id);
  if (!church) redirect({ href: "/", locale });

  return (
    <OnboardingPage
      eyebrow={t("teamWelcome.eyebrow")}
      title={t("teamWelcome.title", { church: church!.name })}
      subline={t("teamWelcome.subline")}
    >
      <FormCard title={t("teamWelcome.card_title", { name: profile.display_name })} description={t("teamWelcome.card_body", { church: church!.name })}>
        <form action={finishTeamOnboarding}>
          <Button variant="primary" type="submit" fullWidth={false} className="min-w-[222px]">
            {t("teamWelcome.continue")}
          </Button>
        </form>
      </FormCard>
    </OnboardingPage>
  );
}

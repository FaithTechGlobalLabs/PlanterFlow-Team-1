import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { Button } from "@/components/ui/Button";
import { InvitePastorForm } from "./invite-pastor-form";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function InvitePastorPage({ params }: PageProps) {
  const { locale } = await params;
  const { profile } = await requireRole("catalyst", locale);
  const t = await getTranslations();

  return (
    <OnboardingPage
      eyebrow={t("invitePastor.eyebrow")}
      title={t("invitePastor.title")}
      subline={t("invitePastor.subline")}
    >
      <FormCard
        title={t("invitePastor.card_title")}
        description={t("invitePastor.assigned", { name: profile.display_name })}
      >
        <InvitePastorForm />
      </FormCard>
      <Button variant="secondary" href="/catalyst" fullWidth={false} className="min-w-[222px]">
        {t("catalyst.planter.back")}
      </Button>
    </OnboardingPage>
  );
}

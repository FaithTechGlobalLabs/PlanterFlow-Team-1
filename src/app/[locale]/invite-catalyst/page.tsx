import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { InviteCatalystForm } from "./invite-catalyst-form";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function InviteCatalystPage({ params }: PageProps) {
  const { locale } = await params;
  const { profile } = await requireAdmin(locale);
  const t = await getTranslations();

  return (
    <OnboardingPage
      eyebrow={t("inviteCatalyst.eyebrow")}
      title={t("inviteCatalyst.title")}
      subline={t("inviteCatalyst.subline")}
    >
      <FormCard
        title={t("inviteCatalyst.card_title")}
        description={t("inviteCatalyst.assigned", { name: profile.display_name })}
      >
        <InviteCatalystForm />
      </FormCard>
    </OnboardingPage>
  );
}

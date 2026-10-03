import { getTranslations } from "next-intl/server";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { RecoveryForm } from "./recovery-form";

export default async function RecoverPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const t = await getTranslations();
  const { error } = await searchParams;
  return (
    <OnboardingPage title={t("recover.title")} subline={t("recover.description")}>
      <FormCard title={t("recover.card_title")}><RecoveryForm invalidLink={error === "link"} /></FormCard>
    </OnboardingPage>
  );
}

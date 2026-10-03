import { getTranslations } from "next-intl/server";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { RecoveryForm } from "../recovery-form";

export default async function UpdatePasswordPage() {
  const t = await getTranslations();
  return (
    <OnboardingPage title={t("recover.update_title")} subline={t("recover.update_description")}>
      <FormCard title={t("recover.password")}><RecoveryForm update /></FormCard>
    </OnboardingPage>
  );
}

import { ReactNode } from "react";
import { OnboardingPage } from "./onboarding-page";
import { FormCard } from "./ui/FormCard";

interface StatusPageProps {
  title: string;
  subline: string;
  cardTitle: string;
  cardBody: ReactNode;
  actions: ReactNode;
}

export function StatusPage({
  title,
  subline,
  cardTitle,
  cardBody,
  actions,
}: StatusPageProps) {
  return (
    <OnboardingPage title={title} subline={subline}>
      <FormCard title={cardTitle}>
        {cardBody}
        <div className="flex flex-col gap-4">{actions}</div>
      </FormCard>
    </OnboardingPage>
  );
}

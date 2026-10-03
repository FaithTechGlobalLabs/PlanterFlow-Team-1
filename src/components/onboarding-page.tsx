import { ReactNode } from "react";
import { BrandNav } from "./ui/BrandNav";
import { PageHeader } from "./ui/PageHeader";

interface OnboardingPageProps {
  eyebrow?: string;
  title: string;
  subline: string;
  children: ReactNode;
}

export function OnboardingPage({
  eyebrow,
  title,
  subline,
  children,
}: OnboardingPageProps) {
  return (
    <main className="onboarding-shell">
      <BrandNav />
      <div className="onboarding-content">
      <PageHeader eyebrow={eyebrow} title={title} subline={subline} />
      {children}
      </div>
    </main>
  );
}

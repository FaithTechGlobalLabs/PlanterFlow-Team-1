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
    <main className="min-h-screen bg-[var(--color-canvas)] p-8 md:p-10 flex flex-col gap-4">
      <BrandNav />
      <PageHeader eyebrow={eyebrow} title={title} subline={subline} />
      {children}
    </main>
  );
}

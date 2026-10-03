import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { ChurchForm } from "./church-form";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ChurchOnboardingPage({ params }: PageProps) {
  const { locale } = await params;
  const { user } = await requireRole("planter", locale);
  const t = await getTranslations();

  const supabase = await createClient();
  const { data: existingChurch } = await supabase
    .from("churches")
    .select("id")
    .eq("pastor_id", user.id)
    .maybeSingle();

  if (existingChurch) {
    redirect({ href: "/onboarding/first-goal", locale });
  }

  const { data: invitation } = hasAdminCredentials() ? await createAdminClient()
    .from("invitations")
    .select("church_name, invited_by_name")
    .ilike("email", user.email!)
    .eq("role", "planter")
    .not("accepted_at", "is", null)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle() : { data: null };

  const subline = invitation?.invited_by_name
    ? t("onboarding.church.subline", { name: invitation.invited_by_name })
    : t("onboarding.church.subline_no_catalyst");

  return (
    <OnboardingPage
      eyebrow={t("onboarding.church.eyebrow")}
      title={t("onboarding.church.title")}
      subline={subline}
    >
      <FormCard
        title={t("onboarding.church.card_title")}
        description={t("onboarding.church.card_body")}
      >
        <ChurchForm churchName={invitation?.church_name ?? ""} />
      </FormCard>
    </OnboardingPage>
  );
}

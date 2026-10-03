import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { Status } from "@/components/ui/Status";
import { Button } from "@/components/ui/Button";
import { CatalystForm } from "./catalyst-form";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CatalystOnboardingPage({ params }: PageProps) {
  const { locale } = await params;
  const { user, profile } = await requireRole("catalyst", locale);
  const t = await getTranslations();

  if (profile.onboarded_at) {
    redirect({ href: "/", locale });
  }

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.org_id)
    .single();

  const { data: invitation } = hasAdminCredentials() ? await createAdminClient()
    .from("invitations")
    .select("invited_by_name")
    .ilike("email", user.email!)
    .eq("role", "catalyst")
    .not("accepted_at", "is", null)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle() : { data: null };

  const chipText = invitation?.invited_by_name
    ? t("onboarding.catalyst.chip", { name: invitation.invited_by_name })
    : t("invite.catalyst.chip");

  return (
    <OnboardingPage
      eyebrow={t("onboarding.catalyst.eyebrow")}
      title={t("onboarding.catalyst.title")}
      subline={t("onboarding.catalyst.subline")}
    >
      <FormCard
        title={org?.name ?? ""}
        description={t("onboarding.catalyst.card_body")}
      >
        <Status>{chipText}</Status>
        <CatalystForm contactPreference={profile.contact_preference} />
        <Button
          variant="secondary"
          href="/invite-pastor"
          fullWidth={false}
          className="min-w-[222px]"
        >
          {t("onboarding.catalyst.invite")}
        </Button>
      </FormCard>
    </OnboardingPage>
  );
}

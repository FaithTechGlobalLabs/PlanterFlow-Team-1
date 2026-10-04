import { getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { redirect } from "@/i18n/routing";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { AuthSetupPending } from "@/components/auth-setup-pending";
import { getSessionProfile } from "@/lib/auth/session";
import { invitationStatus } from "@/lib/invitations";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { Status } from "@/components/ui/Status";
import { TeamAcceptForm } from "./team-accept-form";

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ s?: string }>;
}

export default async function TeamInviteTokenPage({ params, searchParams }: PageProps) {
  const { locale, token } = await params;
  const { s } = await searchParams;
  if (!hasAdminCredentials()) return <AuthSetupPending />;
  const admin = createAdminClient();
  const t = await getTranslations();

  const { data: invitation } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invitation || invitation.role !== "peer" || !invitation.church_id || invitationStatus(invitation) !== "valid") {
    redirect({ href: "/invite/unavailable", locale });
  }

  const { user, profile } = await getSessionProfile();

  // Opened the shared app link without a session: sign the invitee in (once per visit).
  if (!user && s !== "1") {
    nextRedirect(`/api/invite-session/${token}?locale=${locale}`);
  }
  if (profile) {
    redirect({ href: "/", locale });
  }

  const sessionReady = user?.email?.toLowerCase() === invitation!.email.toLowerCase();
  const church = invitation!.church_name ?? "";

  return (
    <OnboardingPage
      eyebrow={t("invite.eyebrow", { name: invitation!.invited_by_name })}
      title={t("invite.team.title", { church })}
      subline={t("invite.team.subline", { church, pastor: invitation!.invited_by_name })}
    >
      <FormCard
        title={t("invite.team.card_title")}
        description={invitation!.welcome_note ?? t("invite.team.card_body", { name: invitation!.invited_by_name, church })}
      >
        <Status>{t("invite.team.chip")}</Status>
        <TeamAcceptForm token={token} sessionReady={sessionReady} />
      </FormCard>
    </OnboardingPage>
  );
}

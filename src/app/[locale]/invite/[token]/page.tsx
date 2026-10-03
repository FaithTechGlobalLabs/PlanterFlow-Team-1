import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { AuthSetupPending } from "@/components/auth-setup-pending";
import { getSessionProfile } from "@/lib/auth/session";
import { invitationStatus } from "@/lib/invitations";
import { OnboardingPage } from "@/components/onboarding-page";
import { FormCard } from "@/components/ui/FormCard";
import { Status } from "@/components/ui/Status";
import { AcceptForm } from "./accept-form";

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function InviteTokenPage({ params }: PageProps) {
  const { locale, token } = await params;
  if (!hasAdminCredentials()) return <AuthSetupPending />;
  const admin = createAdminClient();
  const t = await getTranslations();

  const { data: invitation } = await admin
    .from("invitations")
    .select("*, organizations(name)")
    .eq("token", token)
    .maybeSingle();

  if (!invitation || invitationStatus(invitation) !== "valid") {
    redirect({ href: "/invite/unavailable", locale });
  }

  const { user, profile } = await getSessionProfile();

  if (profile) {
    redirect({ href: "/", locale });
  }

  const sessionReady = user?.email?.toLowerCase() === invitation.email.toLowerCase();

  const eyebrow = t("invite.eyebrow", { name: invitation.invited_by_name });

  if (invitation.role === "catalyst") {
    return (
      <OnboardingPage
        eyebrow={eyebrow}
        title={t("invite.catalyst.title")}
        subline={t("invite.catalyst.subline")}
      >
        <FormCard
          title={t("invite.catalyst.card_title")}
          description={t("invite.catalyst.card_body", {
            name: invitation.invited_by_name,
            region: invitation.organizations.name,
          })}
        >
          <Status>{t("invite.catalyst.chip")}</Status>
          <AcceptForm token={token} role="catalyst" sessionReady={sessionReady} />
        </FormCard>
      </OnboardingPage>
    );
  }

  const subline = invitation.church_name
    ? t("invite.planter.subline", {
        church: invitation.church_name,
        catalyst: invitation.invited_by_name,
      })
    : t("invite.planter.subline_no_church", {
        catalyst: invitation.invited_by_name,
      });

  return (
    <OnboardingPage
      eyebrow={eyebrow}
      title={t("invite.planter.title")}
      subline={subline}
    >
      <FormCard
        title={t("invite.planter.card_title")}
        description={t("invite.planter.card_body", {
          name: invitation.invited_by_name,
        })}
      >
        <Status>{t("invite.planter.chip")}</Status>
        <AcceptForm token={token} role="planter" sessionReady={sessionReady} />
      </FormCard>
    </OnboardingPage>
  );
}

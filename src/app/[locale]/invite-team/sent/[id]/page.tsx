import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function TeamInvitationSentPage({ params }: PageProps) {
  const { locale, id } = await params;
  await requireRole("planter", locale);
  const t = await getTranslations();

  const supabase = await createClient();
  const { data: invitation } = await supabase
    .from("invitations")
    .select("email")
    .eq("id", id)
    .maybeSingle();

  if (!invitation) {
    redirect({ href: "/invite-team", locale });
  }

  return (
    <StatusPage
      title={t("inviteTeam.sent.title")}
      subline={t("inviteTeam.sent.subline")}
      cardTitle={t("inviteTeam.sent.card_title")}
      cardBody={
        <p className="text-[15px] text-[var(--color-muted)]">
          {t("inviteTeam.sent.card_body", { email: invitation!.email })}
        </p>
      }
      actions={
        <>
          <Button variant="primary" href="/" fullWidth={false} className="min-w-[222px]">
            {t("inviteTeam.sent.primary")}
          </Button>
          <Button variant="secondary" href="/invite-team" fullWidth={false} className="min-w-[222px]">
            {t("inviteTeam.sent.again")}
          </Button>
        </>
      }
    />
  );
}

import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function InvitationSentPage({ params }: PageProps) {
  const { locale, id } = await params;
  await requireAdmin(locale);
  const t = await getTranslations();

  const supabase = await createClient();
  const { data: invitation } = await supabase
    .from("invitations")
    .select("email")
    .eq("id", id)
    .maybeSingle();

  if (!invitation) {
    redirect({ href: "/invite-catalyst", locale });
  }

  return (
    <StatusPage
      title={t("inviteCatalyst.sent.title")}
      subline={t("inviteCatalyst.sent.subline")}
      cardTitle={t("inviteCatalyst.sent.card_title")}
      cardBody={
        <p className="text-[15px] text-[var(--color-muted)]">
          {t("inviteCatalyst.sent.card_body", { email: invitation!.email })}
        </p>
      }
      actions={
        <>
          <Button variant="primary" href="/" fullWidth={false} className="min-w-[222px]">
            {t("inviteCatalyst.sent.primary")}
          </Button>
          <Button variant="secondary" href="/invite-catalyst" fullWidth={false} className="min-w-[222px]">
            {t("inviteCatalyst.sent.again")}
          </Button>
        </>
      }
    />
  );
}

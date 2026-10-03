import { getTranslations } from "next-intl/server";
import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/Button";

export default async function InviteUnavailablePage() {
  const t = await getTranslations();

  return (
    <StatusPage
      title={t("invite.unavailable.title")}
      subline={t("invite.unavailable.subline")}
      cardTitle={t("invite.unavailable.card_title")}
      cardBody={
        <p className="text-[15px] text-[var(--color-muted)]">
          {t("invite.unavailable.card_body")}
        </p>
      }
      actions={
        <Button variant="primary" href="/login" fullWidth={false} className="min-w-[222px]">
          {t("common.back_to_login")}
        </Button>
      }
    />
  );
}

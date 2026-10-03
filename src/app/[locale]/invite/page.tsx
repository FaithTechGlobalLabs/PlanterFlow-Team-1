import { getTranslations } from "next-intl/server";
import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/Button";

export default async function InvitePage() {
  const t = await getTranslations();

  return (
    <StatusPage
      title={t("invite.no_token.title")}
      subline={t("invite.no_token.subline")}
      cardTitle={t("invite.no_token.card_title")}
      cardBody={
        <p className="text-[15px] text-[var(--color-muted)]">
          {t("invite.no_token.card_body")}
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

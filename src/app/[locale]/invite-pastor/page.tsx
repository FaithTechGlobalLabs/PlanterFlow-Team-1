import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { CatalystShell } from "@/components/garden/catalyst-shell";
import { FormCard } from "@/components/ui/FormCard";
import { Button } from "@/components/ui/Button";
import { InvitePastorForm } from "./invite-pastor-form";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function InvitePastorPage({ params }: PageProps) {
  const { locale } = await params;
  const { profile } = await requireRole("catalyst", locale);
  const t = await getTranslations();

  return (
    <CatalystShell
      name={profile.display_name}
      organization="Your garden"
      active="church"
    >
      <header className="garden-heading">
        <div>
          <p className="garden-eyebrow">{t("invitePastor.eyebrow")}</p>
          <h1>{t("invitePastor.title")}</h1>
          <p>{t("invitePastor.subline")}</p>
        </div>
      </header>
      <FormCard
        title={t("invitePastor.card_title")}
        description={t("invitePastor.assigned", { name: profile.display_name })}
      >
        <InvitePastorForm />
      </FormCard>
      <Button
        variant="secondary"
        href="/catalyst"
        fullWidth={false}
        className="min-w-[222px]"
      >
        {t("catalyst.planter.back")}
      </Button>
    </CatalystShell>
  );
}

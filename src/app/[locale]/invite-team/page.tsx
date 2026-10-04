import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PlanterHomeShell } from "@/components/planter/planter-shell";
import { FormCard } from "@/components/ui/FormCard";
import { InviteTeamForm } from "./invite-team-form";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function InviteTeamPage({ params }: PageProps) {
  const { locale } = await params;
  const { user, profile } = await requireRole("planter", locale);
  const t = await getTranslations();

  const supabase = await createClient();
  const { data: church } = await supabase
    .from("churches")
    .select("name")
    .eq("pastor_id", user.id)
    .maybeSingle();
  if (!church) {
    redirect({ href: "/onboarding/church", locale });
  }

  return (
    <PlanterHomeShell name={profile.display_name}>
      <h1 className="text-3xl mb-4">{t("inviteTeam.title")}</h1>
      <p className="mb-6">{t("inviteTeam.subline")}</p>
      <FormCard
        title={t("inviteTeam.card_title")}
        description={t("inviteTeam.assigned", { church: church!.name })}
      >
        <InviteTeamForm />
      </FormCard>
    </PlanterHomeShell>
  );
}

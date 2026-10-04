import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OnboardingPage } from "@/components/onboarding-page";
import { GlobeCard } from "@/components/globe-card";
import { FormCard } from "@/components/ui/FormCard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { signOut } from "../actions";
import { buildGarden, needsPresence } from "./garden-status";
import { ChurchList, StatusBadges } from "./church-list";

interface PageProps {
  params: Promise<{ locale: string }>;
}

function greetingKey(now: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Vancouver" }).format(now),
  );
  if (hour < 12) return "greeting_morning";
  if (hour < 18) return "greeting_afternoon";
  return "greeting_evening";
}

export default async function CatalystGardenPage({ params }: PageProps) {
  const { locale } = await params;
  const { user, profile } = await requireRole("catalyst", locale);
  const t = await getTranslations("catalyst.garden");
  const tHome = await getTranslations("home.catalyst");
  const tCommon = await getTranslations("common");
  const supabase = await createClient();
  const now = new Date();

  // Only churches assigned to this Catalyst.
  const [org, churches] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", profile.org_id).single(),
    supabase
      .from("churches")
      .select("id, name, city, planting_start_date, pastor_id")
      .eq("catalyst_id", user.id),
  ]);

  const pastorIds = (churches.data ?? []).map((c) => c.pastor_id);
  const [pastors, checkIns, objectives] = pastorIds.length
    ? await Promise.all([
        supabase.from("profiles").select("id, display_name").in("id", pastorIds),
        supabase.from("check_ins").select("id, planter_id, support, created_at").in("planter_id", pastorIds),
        supabase.from("objectives").select("id, planter_id").in("planter_id", pastorIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];

  const objectiveIds = (objectives.data ?? []).map((o) => o.id);
  const checkInIds = (checkIns.data ?? []).map((c) => c.id);
  const [progress, acknowledgements] = await Promise.all([
    objectiveIds.length
      ? supabase.from("progress_entries").select("objective_id, created_at").in("objective_id", objectiveIds)
      : { data: [], error: null },
    // Only acknowledgements linked to a check-in count as a review; ordinary goal replies don't.
    checkInIds.length
      ? supabase
          .from("dialogue_messages")
          .select("check_in_id")
          .in("check_in_id", checkInIds)
          .eq("author_id", user.id)
      : { data: [], error: null },
  ]);

  const loadFailed = [churches, pastors, checkIns, objectives, progress, acknowledgements].some((r) => r.error);
  const garden = loadFailed
    ? []
    : buildGarden(
        {
          churches: churches.data ?? [],
          pastors: pastors.data ?? [],
          checkIns: checkIns.data ?? [],
          objectives: objectives.data ?? [],
          progress: progress.data ?? [],
          acknowledgedCheckInIds: (acknowledgements.data ?? []).flatMap((a) => (a.check_in_id ? [a.check_in_id] : [])),
        },
        now,
      );
  const presence = garden.filter(needsPresence);

  return (
    <OnboardingPage
      eyebrow={t("eyebrow", { region: org.data?.name ?? "" })}
      title={t(greetingKey(now), { name: profile.display_name })}
      // Don't report counts we couldn't load.
      subline={
        loadFailed
          ? t("summary_unavailable")
          : t("summary", {
              churches: garden.length,
              support: garden.filter((c) => c.supportRequested).length,
              due: garden.filter((c) => c.replyDue).length,
            })
      }
    >
      {loadFailed && (
        <p role="alert" className="text-[15px] text-[var(--color-ink)]">
          {t("load_error")}
        </p>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div aria-hidden="true">
          <GlobeCard />
        </div>

        <section className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-white p-6 w-full lg:max-w-[460px]">
          <h2 className="text-[22px] font-bold text-[var(--color-ink)]">{t("presence_title")}</h2>
          {loadFailed ? (
            <p className="text-[15px] text-[var(--color-muted)]">{t("presence_unavailable")}</p>
          ) : presence.length === 0 ? (
            <p className="text-[15px] text-[var(--color-muted)]">{t("presence_empty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {presence.map((church) => (
                <li key={church.churchId} className="rounded-[var(--radius-card)] bg-[var(--color-canvas)] p-4 flex flex-col gap-2">
                  <p className="text-[15px] font-bold text-[var(--color-ink)]">
                    {t("church_heading", { church: church.churchName, pastor: church.pastorName })}
                  </p>
                  <StatusBadges church={church} />
                  <Link
                    href={`/catalyst/planters/${church.pastorId}`}
                    className="text-[15px] font-bold text-[var(--color-blue)] underline-offset-4 hover:underline"
                  >
                    {t("open_church", { church: church.churchName })}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Button variant="primary" href="/invite-pastor" fullWidth={false} className="min-w-[222px]">
            {tHome("invite")}
          </Button>
          <a
            href="#churches"
            className="text-[15px] font-bold text-[var(--color-ink)] underline-offset-4 hover:underline"
          >
            {t("view_list")}
          </a>
        </section>
      </div>

      <section id="churches" className="scroll-mt-6">
        <FormCard title={t("list_title")}>
          {!loadFailed && <ChurchList churches={garden} now={now} />}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalyst/categories"
              className="text-[15px] font-bold text-[var(--color-ink)] underline-offset-4 hover:underline"
            >
              {t("manage_categories")}
            </Link>
          </div>
          {profile.is_admin && (
            <Button variant="secondary" href="/invite-catalyst" fullWidth={false} className="min-w-[222px]">
              {tHome("invite_catalyst")}
            </Button>
          )}
          <form action={signOut}>
            <Button variant="secondary" type="submit" fullWidth={false} className="min-w-[222px]">
              {tCommon("sign_out")}
            </Button>
          </form>
        </FormCard>
      </section>
    </OnboardingPage>
  );
}

import {
  ChurchJourney,
  type ChurchMoment,
} from "@/components/garden/church-journey";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  churchGrowth,
  plantingDate,
  isMeaningfulProgress,
} from "@/lib/church-growth";
import { TreeMeaning } from "@/components/garden/tree-meaning";
import { CatalystShell } from "@/components/garden/catalyst-shell";
import { ChurchTree } from "@/components/garden/church-tree";
import { Button } from "@/components/ui/Button";
import { CheckInList, type CheckInView } from "./check-in-list";
import { ObjectiveCard, type ObjectiveView } from "./objective-card";
import { ExportButton } from "./export-button";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function CatalystPlanterPage({ params }: PageProps) {
  const { locale, id } = await params;
  const { user, profile } = await requireRole("catalyst", locale);
  const t = await getTranslations("catalyst.planter");
  const format = await getFormatter();
  const supabase = await createClient();

  // Only the Catalyst assigned to this pastor's church may open it; anything
  // else (another Catalyst's church, another organization) is a 404.
  const [
    { data: church, error: churchError },
    { data: planter, error: planterError },
  ] = await Promise.all([
    supabase
      .from("churches")
      .select("name, city, planting_start_date")
      .eq("pastor_id", id)
      .eq("catalyst_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, display_name, role")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (churchError || planterError) throw new Error(t("load_error"));

  if (!church || !planter || planter.role !== "planter") {
    notFound();
  }

  const [categories, objectives, checkIns] = await Promise.all([
    supabase.from("objective_categories").select("id, title, sort_order"),
    supabase
      .from("objectives")
      .select(
        "id, title, description, category_id, cadence, status, has_completed, first_completed_at, created_at",
      )
      .eq("planter_id", id)
      .order("created_at"),
    supabase
      .from("check_ins")
      .select("id, note, feeling, momentum, support, created_at")
      .eq("planter_id", id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const objectiveIds = (objectives.data ?? []).map((o) => o.id);
  const [progress, messages] = objectiveIds.length
    ? await Promise.all([
        supabase
          .from("progress_entries")
          .select("id, objective_id, author_id, note, value, created_at")
          .in("objective_id", objectiveIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("dialogue_messages")
          .select("id, objective_id, author_id, body, created_at, check_in_id")
          .in("objective_id", objectiveIds)
          .order("created_at"),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];

  const authorIds = [
    ...new Set([
      ...(messages.data ?? []).map((m) => m.author_id),
      ...(progress.data ?? []).map((p) => p.author_id),
    ]),
  ];
  const { data: authors, error: authorsError } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds)
    : { data: [], error: null };
  const authorName = new Map(
    (authors ?? []).map((a) => [a.id, a.display_name]),
  );

  const loadFailed =
    [categories, objectives, checkIns, progress, messages].some(
      (r) => r.error,
    ) || Boolean(authorsError);
  const categoryById = new Map((categories.data ?? []).map((c) => [c.id, c]));
  const views: ObjectiveView[] = (objectives.data ?? [])
    .map((o) => {
      const latest = (progress.data ?? []).find((p) => p.objective_id === o.id);
      return {
        id: o.id,
        title: o.title,
        description: o.description,
        categoryTitle: categoryById.get(o.category_id)?.title ?? "",
        cadence: o.cadence,
        status: o.status,
        latestProgress: latest
          ? {
              note: latest.note,
              value: latest.value,
              createdAt: latest.created_at,
            }
          : null,
        messages: (messages.data ?? [])
          .filter((m) => m.objective_id === o.id)
          .map((m) => ({
            id: m.id,
            authorName: authorName.get(m.author_id) ?? t("unknown_author"),
            mine: m.author_id === user.id,
            body: m.body,
            createdAt: m.created_at,
          })),
        sortOrder: categoryById.get(o.category_id)?.sort_order ?? 0,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const checkInViews: CheckInView[] = (checkIns.data ?? []).map((c) => ({
    id: c.id,
    note: c.note,
    feeling: c.feeling,
    momentum: c.momentum,
    support: c.support,
    createdAt: c.created_at,
  }));

  // Only an acknowledgement linked to the latest check-in counts as reviewing it.
  const latestCheckIn = checkInViews[0];
  const reviewedAt = latestCheckIn
    ? ((messages.data ?? [])
        .filter(
          (m) => m.author_id === user.id && m.check_in_id === latestCheckIn.id,
        )
        .map((m) => m.created_at)
        .sort()
        .at(-1) ?? null)
    : null;
  const objectiveOptions = views.map((o) => ({ id: o.id, title: o.title }));

  const startDate = church.planting_start_date;
  const growth = loadFailed
    ? undefined
    : churchGrowth({
        startDate,
        objectives: objectives.data ?? [],
        progress: progress.data ?? [],
        now: new Date(),
      });
  const moments: ChurchMoment[] = [
    ...(progress.data ?? [])
      .filter((p) => isMeaningfulProgress(p))
      .map((p) => ({
        id: `progress-${p.id}`,
        at: p.created_at,
        actor:
          p.author_id === user.id
            ? "You"
            : p.author_id === id
              ? planter.display_name
              : authorName.get(p.author_id) || "A contributor",
        description: "Recorded progress",
      })),
    ...(messages.data ?? [])
      .filter((m) => m.body.trim())
      .map((m) => ({
        id: `care-${m.id}`,
        at: m.created_at,
        actor:
          m.author_id === user.id
            ? "You"
            : authorName.get(m.author_id) || "A contributor",
        description: m.check_in_id
          ? "Acknowledged a check-in"
          : "Shared a conversation response",
      })),
    ...(objectives.data ?? [])
      .filter((o) => o.has_completed && o.first_completed_at)
      .map((o) => ({
        id: `outcome-${o.id}`,
        at: o.first_completed_at!,
        description: `First completed: ${o.title}`,
      })),
  ];
  const title = t("title", { church: church.name, name: planter.display_name });

  return (
    <CatalystShell
      name={profile.display_name}
      organization="Your garden"
      active="church"
    >
      <header className="garden-heading">
        <div>
          <p className="garden-eyebrow">{t("eyebrow")}</p>
          <h1>{title}</h1>
          <p>{t("subline")}</p>
        </div>
        <Button
          variant="secondary"
          href={`/dashboard?planter=${encodeURIComponent(id)}`}
          fullWidth={false}
        >
          Open church workspace →
        </Button>
      </header>
      <div className="planter-content-layout flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="planter-main-column flex flex-col gap-6 w-full max-w-[720px]">
          {loadFailed ? (
            <p
              role="alert"
              className="planter-error-message text-[15px] text-[var(--color-ink)]"
            >
              {t("load_error")}
            </p>
          ) : (
            <>
              <CheckInList
                checkIns={checkInViews}
                reviewedAt={reviewedAt}
                objectives={objectiveOptions}
              />
              {views.length === 0 ? (
                <p className="planter-empty-message text-[15px] text-[var(--color-muted)]">
                  {t("empty")}
                </p>
              ) : (
                views.map((objective) => (
                  <ObjectiveCard key={objective.id} objective={objective} />
                ))
              )}
            </>
          )}
          {!loadFailed && (
            <ChurchJourney
              moments={moments}
              ownResponses={
                new Set(
                  (messages.data ?? [])
                    .filter((m) => m.author_id === user.id && m.body.trim())
                    .map((m) => m.id),
                ).size
              }
            />
          )}
          <div className="planter-actions-row flex flex-wrap gap-4 items-center">
            <Button
              variant="secondary"
              href="/catalyst"
              fullWidth={false}
              className="planter-back-btn min-w-[222px]"
            >
              {t("back")}
            </Button>
            <ExportButton
              planterId={id}
              label={t("export_pdf")}
              className="planter-export-btn"
            />
          </div>
        </div>

        <div className="planter-sidebar-column flex flex-col gap-6 lg:max-w-[420px]">
          <section className="garden-surface planter-church-card flex flex-col gap-2">
            {growth && (
              <ChurchTree
                completed={growth.completed}
                progress={growth.progress}
                branches={growth.branches}
                stage={growth.stage ?? undefined}
              />
            )}
            {growth && <TreeMeaning growth={growth} />}
            <h2 className="planter-card-title text-[22px] font-bold text-[var(--color-ink)]">
              {t("church_title")}
            </h2>
            <p className="planter-church-name text-[15px] text-[var(--color-ink)]">
              {church.name}
            </p>
            <p className="planter-pastor-name text-[15px] text-[var(--color-muted)]">
              {t("pastor", { name: planter.display_name })}
            </p>
            {church.city && (
              <p className="planter-church-city text-[15px] text-[var(--color-muted)]">
                {church.city}
              </p>
            )}
            <p className="planter-start-date text-[15px] text-[var(--color-muted)]">
              {plantingDate(startDate)
                ? t("planting_start", {
                    date: format.dateTime(plantingDate(startDate)!, {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    }),
                  })
                : t("planting_start_unknown")}
            </p>
          </section>

          <section className="garden-surface planter-care-card flex flex-col gap-4">
            <h2 className="planter-care-title text-[22px] font-bold text-[var(--color-ink)]">
              {t("care_title")}
            </h2>
            <p className="planter-care-item text-[15px] text-[var(--color-muted)]">
              {t("care_owner")}
            </p>
            <p className="planter-care-item text-[15px] text-[var(--color-muted)]">
              {t("care_reply")}
            </p>
            <p className="planter-care-item text-[15px] text-[var(--color-muted)]">
              {t("care_personal")}
            </p>
            <p className="planter-care-item text-[15px] text-[var(--color-muted)]">
              {t("care_no_approval")}
            </p>
          </section>
        </div>
      </div>
    </CatalystShell>
  );
}

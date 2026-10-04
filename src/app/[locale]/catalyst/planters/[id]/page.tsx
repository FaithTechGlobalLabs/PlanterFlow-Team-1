import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { treeStageFromPlantingDate } from "@/lib/tree-stage";
import { CatalystShell } from "@/components/garden/catalyst-shell";
import { ChurchTree } from "@/components/garden/church-tree";
import { Button } from "@/components/ui/Button";
import { CheckInList, type CheckInView } from "./check-in-list";
import { ObjectiveCard, type ObjectiveView } from "./objective-card";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function CatalystPlanterPage({ params }: PageProps) {
  const { locale, id } = await params;
  const { user, profile } = await requireRole("catalyst", locale);
  const t = await getTranslations("catalyst.planter");
  const tStage = await getTranslations("home.planter.stage");
  const format = await getFormatter();
  const supabase = await createClient();

  // Only the Catalyst assigned to this pastor's church may open it; anything
  // else (another Catalyst's church, another organization) is a 404.
  const [{ data: church }, { data: planter }] = await Promise.all([
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

  if (!church || !planter || planter.role !== "planter") {
    notFound();
  }

  const [categories, objectives, checkIns] = await Promise.all([
    supabase.from("objective_categories").select("id, title, sort_order"),
    supabase
      .from("objectives")
      .select("id, title, description, category_id, cadence, status")
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
          .select("objective_id, note, value, created_at")
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

  const authorIds = [...new Set((messages.data ?? []).map((m) => m.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds)
    : { data: [] };
  const authorName = new Map(
    (authors ?? []).map((a) => [a.id, a.display_name]),
  );

  const loadFailed = [
    categories,
    objectives,
    checkIns,
    progress,
    messages,
  ].some((r) => r.error);
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
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-6 w-full max-w-[720px]">
          {loadFailed ? (
            <p role="alert" className="text-[15px] text-[var(--color-ink)]">
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
                <p className="text-[15px] text-[var(--color-muted)]">
                  {t("empty")}
                </p>
              ) : (
                views.map((objective) => (
                  <ObjectiveCard key={objective.id} objective={objective} />
                ))
              )}
            </>
          )}
          <Button
            variant="secondary"
            href="/catalyst"
            fullWidth={false}
            className="min-w-[222px]"
          >
            {t("back")}
          </Button>
        </div>

        <div className="flex flex-col gap-6 lg:max-w-[420px]">
          <section className="garden-surface flex flex-col gap-2">
            <ChurchTree
              completed={views.filter((o) => o.status === "done").length}
            />
            <h2 className="text-[22px] font-bold text-[var(--color-ink)]">
              {t("church_title")}
            </h2>
            <p className="text-[15px] text-[var(--color-ink)]">{church.name}</p>
            <p className="text-[15px] text-[var(--color-muted)]">
              {t("pastor", { name: planter.display_name })}
            </p>
            {church.city && (
              <p className="text-[15px] text-[var(--color-muted)]">
                {church.city}
              </p>
            )}
            <p className="text-[15px] text-[var(--color-muted)]">
              {startDate
                ? t("planting_start", {
                    date: format.dateTime(new Date(`${startDate}T00:00:00`), {
                      dateStyle: "medium",
                    }),
                  })
                : t("planting_start_unknown")}
            </p>
            {startDate && (
              <p className="text-[15px] font-bold text-[var(--color-green)]">
                {tStage(
                  treeStageFromPlantingDate(new Date(`${startDate}T00:00:00`)),
                )}
              </p>
            )}
          </section>

          <section className="garden-surface flex flex-col gap-4">
            <h2 className="text-[22px] font-bold text-[var(--color-ink)]">
              {t("care_title")}
            </h2>
            <p className="text-[15px] text-[var(--color-muted)]">
              {t("care_owner")}
            </p>
            <p className="text-[15px] text-[var(--color-muted)]">
              {t("care_reply")}
            </p>
            <p className="text-[15px] text-[var(--color-muted)]">
              {t("care_personal")}
            </p>
            <p className="text-[15px] text-[var(--color-muted)]">
              {t("care_no_approval")}
            </p>
          </section>
        </div>
      </div>
    </CatalystShell>
  );
}

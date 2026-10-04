import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OnboardingPage } from "@/components/onboarding-page";
import { Button } from "@/components/ui/Button";
import { CategoryManager, type CategoryView } from "./category-manager";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CatalystCategoriesPage({ params }: PageProps) {
  const { locale } = await params;
  await requireRole("catalyst", locale);
  const t = await getTranslations("catalyst.categories");
  const supabase = await createClient();

  const [categories, objectives] = await Promise.all([
    supabase
      .from("objective_categories")
      .select("id, title, description, kind")
      .order("sort_order")
      .order("created_at"),
    supabase.from("objectives").select("category_id"),
  ]);

  const loadFailed = Boolean(categories.error || objectives.error);
  const views: CategoryView[] = (categories.data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    isPrayer: c.kind === "prayer",
    objectiveCount: (objectives.data ?? []).filter((o) => o.category_id === c.id).length,
  }));

  return (
    <OnboardingPage eyebrow={t("eyebrow")} title={t("title")} subline={t("subline")}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-6 w-full max-w-[720px]">
          {loadFailed ? (
            <p role="alert" className="text-[15px] text-[var(--color-ink)]">
              {t("load_error")}
            </p>
          ) : (
            <CategoryManager categories={views} />
          )}
          <Button variant="secondary" href="/catalyst" fullWidth={false} className="min-w-[222px]">
            {t("back")}
          </Button>
        </div>

        <section className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-[var(--color-sage)] p-6 lg:max-w-[420px]">
          <h2 className="text-[22px] font-bold text-[var(--color-ink)]">{t("notes_title")}</h2>
          <p className="text-[15px] text-[var(--color-muted)]">{t("notes_shared")}</p>
          <p className="text-[15px] text-[var(--color-muted)]">{t("notes_delete")}</p>
          <p className="text-[15px] text-[var(--color-muted)]">{t("notes_prayer")}</p>
        </section>
      </div>
    </OnboardingPage>
  );
}

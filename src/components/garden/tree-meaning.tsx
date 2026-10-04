import { useTranslations } from "next-intl";
import type { ChurchGrowth } from "@/lib/church-growth";
import "./tree.css";

export function TreeMeaning({ growth }: { growth?: ChurchGrowth }) {
  const t = useTranslations("tree");
  return (
    <div className="church-growth">
      {growth && (
        <p className="church-growth__summary">
          {growth.stage
            ? growth.planned
              ? t("planned")
              : t(`stage.${growth.stage}`)
            : t("missing_date")}
          {" · "}
          {t("counts", {
            progress: growth.progress,
            completed: growth.completed,
          })}
        </p>
      )}
      <details className="church-growth__meaning">
        <summary>{t("meaning")}</summary>
        <p>{t("roots")}</p>
        <p>{t("age")}</p>
        <p>{t("progress")}</p>
        <p>{t("outcomes")}</p>
        <p>{t("quiet")}</p>
        <p>{t("corrections")}</p>
      </details>
    </div>
  );
}

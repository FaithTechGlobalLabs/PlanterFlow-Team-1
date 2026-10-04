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
        <summary className="church-growth__toggle">{t("meaning")}</summary>
        <p className="church-growth__explanation church-growth__explanation--roots">
          {t("roots")}
        </p>
        <p className="church-growth__explanation church-growth__explanation--age">
          {t("age")}
        </p>
        <p className="church-growth__explanation church-growth__explanation--progress">
          {t("progress")}
        </p>
        <p className="church-growth__explanation church-growth__explanation--outcomes">
          {t("outcomes")}
        </p>
        <p className="church-growth__explanation church-growth__explanation--quiet">
          {t("quiet")}
        </p>
        <p className="church-growth__explanation church-growth__explanation--corrections">
          {t("corrections")}
        </p>
      </details>
    </div>
  );
}

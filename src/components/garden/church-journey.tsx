import { useTranslations } from "next-intl";
import { gardenDate } from "@/lib/workspace/garden";

export type ChurchMoment = {
  id: string;
  at: string;
  description: string;
  actor?: string;
};

/** Authorized metadata only: overview history deliberately excludes private message bodies. */
export function ChurchJourney({
  moments,
  ownResponses,
}: {
  moments: ChurchMoment[];
  ownResponses: number;
}) {
  const t = useTranslations("tree");
  const ordered = [...moments]
    .filter((m) => Number.isFinite(Date.parse(m.at)))
    .sort((a, b) => b.at.localeCompare(a.at));
  return (
    <section className="church-journey" aria-label="Shared church journey">
      <h2>{t("history_title")}</h2>
      <p>{t("responses_count", { count: ownResponses })}</p>
      {ordered.length ? (
        <ol>
          {ordered.slice(0, 12).map((m) => (
            <li key={m.id}>
              <time dateTime={m.at}>{gardenDate(m.at)}</time>
              <p>
                {m.actor ? `${m.actor} · ` : ""}
                {m.description}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p>{t("history_empty")}</p>
      )}
      {ordered.length > 12 && <p>{t("history_recent")}</p>}
    </section>
  );
}

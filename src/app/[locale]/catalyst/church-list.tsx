import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { daysSince, type GardenChurch } from "./garden-status";

export function StatusBadges({ church }: { church: GardenChurch }) {
  const t = useTranslations("catalyst.garden");
  const statusBadge = "status-badge inline-flex items-center h-7 px-3 rounded-full text-[12px] font-bold";

  return (
    <span className="status-badges flex flex-wrap gap-2">
      {church.supportRequested && (
        <span className={`${statusBadge} status-badge-support bg-[var(--color-blue)] text-white`}>{t("support_requested")}</span>
      )}
      {church.replyDue && !church.supportRequested && (
        <span className={`${statusBadge} status-badge-review bg-[var(--color-sage)] text-[var(--color-ink)]`}>{t("review_check_in")}</span>
      )}
      {church.checkInDue && (
        <span className={`${statusBadge} status-badge-due bg-[var(--color-sage)] text-[var(--color-green)]`}>{t("check_in_due")}</span>
      )}
    </span>
  );
}

interface ChurchListProps {
  churches: GardenChurch[];
  now: Date;
}

export function ChurchList({ churches, now }: ChurchListProps) {
  const t = useTranslations("catalyst.garden");
  const tStage = useTranslations("home.planter.stage");

  if (churches.length === 0) {
    return <p className="text-[15px] text-[var(--color-muted)]">{t("empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {churches.map((church) => (
        <li key={church.churchId}>
          <Link
            href={`/catalyst/planters/${church.pastorId}`}
            className="block rounded-[var(--radius-card)] bg-[var(--color-canvas)] p-4 focus-visible:outline-2 focus-visible:outline-[var(--color-blue)]"
          >
            <p className="text-[17px] font-bold text-[var(--color-ink)]">
              {t("church_heading", { church: church.churchName, pastor: church.pastorName })}
            </p>
            <p className="text-[15px] text-[var(--color-muted)]">
              {[church.city, church.stage && tStage(church.stage)].filter(Boolean).join(" · ")}
            </p>
            <p className="text-[15px] text-[var(--color-muted)]">
              {church.lastActivityAt
                ? t("last_activity", { days: daysSince(church.lastActivityAt, now) })
                : t("last_activity_none")}
            </p>
            <span className="mt-2 block">
              <StatusBadges church={church} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

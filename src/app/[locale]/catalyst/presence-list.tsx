import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { StatusBadges } from "./church-list";
import type { GardenChurch } from "./garden-status";

interface PresenceListProps {
  presence: GardenChurch[];
}

export function PresenceList({ presence }: PresenceListProps) {
  const t = useTranslations("catalyst.garden");

  return (
    <ul className="catalyst-presence-list flex flex-col gap-3">
      {presence.map((church) => (
        <li key={church.churchId}>
          <Link
            href={`/catalyst/planters/${church.pastorId}`}
            className="catalyst-presence-card group rounded-[var(--radius-card)] bg-[var(--color-canvas)] p-4 flex flex-col gap-2 transition-colors hover:bg-[var(--color-sage)]/30 focus-visible:outline-2 focus-visible:outline-[var(--color-blue)]"
          >
            <p className="catalyst-church-heading text-[15px] font-bold text-[var(--color-ink)] group-hover:text-[var(--color-blue)]">
              {t("church_heading", { church: church.churchName, pastor: church.pastorName })}
            </p>
            <StatusBadges church={church} />
            <span className="catalyst-open-church-link text-[15px] font-bold text-[var(--color-blue)] underline-offset-4 group-hover:underline">
              {t("open_church", { church: church.churchName })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

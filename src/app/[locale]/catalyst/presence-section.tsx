import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { PresenceList } from "./presence-list";
import type { GardenChurch } from "./garden-status";

interface PresenceSectionProps {
  presence: GardenChurch[];
  loadFailed: boolean;
}

export function PresenceSection({ presence, loadFailed }: PresenceSectionProps) {
  const t = useTranslations("catalyst.garden");
  const tHome = useTranslations("home.catalyst");

  return (
    <section className="catalyst-presence-section flex flex-col gap-4 rounded-[var(--radius-card)] bg-white p-6 w-full lg:max-w-[460px]">
      <h2 className="catalyst-presence-title text-[22px] font-bold text-[var(--color-ink)]">
        {t("presence_title")}
      </h2>
      {loadFailed ? (
        <p className="catalyst-presence-unavailable text-[15px] text-[var(--color-muted)]">
          {t("presence_unavailable")}
        </p>
      ) : presence.length === 0 ? (
        <p className="catalyst-presence-empty text-[15px] text-[var(--color-muted)]">
          {t("presence_empty")}
        </p>
      ) : (
        <PresenceList presence={presence} />
      )}
      <Button
        variant="primary"
        href="/invite-pastor"
        fullWidth={false}
        className="catalyst-invite-pastor-btn min-w-[222px]"
      >
        {tHome("invite")}
      </Button>
      <a
        href="#churches"
        className="catalyst-view-list-link text-[15px] font-bold text-[var(--color-ink)] underline-offset-4 hover:underline"
      >
        {t("view_list")}
      </a>
    </section>
  );
}

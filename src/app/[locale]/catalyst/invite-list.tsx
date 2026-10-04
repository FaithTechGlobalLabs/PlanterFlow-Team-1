import { useFormatter, useTranslations } from "next-intl";
import type { InviteView } from "./invite-status";

const badgeClass: Record<InviteView["status"], string> = {
  pending: "bg-[var(--color-sage)] text-[var(--color-green)]",
  accepted: "bg-[var(--color-canvas)] text-[var(--color-muted)]",
  expired: "bg-[var(--color-canvas)] text-[var(--color-ink)]",
};

export function InviteList({ invites }: { invites: InviteView[] }) {
  const t = useTranslations("catalyst.invites");
  const format = useFormatter();

  if (invites.length === 0) {
    return <p className="text-[15px] text-[var(--color-muted)]">{t("empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {invites.map((invite) => (
        <li
          key={invite.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-card)] bg-[var(--color-canvas)] p-4"
        >
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[var(--color-ink)] break-all">{invite.email}</p>
            <p className="text-[13px] text-[var(--color-muted)]">
              {invite.churchName
                ? t("sent_with_church", {
                    church: invite.churchName,
                    date: format.dateTime(new Date(invite.sentAt), { dateStyle: "medium" }),
                  })
                : t("sent", { date: format.dateTime(new Date(invite.sentAt), { dateStyle: "medium" }) })}
            </p>
          </div>
          <span className={`inline-flex items-center h-7 px-3 rounded-full text-[12px] font-bold ${badgeClass[invite.status]}`}>
            {t(`status.${invite.status}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { InviteView } from "./invite-status";

const statusBadgeVariant: Record<InviteView["status"], string> = {
  pending: "status-badge-pending bg-amber-100 text-amber-900 border border-amber-200",
  accepted: "status-badge-accepted bg-emerald-100 text-emerald-800 border border-emerald-200",
  expired: "status-badge-expired bg-red-100 text-red-800 border border-red-200",
};

export function InviteList({ invites }: { invites: InviteView[] }) {
  const t = useTranslations("catalyst.invites");
  const format = useFormatter();
  const [query, setQuery] = useState("");

  if (invites.length === 0) {
    return <p className="text-[15px] text-[var(--color-muted)]">{t("empty")}</p>;
  }

  const filtered = invites.filter((invite) => {
    const q = query.toLowerCase();
    const statusText = t.has(`status.${invite.status}`) ? t(`status.${invite.status}`).toLowerCase() : "";
    return (
      invite.email.toLowerCase().includes(q) ||
      (invite.churchName && invite.churchName.toLowerCase().includes(q)) ||
      statusText.includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-3">
      <label className="invite-search-label relative flex items-center">
        <span className="sr-only">{t("search_placeholder")}</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search_placeholder")}
          className="invite-search-input w-full rounded-[var(--radius-card)] border border-[var(--color-sage-dark,#c2cca9)] bg-[var(--color-canvas)] px-3.5 py-2 text-[14px] text-[var(--color-ink)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green)]"
        />
      </label>

      {filtered.length === 0 ? (
        <p className="text-[15px] text-[var(--color-muted)] py-2">{t("no_matches")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((invite) => (
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
              <span className={`status-badge inline-flex items-center h-7 px-3 rounded-full text-[12px] font-bold ${statusBadgeVariant[invite.status]}`}>
                {t(`status.${invite.status}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

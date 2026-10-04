import { useFormatter, useTranslations } from "next-intl";
import { ReviewForm } from "./review-form";

export type CheckInView = {
  id: string;
  note: string;
  feeling: string;
  momentum: string;
  support: string;
  createdAt: string;
};

interface CheckInListProps {
  checkIns: CheckInView[];
  // When this Catalyst last replied after the latest check-in; null if not yet.
  reviewedAt: string | null;
  objectives: { id: string; title: string }[];
}

// Pastor check-ins, newest first. These are the records the Pastor journey creates.
export function CheckInList({ checkIns, reviewedAt, objectives }: CheckInListProps) {
  const t = useTranslations("catalyst.planter");
  const format = useFormatter();
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium" });

  return (
    <section className="check-in-list bg-white rounded-[var(--radius-card)] p-6 flex flex-col gap-4 w-full max-w-[720px]">
      <h2 className="check-in-list-title text-[22px] font-bold text-[var(--color-ink)]">{t("check_ins")}</h2>
      {checkIns.length === 0 ? (
        <p className="check-in-empty text-[15px] text-[var(--color-muted)]">{t("no_check_ins")}</p>
      ) : (
        <ol className="check-in-items flex flex-col gap-3">
          {checkIns.map((checkIn, index) => (
            <li key={checkIn.id} className="check-in-item rounded-[var(--radius-card)] bg-[var(--color-canvas)] p-4 flex flex-col gap-1">
              <p className="check-in-date text-[17px] font-bold text-[var(--color-ink)]">
                {index === 0 ? t("latest_check_in") : t("earlier_check_in")} · {date(checkIn.createdAt)}
              </p>
              <p className="check-in-mood text-[15px] text-[var(--color-muted)]">
                {t("check_in_mood", { feeling: checkIn.feeling, momentum: checkIn.momentum })}
              </p>
              <p className="check-in-note text-[15px] text-[var(--color-ink)] whitespace-pre-wrap">{checkIn.note}</p>
              {checkIn.support && (
                <p className="check-in-support text-[15px] text-[var(--color-ink)]">
                  <span className="check-in-support-label font-bold">{t("support_needed")}</span> {checkIn.support}
                </p>
              )}
              {index === 0 && (
                <div className="check-in-review-section mt-3 flex flex-col gap-3">
                  <p className="check-in-review-status text-[13px] font-bold text-[var(--color-green)]">
                    {reviewedAt ? t("reviewed_on", { date: date(reviewedAt) }) : t("needs_review")}
                  </p>
                  <ReviewForm checkInId={checkIn.id} objectives={objectives} />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

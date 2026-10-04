import { normalizeObjectiveStatus, type ObjectiveStatus } from "@/lib/workspace/objective-status";
import { useFormatter, useTranslations } from "next-intl";
import { ReplyForm } from "./reply-form";

export type MessageView = {
  id: string;
  authorName: string;
  mine: boolean;
  body: string;
  createdAt: string;
};

export type ObjectiveView = {
  id: string;
  title: string;
  description: string | null;
  categoryTitle: string;
  cadence: "weekly" | "monthly";
  status: ObjectiveStatus | "active" | "paused" | "done";
  latestProgress: { note: string; value: number | null; createdAt: string } | null;
  messages: MessageView[];
};

// The planter owns objective and activity edits; the Catalyst reads and replies.
export function ObjectiveCard({ objective }: { objective: ObjectiveView }) {
  const t = useTranslations("catalyst.planter");
  const format = useFormatter();
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium" });

  return (
    <article className="objective-card bg-white rounded-[var(--radius-card)] p-6 flex flex-col gap-4 w-full max-w-[720px]">
      <h2 className="objective-title text-[22px] font-bold text-[var(--color-ink)]">{objective.title}</h2>
      <div className="objective-plan-details rounded-[var(--radius-card)] bg-[var(--color-canvas)] p-4">
        <p className="objective-plan-heading text-[17px] font-bold text-[var(--color-ink)]">
          {t("plan_heading", {
            category: objective.categoryTitle,
            cadence: t(`cadence.${objective.cadence}`),
          })}
          {` · ${t(`status.${normalizeObjectiveStatus(objective.status)}`)}`}
        </p>
        {objective.description && (
          <p className="objective-plan-description text-[15px] text-[var(--color-muted)]">{objective.description}</p>
        )}
      </div>

      <div className="objective-progress-details rounded-[var(--radius-card)] bg-[var(--color-canvas)] p-4">
        {objective.latestProgress ? (
          <>
            <p className="objective-progress-date text-[17px] font-bold text-[var(--color-ink)]">
              {t("latest_progress", { date: date(objective.latestProgress.createdAt) })}
            </p>
            <p className="objective-progress-note text-[15px] text-[var(--color-muted)]">
              {objective.latestProgress.note}
              {objective.latestProgress.value !== null &&
                ` ${t("progress_value", { value: objective.latestProgress.value })}`}
            </p>
          </>
        ) : (
          <p className="objective-no-progress text-[15px] text-[var(--color-muted)]">{t("no_progress")}</p>
        )}
      </div>

      <section aria-label={t("dialogue_label", { title: objective.title })} className="objective-dialogue-section flex flex-col gap-3">
        <h3 className="objective-dialogue-title text-[15px] font-bold text-[var(--color-ink)]">{t("dialogue")}</h3>
        {objective.messages.length === 0 ? (
          <p className="objective-no-messages text-[15px] text-[var(--color-muted)]">{t("no_messages")}</p>
        ) : (
          <ol className="objective-message-list flex flex-col gap-2">
            {objective.messages.map((message) => (
              <li key={message.id} className="objective-message-item rounded-[var(--radius-card)] border border-[var(--color-border)] p-3">
                <p className="objective-message-meta text-[13px] font-bold text-[var(--color-ink)]">
                  {message.mine ? t("you") : message.authorName} ·{" "}
                  {format.dateTime(new Date(message.createdAt), { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <p className="objective-message-body text-[15px] text-[var(--color-ink)] whitespace-pre-wrap">{message.body}</p>
              </li>
            ))}
          </ol>
        )}
        <ReplyForm objectiveId={objective.id} />
      </section>
    </article>
  );
}

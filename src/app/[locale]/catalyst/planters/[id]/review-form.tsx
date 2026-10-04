"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Select } from "@/components/ui/Select";
import { labelClassName } from "@/components/ui/field-styles";
import { acknowledgeCheckIn, type ReplyState } from "./actions";
import { REPLY_MAX } from "./limits";

interface ReviewFormProps {
  checkInId: string;
  objectives: { id: string; title: string }[];
}

export function ReviewForm({ checkInId, objectives }: ReviewFormProps) {
  const t = useTranslations("catalyst.planter");
  const [state, formAction, isPending] = useActionState<ReplyState, FormData>(acknowledgeCheckIn, {});

  if (objectives.length === 0) {
    return <p className="text-[13px] text-[var(--color-muted)]">{t("review_needs_goal")}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="checkInId" value={checkInId} />
      <label htmlFor="review-note" className={labelClassName}>
        {t("review_label")}
      </label>
      <textarea
        id="review-note"
        name="body"
        required
        maxLength={REPLY_MAX}
        defaultValue={state.ok ? "" : (state.body ?? "")}
        placeholder={t("review_placeholder")}
        className="w-full min-h-[96px] p-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white text-[var(--color-ink)] placeholder-[var(--color-muted)] text-[13px]"
      />
      {objectives.length > 1 && (
        <Select
          id="review-objective"
          name="objectiveId"
          label={t("review_objective_label")}
        >
          {objectives.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </Select>
      )}
      {objectives.length === 1 && <input type="hidden" name="objectiveId" value={objectives[0].id} />}
      <FormError>{state.error && t(`errors.${state.error}`)}</FormError>
      {state.ok && (
        <p role="status" className="text-[13px] text-[var(--color-green)]">
          {t("review_sent")}
        </p>
      )}
      <Button variant="primary" type="submit" fullWidth={false} className="min-w-[222px]" disabled={isPending}>
        {isPending ? t("sending") : t("review_submit")}
      </Button>
    </form>
  );
}

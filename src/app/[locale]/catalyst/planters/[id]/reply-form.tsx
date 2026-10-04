"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { labelClassName } from "@/components/ui/field-styles";
import { sendReply, type ReplyState } from "./actions";
import { REPLY_MAX } from "./limits";

export function ReplyForm({ objectiveId }: { objectiveId: string }) {
  const t = useTranslations("catalyst.planter");
  const [state, formAction, isPending] = useActionState<ReplyState, FormData>(sendReply, {});
  const fieldId = `reply-${objectiveId}`;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="objectiveId" value={objectiveId} />
      <label htmlFor={fieldId} className={labelClassName}>
        {t("reply_label")}
      </label>
      <textarea
        id={fieldId}
        name="body"
        required
        maxLength={REPLY_MAX}
        defaultValue={state.ok ? "" : (state.body ?? "")}
        placeholder={t("reply_placeholder")}
        className="w-full min-h-[96px] p-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white text-[var(--color-ink)] placeholder-[var(--color-muted)] text-[13px]"
      />
      <FormError>{state.error && t(`errors.${state.error}`)}</FormError>
      {state.ok && (
        <p role="status" className="text-[13px] text-[var(--color-green)]">
          {t("reply_sent")}
        </p>
      )}
      <Button variant="primary" type="submit" fullWidth={false} className="min-w-[222px]" disabled={isPending}>
        {isPending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}

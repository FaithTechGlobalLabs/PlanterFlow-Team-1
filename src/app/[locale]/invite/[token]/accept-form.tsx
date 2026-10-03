"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { acceptInvitation } from "./actions";

interface AcceptFormProps {
  token: string;
  role: "catalyst" | "planter";
  sessionReady: boolean;
}

export function AcceptForm({ token, role, sessionReady }: AcceptFormProps) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState<{ error?: string }, FormData>(
    acceptInvitation,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <Input
        name="name"
        label={t("invite.name_label")}
        placeholder={t("invite.name_placeholder")}
        required
      />

      {role === "catalyst" && (
        <Select name="locale" label={t("invite.language_label")}>
          <option value="en">{t("common.language_english")}</option>
        </Select>
      )}

      <Input
        name="password"
        type="password"
        label={t("invite.password_label")}
        placeholder={t("invite.password_placeholder")}
        required
        minLength={8}
      />

      <FormError>{state?.error && t(state.error)}</FormError>

      <Button
        variant="primary"
        type="submit"
        fullWidth={false}
        className="min-w-[222px]"
        disabled={isPending || !sessionReady}
      >
        {t("invite.submit")}
      </Button>

      <p className="text-[12px] text-[var(--color-muted)]">
        {t("invite.footnote")}
      </p>

      {!sessionReady && (
        <p className="text-[12px] text-[var(--color-muted)]">
          {t("invite.session_note")}
        </p>
      )}
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { InviteLinkNotice } from "@/components/invite-link-notice";
import { FormError } from "@/components/ui/FormError";
import { labelClassName } from "@/components/ui/field-styles";
import { inviteCatalyst } from "./actions";

export function InviteCatalystForm() {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState<{ error?: string; inviteLink?: string; email?: string }, FormData>(
    inviteCatalyst,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        name="email"
        type="email"
        label={t("inviteCatalyst.email_label")}
        placeholder={t("inviteCatalyst.email_placeholder")}
        required
      />

      <Input
        name="welcomeNote"
        label={t("inviteCatalyst.welcome_label")}
        placeholder={t("inviteCatalyst.welcome_placeholder")}
      />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="makeAdmin"
          id="makeAdmin"
          className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-ink)]"
        />
        <label htmlFor="makeAdmin" className={labelClassName}>
          {t("inviteCatalyst.admin_checkbox")}
        </label>
      </div>

      <FormError>{state?.error && t(state.error)}</FormError>

      {state?.inviteLink && (
        <InviteLinkNotice link={state.inviteLink} email={state.email ?? ""} />
      )}

      <Button
        variant="primary"
        type="submit"
        fullWidth={false}
        className="min-w-[222px]"
        disabled={isPending}
      >
        {t("inviteCatalyst.submit")}
      </Button>

      <p className="text-[12px] text-[var(--color-muted)]">
        {t("inviteCatalyst.footnote")}
      </p>
    </form>
  );
}

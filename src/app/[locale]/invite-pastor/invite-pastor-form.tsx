"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { InviteLinkNotice } from "@/components/invite-link-notice";
import { FormError } from "@/components/ui/FormError";
import { invitePastor } from "./actions";

export function InvitePastorForm() {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState<{ error?: string; inviteLink?: string; email?: string }, FormData>(
    invitePastor,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        name="email"
        type="email"
        label={t("invitePastor.email_label")}
        placeholder={t("invitePastor.email_placeholder")}
        required
      />

      <Input
        name="churchName"
        label={t("invitePastor.church_label")}
        placeholder={t("invitePastor.church_placeholder")}
      />

      <Input
        name="welcomeNote"
        label={t("invitePastor.welcome_label")}
        placeholder={t("invitePastor.welcome_placeholder")}
      />

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
        {t("invitePastor.submit")}
      </Button>

      <p className="text-[12px] text-[var(--color-muted)]">
        {t("invitePastor.footnote")}
      </p>
    </form>
  );
}

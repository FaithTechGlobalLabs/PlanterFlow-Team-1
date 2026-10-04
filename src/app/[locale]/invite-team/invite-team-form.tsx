"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { InviteLinkNotice } from "@/components/invite-link-notice";
import { FormError } from "@/components/ui/FormError";
import { inviteTeamMember } from "./actions";

export function InviteTeamForm() {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState<{ error?: string; inviteLink?: string; email?: string }, FormData>(
    inviteTeamMember,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        name="email"
        type="email"
        label={t("inviteTeam.email_label")}
        placeholder={t("inviteTeam.email_placeholder")}
        required
      />

      <Input
        name="welcomeNote"
        label={t("inviteTeam.welcome_label")}
        placeholder={t("inviteTeam.welcome_placeholder")}
      />

      <FormError>{state?.error && t(state.error)}</FormError>

      {state?.inviteLink && (
        <InviteLinkNotice link={state.inviteLink} email={state.email ?? ""} />
      )}

      <Button variant="primary" type="submit" fullWidth={false} className="min-w-[222px]" disabled={isPending}>
        {t("inviteTeam.submit")}
      </Button>

      <p className="text-[12px] text-[var(--color-muted)]">{t("inviteTeam.footnote")}</p>
    </form>
  );
}

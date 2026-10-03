"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { requestPasswordReset, updatePassword } from "./actions";

export function RecoveryForm({ update = false, invalidLink = false }: { update?: boolean; invalidLink?: boolean }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(update ? updatePassword : requestPasswordReset, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.sent || state.updated ? (
        <p role="status">{t(state.updated ? "recover.updated" : "recover.sent")}</p>
      ) : (
        <>
          {update ? (
            <>
              <Input name="password" type="password" autoComplete="new-password" minLength={8} label={t("recover.password")} required />
              <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} label={t("recover.confirm_password")} required />
            </>
          ) : (
            <Input name="email" type="email" autoComplete="email" label={t("login.email_label")} required />
          )}
          <FormError>{state.error ? t(state.error) : invalidLink ? t("recover.errors.link") : null}</FormError>
          <Button variant="primary" type="submit" disabled={pending}>
            {t(pending ? "recover.saving" : update ? "recover.save" : "recover.send")}
          </Button>
        </>
      )}
      <Link href={state.updated ? "/" : "/login"} className="text-sm underline">
        {t(state.updated ? "recover.continue" : "common.back_to_login")}
      </Link>
    </form>
  );
}

"use client";

import { useState, useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { signIn } from "./actions";
import { Link } from "@/i18n/routing";

export function LoginForm() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [state, formAction, isPending] = useActionState<{ error?: string }, FormData>(signIn, {});

  return (
    <form action={formAction} aria-busy={isPending} className="login-form">
      <h2 className="text-[22px] font-bold text-[var(--color-ink)]">
        {t("login.welcome_back")}
      </h2>
      <p className="text-[15px] text-[var(--color-muted)] mb-4">
        {t("login.your_journey")}
      </p>

      <Input
        name="email"
        type="email"
        autoComplete="email"
        label={t("login.email_label")}
        placeholder={t("login.email_placeholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        name="password"
        type="password"
        autoComplete="current-password"
        label={t("login.password_label")}
        placeholder={t("login.password_placeholder")}
        required
      />

      <FormError>{state?.error && t(state.error)}</FormError>

      <Button
        variant="primary"
        type="submit"
        disabled={isPending}
      >
        {isPending ? t("login.signing_in") : t("login.sign_in")}
      </Button>

      <Link href="/recover" className="text-sm text-[var(--color-blue)] underline">
        {t("login.forgot_password")}
      </Link>

      <Button
        variant="secondary"
        href="/invite"
      >
        {t("login.accept_invitation")}
      </Button>

      <p className="text-[12px] text-[var(--color-muted)] text-center">
        {t("login.invitation_note")}
      </p>
    </form>
  );
}

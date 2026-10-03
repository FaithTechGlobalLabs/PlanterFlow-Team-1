"use client";

import { useState, useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { signIn } from "./actions";

export function LoginForm() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [state, formAction, isPending] = useActionState<{ error?: string }, FormData>(signIn, {});

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full md:w-[450px] bg-white p-6 rounded-[var(--radius-card)]">
      <h2 className="text-[22px] font-bold text-[var(--color-ink)]">
        {t("login.welcome_back")}
      </h2>
      <p className="text-[15px] text-[var(--color-muted)] mb-4">
        {t("login.your_journey")}
      </p>

      <Input
        name="email"
        type="email"
        label={t("login.email_label")}
        placeholder={t("login.email_placeholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        name="password"
        type="password"
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
        {isPending ? "Signing in..." : t("login.sign_in")}
      </Button>

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

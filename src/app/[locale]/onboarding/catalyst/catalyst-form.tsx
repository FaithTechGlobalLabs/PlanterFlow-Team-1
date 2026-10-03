"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { completeCatalystOnboarding } from "./actions";

interface CatalystFormProps {
  contactPreference: string | null;
}

export function CatalystForm({ contactPreference }: CatalystFormProps) {
  const t = useTranslations();
  const [, formAction, isPending] = useActionState<{ error?: string }, FormData>(
    completeCatalystOnboarding,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        name="contactPreference"
        label={t("onboarding.catalyst.contact_label")}
        placeholder={t("onboarding.catalyst.contact_placeholder")}
        defaultValue={contactPreference || ""}
      />

      <Button
        variant="primary"
        type="submit"
        fullWidth={false}
        className="min-w-[222px]"
        disabled={isPending}
      >
        {t("onboarding.catalyst.submit")}
      </Button>
    </form>
  );
}

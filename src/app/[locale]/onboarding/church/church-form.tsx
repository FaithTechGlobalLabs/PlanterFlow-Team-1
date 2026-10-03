"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { saveChurch } from "./actions";

interface ChurchFormProps {
  churchName: string;
}

export function ChurchForm({ churchName }: ChurchFormProps) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState<{ error?: string }, FormData>(
    saveChurch,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        name="name"
        label={t("onboarding.church.name_label")}
        placeholder={t("onboarding.church.name_placeholder")}
        defaultValue={churchName}
        required
      />

      <Input
        name="city"
        label={t("onboarding.church.city_label")}
        placeholder={t("onboarding.church.city_placeholder")}
        required
      />

      <Input
        name="plantingStartDate"
        type="date"
        label={t("onboarding.church.start_label")}
        required
      />

      <Input
        name="vision"
        label={t("onboarding.church.vision_label")}
        placeholder={t("onboarding.church.vision_placeholder")}
      />

      <FormError>{state?.error && t(state.error)}</FormError>

      <Button
        variant="primary"
        type="submit"
        fullWidth={false}
        className="min-w-[222px]"
        disabled={isPending}
      >
        {t("onboarding.church.submit")}
      </Button>
    </form>
  );
}

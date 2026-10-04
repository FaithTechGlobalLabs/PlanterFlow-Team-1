"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Status } from "@/components/ui/Status";
import { labelClassName } from "@/components/ui/field-styles";
import { createFirstGoal } from "./actions";

interface Category {
  id: string;
  title: string;
}

interface FirstGoalFormProps {
  categories: Category[];
}

export function FirstGoalForm({ categories }: FirstGoalFormProps) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState<
    { error?: string },
    FormData
  >(createFirstGoal, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset className="ff-category-choice">
        <legend className={labelClassName}>
          {t("onboarding.firstGoal.category_label")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <label key={category.id}>
              <input
                type="radio"
                name="categoryId"
                value={category.id}
                className="peer sr-only"
                defaultChecked={index === 0}
                required
              />
              <Status className="cursor-pointer min-w-0 opacity-60 peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-[var(--color-green)] peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--color-green)] peer-focus-visible:outline-offset-4">
                {category.title}
              </Status>
            </label>
          ))}
        </div>
      </fieldset>

      <Input
        name="title"
        label={t("onboarding.firstGoal.goal_label")}
        placeholder={t("onboarding.firstGoal.goal_placeholder")}
        required
      />

      <Input
        name="dueDate"
        type="date"
        label={t("onboarding.firstGoal.due_label")}
        required
      />

      <Input
        name="checkpoint"
        label={t("onboarding.firstGoal.checkpoint_label")}
        placeholder={t("onboarding.firstGoal.checkpoint_placeholder")}
      />

      <p className="text-[12px] text-[var(--color-muted)]">
        {t("onboarding.firstGoal.note")}
      </p>

      <FormError>{state?.error && t(state.error)}</FormError>

      <Button
        variant="primary"
        type="submit"
        fullWidth={false}
        className="min-w-[222px]"
        disabled={isPending}
      >
        {t("onboarding.firstGoal.submit")}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { labelClassName } from "@/components/ui/field-styles";
import {
  addCategory,
  deleteCategory,
  moveCategory,
  updateCategory,
  type CategoryFormState,
} from "./actions";
import { DESCRIPTION_MAX, TITLE_MAX } from "./validation";

export type CategoryView = {
  id: string;
  title: string;
  description: string | null;
  isPrayer: boolean;
  objectiveCount: number;
};

const textareaClassName =
  "w-full min-h-[96px] p-4 rounded-[var(--radius-card)] border border-[var(--color-control-border)] bg-[var(--color-surface)] text-[var(--color-ink)] placeholder-[var(--color-muted)] text-base";

const smallButtonClassName =
  "h-11 px-4 rounded-[var(--radius-card)] bg-[var(--color-sage)] text-[13px] font-bold text-[var(--color-ink)] disabled:opacity-50";

export function CategoryManager({
  categories,
}: {
  categories: CategoryView[];
}) {
  const t = useTranslations("catalyst.categories");

  return (
    <div className="flex flex-col gap-6 w-full max-w-[720px]">
      {categories.length === 0 ? (
        <p className="text-[15px] text-[var(--color-muted)]">{t("empty")}</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {categories.map((category, index) => (
            <CategoryItem
              key={category.id}
              category={category}
              isFirst={index === 0}
              isLast={index === categories.length - 1}
            />
          ))}
        </ol>
      )}
      <AddCategoryForm />
    </div>
  );
}

function CategoryFields({
  idPrefix,
  values,
}: {
  idPrefix: string;
  values?: CategoryFormState["values"];
}) {
  const t = useTranslations("catalyst.categories");

  return (
    <>
      <Input
        id={`${idPrefix}-title`}
        name="title"
        label={t("title_label")}
        defaultValue={values?.title ?? ""}
        maxLength={TITLE_MAX}
        required
      />
      <div className="w-full">
        <label htmlFor={`${idPrefix}-description`} className={labelClassName}>
          {t("description_label")}
        </label>
        <textarea
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={values?.description ?? ""}
          maxLength={DESCRIPTION_MAX}
          className={textareaClassName}
        />
      </div>
    </>
  );
}

function AddCategoryForm() {
  const t = useTranslations("catalyst.categories");
  const [state, formAction, isPending] = useActionState<
    CategoryFormState,
    FormData
  >(addCategory, {});

  return (
    <form
      action={formAction}
      className="bg-white rounded-[var(--radius-card)] p-6 flex flex-col gap-4"
    >
      <h2 className="text-[22px] font-bold text-[var(--color-ink)]">
        {t("add_title")}
      </h2>
      <CategoryFields
        idPrefix="new-category"
        values={state.ok ? undefined : state.values}
      />
      <FormError>{state.error && t(`errors.${state.error}`)}</FormError>
      {state.ok && (
        <p role="status" className="text-[13px] text-[var(--color-green)]">
          {t("added")}
        </p>
      )}
      <Button
        variant="primary"
        type="submit"
        fullWidth={false}
        className="min-w-[222px]"
        disabled={isPending}
      >
        {isPending ? t("saving") : t("add")}
      </Button>
    </form>
  );
}

function CategoryItem({
  category,
  isFirst,
  isLast,
}: {
  category: CategoryView;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations("catalyst.categories");
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [moveState, moveAction, isMoving] = useActionState<
    CategoryFormState,
    FormData
  >(moveCategory, {});
  const [deleteState, deleteAction, isDeleting] = useActionState<
    CategoryFormState,
    FormData
  >(deleteCategory, {});
  const inUse = category.objectiveCount > 0;
  const canDelete = !inUse && !category.isPrayer;

  if (editing) {
    return (
      <li>
        <EditCategoryForm
          category={category}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="bg-white rounded-[var(--radius-card)] p-6 flex flex-col gap-3">
      <h2 className="text-[17px] font-bold text-[var(--color-ink)]">
        {category.title}
      </h2>
      {category.description && (
        <p className="text-[15px] text-[var(--color-muted)]">
          {category.description}
        </p>
      )}
      <p className="text-[13px] text-[var(--color-muted)]">
        {category.isPrayer
          ? t("prayer_kind")
          : t("objective_count", { count: category.objectiveCount })}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={smallButtonClassName}
          onClick={() => setEditing(true)}
        >
          {t("edit")}
        </button>
        <form action={moveAction}>
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            className={smallButtonClassName}
            disabled={isFirst || isMoving}
            aria-label={t("move_up_label", { title: category.title })}
          >
            {t("move_up")}
          </button>
        </form>
        <form action={moveAction}>
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            className={smallButtonClassName}
            disabled={isLast || isMoving}
            aria-label={t("move_down_label", { title: category.title })}
          >
            {t("move_down")}
          </button>
        </form>
        {!confirmingDelete && (
          <button
            type="button"
            className={smallButtonClassName}
            disabled={!canDelete}
            onClick={() => setConfirmingDelete(true)}
          >
            {t("delete")}
          </button>
        )}
      </div>

      {category.isPrayer ? (
        <p className="text-[13px] text-[var(--color-muted)]">
          {t("delete_blocked_prayer")}
        </p>
      ) : (
        inUse && (
          <p className="text-[13px] text-[var(--color-muted)]">
            {t("delete_blocked")}
          </p>
        )
      )}

      {confirmingDelete && (
        <form
          action={deleteAction}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="id" value={category.id} />
          <p className="text-[13px] text-[var(--color-ink)]">
            {t("delete_confirm", { title: category.title })}
          </p>
          <button
            type="submit"
            className={smallButtonClassName}
            disabled={isDeleting}
          >
            {t("delete_yes")}
          </button>
          <button
            type="button"
            className={smallButtonClassName}
            onClick={() => setConfirmingDelete(false)}
          >
            {t("cancel")}
          </button>
        </form>
      )}

      <FormError>
        {(deleteState.error && t(`errors.${deleteState.error}`)) ||
          (moveState.error && t(`errors.${moveState.error}`))}
      </FormError>
    </li>
  );
}

function EditCategoryForm({
  category,
  onDone,
}: {
  category: CategoryView;
  onDone: () => void;
}) {
  const t = useTranslations("catalyst.categories");
  const [state, formAction, isPending] = useActionState<
    CategoryFormState,
    FormData
  >(async (prev, formData) => {
    const result = await updateCategory(prev, formData);
    if (result.ok) onDone();
    return result;
  }, {});
  const values = state.values ?? {
    title: category.title,
    description: category.description,
  };

  return (
    <form
      action={formAction}
      className="bg-white rounded-[var(--radius-card)] p-6 flex flex-col gap-4"
    >
      <input type="hidden" name="id" value={category.id} />
      <CategoryFields idPrefix={`category-${category.id}`} values={values} />
      <FormError>{state.error && t(`errors.${state.error}`)}</FormError>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          type="submit"
          fullWidth={false}
          className="min-w-[160px]"
          disabled={isPending}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
        <Button
          variant="secondary"
          fullWidth={false}
          className="min-w-[160px]"
          onClick={onDone}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

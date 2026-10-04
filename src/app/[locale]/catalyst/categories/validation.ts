export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 280;

export type CategoryInput = { title: string; description: string | null };

// Returns a catalyst.categories.errors.* key on failure.
export function validateCategory(
  formData: FormData,
): { values: CategoryInput } | { error: "title_required" | "title_too_long" | "description_too_long" } {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) return { error: "title_required" };
  if (title.length > TITLE_MAX) return { error: "title_too_long" };
  if (description.length > DESCRIPTION_MAX) return { error: "description_too_long" };

  return { values: { title, description: description || null } };
}

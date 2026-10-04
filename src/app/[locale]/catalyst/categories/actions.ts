"use server";

import { refresh } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validateCategory, type CategoryInput } from "./validation";

export type CategoryFormState = {
  ok?: boolean;
  error?: string;
  // Echoed back so the form keeps what the Catalyst typed when a save fails.
  values?: CategoryInput;
};

// Organization and role always come from the session, never from the form.
async function catalystContext() {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "catalyst") return null;
  return { profile, supabase: await createClient() };
}

export async function addCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const validation = validateCategory(formData);
  if ("error" in validation) {
    return { error: validation.error, values: rawValues(formData) };
  }

  const ctx = await catalystContext();
  if (!ctx) return { error: "forbidden", values: validation.values };

  const { data: last } = await ctx.supabase
    .from("objective_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await ctx.supabase.from("objective_categories").insert({
    org_id: ctx.profile.org_id,
    title: validation.values.title,
    description: validation.values.description,
    sort_order: (last?.sort_order ?? 0) + 1,
  });

  if (error) return { error: "save_failed", values: validation.values };

  refresh();
  return { ok: true };
}

export async function updateCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const id = String(formData.get("id") ?? "");
  const validation = validateCategory(formData);
  if ("error" in validation) {
    return { error: validation.error, values: rawValues(formData) };
  }

  const ctx = await catalystContext();
  if (!ctx) return { error: "forbidden", values: validation.values };

  // RLS limits the update to the Catalyst's organization; no row back means
  // the category is gone or belongs elsewhere.
  const { data, error } = await ctx.supabase
    .from("objective_categories")
    .update({ title: validation.values.title, description: validation.values.description })
    .eq("id", id)
    .select("id");

  if (error) return { error: "save_failed", values: validation.values };
  if (!data?.length) return { error: "not_found", values: validation.values };

  refresh();
  return { ok: true, values: validation.values };
}

export async function deleteCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const id = String(formData.get("id") ?? "");
  const ctx = await catalystContext();
  if (!ctx) return { error: "forbidden" };

  // The prayer category backs the prayer workflow, so it stays.
  const { data: category } = await ctx.supabase
    .from("objective_categories")
    .select("kind")
    .eq("id", id)
    .maybeSingle();
  if (category?.kind === "prayer") return { error: "prayer_protected" };

  // Blocked for the weekend rather than deleting a planter's history.
  const { count, error: countError } = await ctx.supabase
    .from("objectives")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) return { error: "action_failed" };
  if (count) return { error: "in_use" };

  const { data, error } = await ctx.supabase
    .from("objective_categories")
    .delete()
    .eq("id", id)
    .select("id");

  // 23503: an objective was linked after the count above.
  if (error?.code === "23503") return { error: "in_use" };
  if (error) return { error: "action_failed" };
  if (!data?.length) return { error: "not_found" };

  refresh();
  return { ok: true };
}

export async function moveCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const id = String(formData.get("id") ?? "");
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const ctx = await catalystContext();
  if (!ctx) return { error: "forbidden" };

  const { data: rows, error } = await ctx.supabase
    .from("objective_categories")
    .select("id, sort_order")
    .order("sort_order")
    .order("created_at");

  if (error || !rows) return { error: "action_failed" };

  const index = rows.findIndex((r) => r.id === id);
  const target = index + direction;
  if (index === -1) return { error: "not_found" };
  if (target < 0 || target >= rows.length) return { ok: true };

  // Rewrite positions as 1..n so duplicate seed orders can't make a swap a no-op.
  const reordered = [...rows];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  const updates = reordered
    .map((row, i) => ({ id: row.id, sort_order: i + 1, changed: row.sort_order !== i + 1 }))
    .filter((row) => row.changed);

  for (const row of updates) {
    const { error: updateError } = await ctx.supabase
      .from("objective_categories")
      .update({ sort_order: row.sort_order })
      .eq("id", row.id);
    if (updateError) return { error: "action_failed" };
  }

  refresh();
  return { ok: true };
}

function rawValues(formData: FormData): CategoryInput {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || null,
  };
}

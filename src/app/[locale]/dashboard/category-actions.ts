"use server";
import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { idField, textField, choiceField } from "@/lib/workspace/validation";
import type { SaveResult } from "@/lib/workspace/types";

export async function saveCategory(form: FormData): Promise<SaveResult> {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || profile.role !== "catalyst") return { ok: false, error: "Only a Catalyst can manage organization categories." };
  const db = await createClient();
  try {
    const intent = choiceField(form, "intent", ["category", "remove_category"]);
    const id = form.get("id") ? idField(form, "id") : null;
    if (id) {
      const { data: category, error } = await db.from("objective_categories").select("id,kind").eq("id", id).eq("org_id", profile.org_id).maybeSingle();
      if (error || !category) return { ok: false, error: "This category is not available in your organization." };
      if (intent === "remove_category") {
        if (category.kind === "prayer") return { ok: false, error: "Keep the prayer category so planters can find their prayer workflow." };
        // The foreign key also blocks removal if an objective is created after this check.
        const { count, error: countError } = await db.from("objectives").select("id", { count: "exact", head: true }).eq("category_id", id);
        if (countError) return { ok: false, error: "We couldn't check whether this category is in use. Please try again." };
        if (count) return { ok: false, error: "This category has objectives. Keep it to preserve their history; you can edit its title and description." };
        const removed = await db.from("objective_categories").delete().eq("id", id).eq("org_id", profile.org_id).select("id").single();
        if (removed.error) return { ok: false, error: "This category couldn't be removed. It may now contain an objective." };
        revalidatePath("/[locale]/dashboard", "page");
        return { ok: true, id };
      }
    } else if (intent === "remove_category") {
      return { ok: false, error: "Choose a category to remove." };
    }
    const values = { title: textField(form, "title", 120), description: textField(form, "description", 1000, false) };
    const result = id ? await db.from("objective_categories").update(values).eq("id", id).eq("org_id", profile.org_id).select("id").single()
      : await db.from("objective_categories").insert({ ...values, org_id: profile.org_id, kind: "objective", sort_order: 100 }).select("id").single();
    if (result.error) return { ok: false, error: "We couldn't save this category. Please try again." };
    revalidatePath("/[locale]/dashboard", "page");
    return { ok: true, id: result.data.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "We couldn't save. Please try again." };
  }
}

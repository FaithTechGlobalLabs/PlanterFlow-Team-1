"use server";

import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { validateFirstGoal } from "@/lib/validation/onboarding";

interface ActionState {
  error?: string;
}

export async function createFirstGoal(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState | never> {
  const validation = validateFirstGoal(formData);
  if ("error" in validation) {
    return { error: validation.error };
  }

  const { categoryId, title, dueDate, checkpoint } = validation.values;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "onboarding.firstGoal.errors.generic" };
  }

  const { error: objectiveError } = await supabase
    .from("objectives")
    .insert({
      planter_id: user.id,
      category_id: categoryId,
      title,
      description: checkpoint,
      due_date: dueDate,
      cadence: "monthly",
    });

  if (objectiveError) {
    return { error: "onboarding.firstGoal.errors.generic" };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    return { error: "onboarding.firstGoal.errors.generic" };
  }

  const locale = await getLocale();
  redirect({ href: "/", locale });
  return {};
}

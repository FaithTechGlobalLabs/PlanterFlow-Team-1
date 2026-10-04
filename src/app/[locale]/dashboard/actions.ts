"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { choiceField, idField, textField } from "@/lib/workspace/validation";
import { postThreadMessage, updateThreadStatus } from "@/lib/workspace/conversation";
import type { SaveResult, ThreadEntityType, LifecycleStatus } from "@/lib/workspace/types";

export async function saveWorkspace(form: FormData): Promise<SaveResult> {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) return { ok: false, error: "Your session has ended. Please sign in again." };
  const db = await createClient();
  try {
    const intent = textField(form, "intent", 40);
    const allowedNonPlanterIntents = ["message", "prayer_visibility", "conversation_message", "conversation_status"];
    if (!allowedNonPlanterIntents.includes(intent) && profile.role !== "planter") {
      return { ok: false, error: "Only the planter can make this change." };
    }
    let result: { ok: boolean; id?: string; error?: string };

    if (intent === "objective") {
      const category_id = idField(form, "category_id");
      const { data: category } = await db.from("objective_categories").select("id").eq("id", category_id).eq("org_id", profile.org_id).eq("kind", "objective").maybeSingle();
      if (!category) throw new Error("Please choose an objective category in your organization.");
      const dueDate = textField(form, "due_date", 10, false);

      if (dueDate) {
        const parsed = new Date(`${dueDate}T00:00:00Z`);

        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
          Number.isNaN(parsed.getTime()) ||
          parsed.toISOString().slice(0, 10) !== dueDate
        ) {
          return { ok: false, error: "Please enter a valid target date." };
        }
      }

      const values = {
        category_id,
        title: textField(form, "title", 160),
        description: textField(form, "description", 2000, false),
        cadence: choiceField(form, "cadence", ["weekly", "monthly"]),
        due_date: dueDate || null,
      };

      const res = form.get("id")
        ? await db.from("objectives")
            .update({ ...values, updated_at: new Date().toISOString() })
            .eq("id", idField(form, "id"))
            .eq("planter_id", user.id)
            .select("id")
            .single()
        : await db.from("objectives").insert({ ...values, planter_id: user.id }).select("id").single();
      result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
    } else if (["activity", "progress", "message", "objective_status"].includes(intent)) {
      const objective_id = idField(form, "objective_id");
      const { data: objective } = await db.from("objectives").select("id,planter_id,title").eq("id", objective_id).maybeSingle();
      if (!objective || (intent !== "message" && objective.planter_id !== user.id)) throw new Error("You don't have access to change this objective.");
      if (intent === "activity") {
        const values = { description: textField(form, "description", 500), cadence: choiceField(form, "cadence", ["weekly", "monthly"]) };
        const res = form.get("id") ? await db.from("activities").update(values).eq("id", idField(form, "id")).eq("objective_id", objective_id).select("id").single()
          : await db.from("activities").insert({ ...values, objective_id }).select("id").single();
        result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
      } else if (intent === "progress") {
        const activity_id = form.get("activity_id") ? idField(form, "activity_id") : null;
        if (activity_id) {
          const { data: activity } = await db.from("activities").select("id").eq("id", activity_id).eq("objective_id", objective_id).maybeSingle();
          if (!activity) throw new Error("Please choose an activity from this objective.");
        }
        const raw = textField(form, "value", 20, false);
        const value = raw ? Number(raw) : null;
        if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1e9)) throw new Error("Please enter a number between 0 and 1,000,000,000.");
        const res = await db.from("progress_entries").insert({ objective_id, activity_id, author_id: user.id, note: textField(form, "note"), value }).select("id").single();
        result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
      } else if (intent === "message") {
        const body = textField(form, "body");
        const res = await db.from("dialogue_messages").insert({ objective_id, author_id: user.id, body }).select("id").single();
        result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
      } else {
        const res = await db.from("objectives").update({ status: choiceField(form, "status", ["active", "paused", "done"]), updated_at: new Date().toISOString() }).eq("id", objective_id).select("id").single();
        result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
      }
<<<<<<< HEAD
    } else if (intent === "conversation_message") {
      const entity_type = choiceField(form, "entity_type", ["prayer", "support"]) as ThreadEntityType;
      const entity_id = idField(form, "entity_id");
      const planter_id = form.get("planter_id") ? idField(form, "planter_id") : user.id;
      const body = textField(form, "body");
      const title = form.get("title") ? textField(form, "title", 160, false) : undefined;
      result = await postThreadMessage({
        entityType: entity_type,
        entityId: entity_id,
        planterId: planter_id,
        orgId: profile.org_id,
        authorId: user.id,
        body,
        title
      });
    } else if (intent === "conversation_status") {
      const thread_id = idField(form, "thread_id");
      const status = choiceField(form, "status", ["active", "resolved", "archived"]) as LifecycleStatus;
      result = await updateThreadStatus(thread_id, status);
    } else if (intent === "check_in") {
      const res = await db.from("check_ins").insert({ planter_id: user.id, note: textField(form, "note"), feeling: choiceField(form, "feeling", ["encouraged", "steady", "stretched", "struggling"]), momentum: choiceField(form, "momentum", ["moving", "steady", "stuck"]), support: textField(form, "support", 2000, false) }).select("id").single();
      if (!res.error && res.data) {
        await postThreadMessage({
          entityType: "support",
          entityId: res.data.id,
          planterId: user.id,
          orgId: profile.org_id,
          authorId: user.id,
          body: textField(form, "note"),
          title: "Support Check-in"
        });
      }
      result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
=======
>>>>>>> 763cc62 (Update planter dashboard and objective progress flow)
    } else if (intent === "prayer") {
      const body = textField(form, "body");
      const res = await db.from("prayer_requests").insert({ planter_id: user.id, org_id: profile.org_id, body, visibility: choiceField(form, "visibility", ["private", "organization"]) }).select("id").single();
      if (!res.error && res.data) {
        await postThreadMessage({
          entityType: "prayer",
          entityId: res.data.id,
          planterId: user.id,
          orgId: profile.org_id,
          authorId: user.id,
          body,
          title: body.slice(0, 60)
        });
      }
      result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
    } else if (intent === "prayer_visibility") {
      const res = await db.from("prayer_requests").update({ visibility: choiceField(form, "visibility", ["private", "organization"]), updated_at: new Date().toISOString() }).eq("id", idField(form, "id")).select("id").single();
      result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
    } else {
      throw new Error("This action isn't available. Please refresh and try again.");
    }
    if (!result.ok) return { ok: false, error: result.error ?? "We couldn't save that change. Your text is still here; please try again." };
    revalidatePath("/[locale]/dashboard", "page");
    return { ok: true, id: result.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "We couldn't save. Please try again." };
  }
}

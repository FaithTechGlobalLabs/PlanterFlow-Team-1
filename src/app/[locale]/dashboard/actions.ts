"use server";

import { OBJECTIVE_STATUSES } from "@/lib/workspace/objective-status";
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
    // Peers can only contribute to objectives shared with their church.
    if (profile.role === "peer" && !["activity", "progress", "team_message"].includes(intent)) {
      return { ok: false, error: "This action is not available to Church Team members." };
    }
    const allowedNonPlanterIntents = [
      "activity", "progress", "message", "team_message",
      "prayer_visibility", "conversation_message", "conversation_status",
    ];
    if (!allowedNonPlanterIntents.includes(intent) && profile.role !== "planter") {
      return { ok: false, error: "Only the planter can make this change." };
    }
    let result: SaveResult;

    if (intent === "objective") {
      const category_id = idField(form, "category_id");
      const { data: category } = await db.from("objective_categories").select("id")
        .eq("id", category_id).eq("org_id", profile.org_id).eq("kind", "objective").maybeSingle();
      if (!category) throw new Error("Please choose an objective category in your organization.");
      const dueDate = textField(form, "due_date", 10, false);
      if (dueDate) {
        const parsed = new Date(`${dueDate}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dueDate) {
          return { ok: false, error: "Please enter a valid target date." };
        }
      }
      const values = {
        category_id,
        title: textField(form, "title", 160),
        description: textField(form, "description", 2000, false),
        cadence: choiceField(form, "cadence", ["weekly", "monthly"]),
        due_date: dueDate || null,
        ...(form.has("team_visible_present") ? { team_visible: form.get("team_visible") === "on" } : {}),
      };
      const res = form.get("id")
        ? await db.from("objectives").update({ ...values, updated_at: new Date().toISOString() })
            .eq("id", idField(form, "id")).eq("planter_id", user.id).select("id").single()
        : await db.from("objectives").insert({ ...values, planter_id: user.id, status: "planning" }).select("id").single();
      result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
    } else if (["activity", "progress", "message", "team_message", "objective_status"].includes(intent)) {
      const objective_id = idField(form, "objective_id");
      // Session-scoped client: objective RLS also checks visibility for Catalysts.
      const { data: objective, error: objectiveError } = await db.from("objectives")
        .select("id,planter_id,title,team_visible").eq("id", objective_id).maybeSingle();
      if (objectiveError) throw new Error(objectiveError.message);
      if (!objective) throw new Error("You don't have access to this objective.");
      const isOwner = profile.role === "planter" && objective.planter_id === user.id;
      let isTeamMember = false;
      if (profile.role === "peer" && objective.team_visible && ["activity", "progress", "team_message"].includes(intent)) {
        const { data: membership, error: membershipError } = await db.rpc("is_church_team_member", {
          target_planter_id: objective.planter_id,
        });
        if (membershipError) throw new Error("Team access is not available yet.");
        isTeamMember = membership === true;
      }
      const allowed = intent === "objective_status"
        ? isOwner
        : intent === "message"
          ? isOwner || profile.role === "catalyst"
          : intent === "team_message"
            ? objective.team_visible && (isOwner || profile.role === "catalyst" || isTeamMember)
            : isOwner || isTeamMember;
      if (!allowed) throw new Error("You don't have access to change this objective.");

      if (intent === "activity") {
        const values = { description: textField(form, "description", 500), cadence: choiceField(form, "cadence", ["weekly", "monthly"]) };
        const res = form.get("id")
          ? await db.from("activities").update(values).eq("id", idField(form, "id")).eq("objective_id", objective_id).select("id").single()
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
      } else if (intent === "message" || intent === "team_message") {
        const table = intent === "team_message" ? "objective_team_messages" : "dialogue_messages";
        const res = await db.from(table).insert({ objective_id, author_id: user.id, body: textField(form, "body", 2000) }).select("id").single();
        result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
      } else {
        const res = await db.from("objectives").update({ status: choiceField(form, "status", OBJECTIVE_STATUSES), updated_at: new Date().toISOString() })
          .eq("id", objective_id).eq("planter_id", user.id).select("id").single();
        result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
      }
    } else if (intent === "conversation_message") {
      const entity_type = choiceField(form, "entity_type", ["prayer", "support"]) as ThreadEntityType;
      const entity_id = idField(form, "entity_id");
      const planter_id = form.get("planter_id") ? idField(form, "planter_id") : user.id;
      const body = textField(form, "body");
      const title = form.get("title") ? textField(form, "title", 160, false) : undefined;
      result = await postThreadMessage({ entityType: entity_type, entityId: entity_id, planterId: planter_id, orgId: profile.org_id, authorId: user.id, body, title });
    } else if (intent === "conversation_status") {
      result = await updateThreadStatus(idField(form, "thread_id"), choiceField(form, "status", ["active", "resolved", "archived"]) as LifecycleStatus);
    } else if (intent === "prayer") {
      const body = textField(form, "body");
      const res = await db.from("prayer_requests").insert({ planter_id: user.id, org_id: profile.org_id, body, visibility: choiceField(form, "visibility", ["private", "organization"]) }).select("id").single();
      if (!res.error && res.data) {
        await postThreadMessage({ entityType: "prayer", entityId: res.data.id, planterId: user.id, orgId: profile.org_id, authorId: user.id, body, title: body.slice(0, 60) });
      }
      result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
    } else if (intent === "prayer_visibility") {
      const res = await db.from("prayer_requests").update({ visibility: choiceField(form, "visibility", ["private", "organization"]), updated_at: new Date().toISOString() })
        .eq("id", idField(form, "id")).select("id").single();
      result = { ok: !res.error, id: res.data?.id, error: res.error?.message };
    } else {
      throw new Error("This action isn't available. Please refresh and try again.");
    }
    if (!result.ok) return { ok: false, error: result.error ?? "We couldn't save that change. Your text is still here; please try again." };
    revalidatePath("/[locale]/dashboard", "page");
    revalidatePath("/[locale]/catalyst", "page");
    revalidatePath("/[locale]/catalyst/planters/[id]", "page");
    return { ok: true, id: result.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "We couldn't save. Please try again." };
  }
}

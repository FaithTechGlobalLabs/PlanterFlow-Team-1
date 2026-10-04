"use server";

import { refresh } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { REPLY_MAX } from "./limits";

export type ReplyState = { ok?: boolean; error?: string; body?: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;

// The objective must belong to a pastor whose church is assigned to this Catalyst.
async function assignedObjective(supabase: Supabase, objectiveId: string, catalystId: string) {
  const { data: objective } = await supabase
    .from("objectives")
    .select("id, planter_id")
    .eq("id", objectiveId)
    .maybeSingle();
  if (!objective) return null;

  const { data: church } = await supabase
    .from("churches")
    .select("id")
    .eq("pastor_id", objective.planter_id)
    .eq("catalyst_id", catalystId)
    .maybeSingle();
  return church ? objective : null;
}

async function postMessage(
  formData: FormData,
  checkIn?: { id: string; belongsTo: (planterId: string) => Promise<boolean> },
) {
  const objectiveId = String(formData.get("objectiveId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { error: "reply_required", body };
  if (body.length > REPLY_MAX) return { error: "reply_too_long", body };

  const { user, profile } = await getSessionProfile();
  if (!user || !profile || profile.role !== "catalyst") return { error: "forbidden", body };

  const supabase = await createClient();
  const objective = await assignedObjective(supabase, objectiveId, user.id);
  if (!objective) return { error: "not_found", body };
  if (checkIn && !(await checkIn.belongsTo(objective.planter_id))) return { error: "not_found", body };

  // The author always comes from the session, never from the form.
  const { error } = await supabase
    .from("dialogue_messages")
    .insert({ objective_id: objectiveId, author_id: user.id, body, check_in_id: checkIn?.id ?? null });

  if (error) return { error: "send_failed", body };

  refresh();
  return { ok: true };
}

export async function sendReply(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  return postMessage(formData);
}

// Reviewing a check-in leaves a support note in the pastor's objective
// conversation, linked by check_in_id so it reads as an acknowledgement.
export async function acknowledgeCheckIn(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  const checkInId = String(formData.get("checkInId") ?? "");
  return postMessage(formData, {
    id: checkInId,
    belongsTo: async (planterId) => {
      const supabase = await createClient();
      const { data: checkIn } = await supabase
        .from("check_ins")
        .select("id")
        .eq("id", checkInId)
        .eq("planter_id", planterId)
        .maybeSingle();
      return Boolean(checkIn);
    },
  });
}

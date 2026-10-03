import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth/session";
import type { WorkspaceData, Person } from "./types";

export async function loadWorkspace(profile: Profile, requestedPlanter?: string): Promise<WorkspaceData | null> {
  const db = await createClient();
  const { data: people, error: peopleError } = await db.from("profiles").select("id,display_name,role").eq("org_id", profile.org_id).order("display_name");
  if (peopleError) throw new Error("We couldn't load your organization. Please try again.");
  const planters = (people as Person[]).filter(p => p.role === "planter");
  const planter = profile.role === "planter" ? profile : planters.find(p => p.id === requestedPlanter) ?? (requestedPlanter ? null : planters[0]);
  if (!planter) return null;
  const results = await Promise.all([
    db.from("churches").select("name,city,vision").eq("pastor_id", planter.id).maybeSingle(),
    db.from("objective_categories").select("id,title,description,kind").order("sort_order"),
    db.from("objectives").select("*").eq("planter_id", planter.id).order("created_at", { ascending: false }),
    db.from("check_ins").select("*").eq("planter_id", planter.id).order("created_at", { ascending: false }),
    db.from("prayer_requests").select("*").eq("planter_id", planter.id).order("created_at", { ascending: false }),
    db.from("prayer_requests").select("*").eq("visibility", "organization").neq("planter_id", planter.id).order("created_at", { ascending: false }),
  ]);
  if (results.some(r => r.error)) throw new Error("We couldn't load your workspace. Please check the database setup and try again.");
  const [church, categories, objectives, checkIns, prayers, sharedPrayers] = results.map(r => r.data);
  const ids = (objectives as WorkspaceData["objectives"]).map(o => o.id);
  const children = ids.length ? await Promise.all([
    db.from("activities").select("*").in("objective_id", ids).order("created_at"),
    db.from("progress_entries").select("*").in("objective_id", ids).order("created_at", { ascending: false }),
    db.from("dialogue_messages").select("*").in("objective_id", ids).order("created_at"),
  ]) : [];
  if (children.some(r => r.error)) throw new Error("We couldn't load your progress. Please try again.");
  return { asOf: new Date().toISOString(), viewer: { id: profile.id, role: profile.role, display_name: profile.display_name }, planter, people, church, categories, objectives, checkIns, prayers, sharedPrayers,
    activities: children[0]?.data ?? [], progress: children[1]?.data ?? [], messages: children[2]?.data ?? [] } as WorkspaceData;
}

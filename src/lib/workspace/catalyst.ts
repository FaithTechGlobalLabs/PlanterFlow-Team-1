import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth/session";
import type { CatalystData, CheckIn, Objective, Person, Prayer, Progress, Message } from "./types";

export async function loadCatalystDashboard(profile: Profile): Promise<CatalystData> {
  if (profile.role !== "catalyst") throw new Error("Catalyst access is required.");
  const db = await createClient();
  const [org, people, churches, categories, objectives, checkIns, prayers] = await Promise.all([
    db.from("organizations").select("name").eq("id", profile.org_id).single(),
    db.from("profiles").select("id,display_name,role").eq("org_id", profile.org_id).order("display_name"),
    db.from("churches").select("pastor_id,name,city").eq("org_id", profile.org_id),
    db.from("objective_categories").select("id,title,description,kind").eq("org_id", profile.org_id).order("sort_order"),
    db.from("objectives").select("*").order("created_at", { ascending: false }),
    db.from("check_ins").select("*").order("created_at", { ascending: false }),
    db.from("prayer_requests").select("*").eq("org_id", profile.org_id).order("created_at", { ascending: false }),
  ]);
  if ([org, people, churches, categories, objectives, checkIns, prayers].some(result => result.error)) {
    throw new Error("We couldn't load your organization. Please try again.");
  }
  const ids = (objectives.data as Objective[]).map(objective => objective.id);
  const [progress, messages] = ids.length ? await Promise.all([
    db.from("progress_entries").select("*").in("objective_id", ids).order("created_at", { ascending: false }),
    db.from("dialogue_messages").select("*").in("objective_id", ids).order("created_at", { ascending: false }),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (progress.error || messages.error) throw new Error("We couldn't load the latest updates.");
  return {
    viewer: { id: profile.id, display_name: profile.display_name, role: profile.role },
    organization: org.data!.name, people: people.data as Person[], churches: churches.data!,
    categories: categories.data!, objectives: objectives.data as Objective[],
    checkIns: checkIns.data as CheckIn[], prayers: prayers.data as Prayer[],
    progress: progress.data as Progress[], messages: messages.data as Message[],
  };
}

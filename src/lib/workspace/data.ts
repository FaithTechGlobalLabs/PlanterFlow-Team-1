import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth/session";
import type { WorkspaceData, Person, ConversationThread, ConversationMessage, ConversationAuthor, ThreadEntityType, LifecycleStatus } from "./types";

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

  // Load conversation threads & messages for objective, prayer, and support
  let threads: ConversationThread[] = [];
  try {
    const peopleMap = new Map((people as Person[]).map(p => [p.id, p]));
    const { data: rawThreads } = await db.from("conversation_threads").select("*").eq("planter_id", planter.id).order("updated_at", { ascending: false });
    if (rawThreads && rawThreads.length > 0) {
      const threadIds = rawThreads.map(t => t.id);
      const { data: rawMsgs } = await db.from("conversation_messages").select("*").in("thread_id", threadIds).order("created_at", { ascending: true });
      const msgsByThread = new Map<string, ConversationMessage[]>();
      for (const m of rawMsgs ?? []) {
        const authorPerson = peopleMap.get(m.author_id);
        const author: ConversationAuthor | undefined = authorPerson ? { id: authorPerson.id, display_name: authorPerson.display_name, role: authorPerson.role } : undefined;
        const msg: ConversationMessage = { id: m.id, thread_id: m.thread_id, author_id: m.author_id, author, body: m.body, created_at: m.created_at, updated_at: m.updated_at };
        if (!msgsByThread.has(m.thread_id)) msgsByThread.set(m.thread_id, []);
        msgsByThread.get(m.thread_id)!.push(msg);
      }
      threads = rawThreads.map(t => {
        const msgs = msgsByThread.get(t.id) ?? [];
        const lastActivity = msgs.length > 0 ? msgs[msgs.length - 1].created_at : t.created_at;
        return {
          id: t.id, entity_type: t.entity_type as ThreadEntityType, entity_id: t.entity_id,
          planter_id: t.planter_id, org_id: t.org_id, title: t.title, status: t.status as LifecycleStatus,
          created_at: t.created_at, updated_at: t.updated_at, messages: msgs, last_activity_at: lastActivity
        };
      });
    }
  } catch {
    // If conversation tables are not yet present, fallback gracefully
    threads = [];
  }

  return { asOf: new Date().toISOString(), viewer: { id: profile.id, role: profile.role, display_name: profile.display_name }, planter, people, church, categories, objectives, checkIns, prayers, sharedPrayers,
    activities: children[0]?.data ?? [], progress: children[1]?.data ?? [], messages: children[2]?.data ?? [], threads } as WorkspaceData;
}

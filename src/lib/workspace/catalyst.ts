import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth/session";
import type {
  CatalystData,
  CheckIn,
  Objective,
  Person,
  Prayer,
  Progress,
  Message,
  ConversationThread,
  ConversationMessage,
  ConversationAuthor,
  ThreadEntityType,
  LifecycleStatus,
} from "./types";

export async function loadCatalystDashboard(
  profile: Profile,
): Promise<CatalystData> {
  if (profile.role !== "catalyst")
    throw new Error("Catalyst access is required.");
  const db = await createClient();
  const [org, people, churches, categories, objectives, checkIns, prayers] =
    await Promise.all([
      db.from("organizations").select("name").eq("id", profile.org_id).single(),
      db
        .from("profiles")
        .select("id,display_name,role")
        .eq("org_id", profile.org_id)
        .order("display_name"),
      db
        .from("churches")
        .select("pastor_id,name,city,planting_start_date")
        .eq("org_id", profile.org_id),
      db
        .from("objective_categories")
        .select("id,title,description,kind")
        .eq("org_id", profile.org_id)
        .order("sort_order"),
      db
        .from("objectives")
        .select("*")
        .order("created_at", { ascending: false }),
      db
        .from("check_ins")
        .select("*")
        .order("created_at", { ascending: false }),
      db
        .from("prayer_requests")
        .select("*")
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false }),
    ]);
  if (
    [org, people, churches, categories, objectives, checkIns, prayers].some(
      (result) => result.error,
    )
  ) {
    throw new Error("We couldn't load your organization. Please try again.");
  }
  const ids = (objectives.data as Objective[]).map((objective) => objective.id);
  const [progress, messages] = ids.length
    ? await Promise.all([
        db
          .from("progress_entries")
          .select("*")
          .in("objective_id", ids)
          .order("created_at", { ascending: false }),
        db
          .from("dialogue_messages")
          .select("*")
          .in("objective_id", ids)
          .order("created_at", { ascending: false }),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];
  if (progress.error || messages.error)
    throw new Error("We couldn't load the latest updates.");

  let threads: ConversationThread[] = [];
  try {
    const peopleMap = new Map((people.data as Person[]).map((p) => [p.id, p]));
    const { data: rawThreads } = await db
      .from("conversation_threads")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("updated_at", { ascending: false });
    if (rawThreads && rawThreads.length > 0) {
      const threadIds = rawThreads.map((t) => t.id);
      const { data: rawMsgs } = await db
        .from("conversation_messages")
        .select("*")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: true });
      const msgsByThread = new Map<string, ConversationMessage[]>();
      for (const m of rawMsgs ?? []) {
        const authorPerson = peopleMap.get(m.author_id);
        const author: ConversationAuthor | undefined = authorPerson
          ? {
              id: authorPerson.id,
              display_name: authorPerson.display_name,
              role: authorPerson.role,
            }
          : undefined;
        const msg: ConversationMessage = {
          id: m.id,
          thread_id: m.thread_id,
          author_id: m.author_id,
          author,
          body: m.body,
          created_at: m.created_at,
          updated_at: m.updated_at,
        };
        if (!msgsByThread.has(m.thread_id)) msgsByThread.set(m.thread_id, []);
        msgsByThread.get(m.thread_id)!.push(msg);
      }
      threads = rawThreads.map((t) => {
        const msgs = msgsByThread.get(t.id) ?? [];
        const lastActivity =
          msgs.length > 0 ? msgs[msgs.length - 1].created_at : t.created_at;
        return {
          id: t.id,
          entity_type: t.entity_type as ThreadEntityType,
          entity_id: t.entity_id,
          planter_id: t.planter_id,
          org_id: t.org_id,
          title: t.title,
          status: t.status as LifecycleStatus,
          created_at: t.created_at,
          updated_at: t.updated_at,
          messages: msgs,
          last_activity_at: lastActivity,
        };
      });
    }
  } catch {
    threads = [];
  }

  return {
    asOf: new Date().toISOString(),
    viewer: {
      id: profile.id,
      display_name: profile.display_name,
      role: profile.role,
    },
    organization: org.data!.name,
    people: people.data as Person[],
    churches: churches.data!,
    categories: categories.data!,
    objectives: objectives.data as Objective[],
    checkIns: checkIns.data as CheckIn[],
    prayers: prayers.data as Prayer[],
    progress: progress.data as Progress[],
    messages: messages.data as Message[],
    threads,
  };
}

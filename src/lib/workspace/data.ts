import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth/session";
import type {
  WorkspaceData, Person, ConversationThread, ConversationMessage,
  ConversationAuthor, ThreadEntityType, LifecycleStatus,
} from "./types";

export async function loadWorkspace(profile: Profile, requestedPlanter?: string): Promise<WorkspaceData | null> {
  const db = await createClient();
  const isPeer = profile.role === "peer";
  const { data: rawPeople, error: peopleError } = await db.from("profiles")
    .select("id,display_name,role").eq("org_id", profile.org_id).order("display_name");
  if (peopleError) throw new Error("We couldn't load your organization. Please try again.");
  const people = (rawPeople ?? []) as Person[];
  const planters = people.filter(p => p.role === "planter");
  let planter: Person | null = null;

  if (isPeer) {
    const { data: memberships, error: membershipError } = await db.from("church_memberships")
      .select("church_id").eq("user_id", profile.id).eq("role", "peer");
    if (membershipError) throw new Error("We couldn't load your church membership.");
    const churchIds = (memberships ?? []).map(m => m.church_id);
    if (!churchIds.length) return null;
    let churchQuery = db.from("churches").select("id,pastor_id")
      .in("id", churchIds).eq("org_id", profile.org_id);
    if (requestedPlanter) churchQuery = churchQuery.eq("pastor_id", requestedPlanter);
    const { data: memberChurch, error: churchError } = await churchQuery
      .order("created_at").order("id").limit(1).maybeSingle();
    if (churchError) throw new Error("We couldn't load your church.");
    console.log("Team church lookup", {
  churchIds,
  memberChurch,
});
    if (!memberChurch) return null;
    planter = planters.find(p => p.id === memberChurch.pastor_id) ?? null;
  } else {
    planter = profile.role === "planter"
      ? { id: profile.id, display_name: profile.display_name, role: profile.role }
      : planters.find(p => p.id === requestedPlanter) ?? (requestedPlanter ? null : planters[0] ?? null);
  }
  console.log("Workspace lookup", {
  viewerId: profile.id,
  viewerRole: profile.role,
  requestedPlanter,
  visiblePlanterIds: planters.map(p => p.id),
  selectedPlanterId: planter?.id,
});
  if (!planter) return null;

  let objectivesQuery = db.from("objectives").select("*").eq("planter_id", planter.id)
    .order("created_at", { ascending: false });
  if (isPeer) objectivesQuery = objectivesQuery.eq("team_visible", true);
  let prayersQuery = db.from("prayer_requests").select("*").eq("planter_id", planter.id)
    .eq("org_id", profile.org_id).order("created_at", { ascending: false });
  if (isPeer) prayersQuery = prayersQuery.eq("visibility", "organization");
  const results = await Promise.all([
    db.from("churches").select("name,city,vision").eq("pastor_id", planter.id).eq("org_id", profile.org_id).maybeSingle(),
    db.from("objective_categories").select("id,title,description,kind").eq("org_id", profile.org_id).order("sort_order"),
    objectivesQuery,
    isPeer ? Promise.resolve({ data: [], error: null })
      : db.from("check_ins").select("*").eq("planter_id", planter.id).order("created_at", { ascending: false }),
    prayersQuery,
    db.from("prayer_requests").select("*").eq("org_id", profile.org_id)
      .eq("visibility", "organization").neq("planter_id", planter.id).order("created_at", { ascending: false }),
  ]);
  if (results.some(r => r.error)) throw new Error("We couldn't load your workspace. Please check the database setup and try again.");
  const [church, categories, rawObjectives, checkIns, prayers, sharedPrayers] = results.map(r => r.data);
  const objectives = (rawObjectives ?? []) as WorkspaceData["objectives"];
  const ids = objectives.map(o => o.id);
  const children = ids.length ? await Promise.all([
    db.from("activities").select("*").in("objective_id", ids).order("created_at"),
    db.from("progress_entries").select("*").in("objective_id", ids).order("created_at", { ascending: false }),
    isPeer ? Promise.resolve({ data: [], error: null })
      : db.from("dialogue_messages").select("*").in("objective_id", ids).order("created_at"),
  ]) : [];
  if (children.some(r => r.error)) throw new Error("We couldn't load your progress. Please try again.");

  // Dedicated team replies never include private Catalyst/check-in messages.
  // Undefined means the new table has not been deployed yet; [] means no replies.
  let teamMessages: WorkspaceData["teamMessages"] = [];
  if (ids.length) {
    const { data: replies, error: repliesError } = await db.from("objective_team_messages")
      .select("id,objective_id,author_id,body,created_at").in("objective_id", ids)
      .order("created_at").order("id");
    if (repliesError) {
      if (["42P01", "PGRST205"].includes(repliesError.code)) {
        teamMessages = undefined;
      } else {
        throw new Error("We couldn't load your team replies. Please try again.");
      }
    } else {
      teamMessages = (replies ?? []) as NonNullable<WorkspaceData["teamMessages"]>;
    }
  }

  // Prayer/support conversation threads remain excluded from peer payloads.
  let threads: ConversationThread[] = [];
  if (!isPeer) {
    try {
      const peopleMap = new Map(people.map(p => [p.id, p]));
      const { data: rawThreads } = await db.from("conversation_threads").select("*")
        .eq("planter_id", planter.id).order("updated_at", { ascending: false });
      if (rawThreads && rawThreads.length > 0) {
        const threadIds = rawThreads.map(t => t.id);
        const { data: rawMsgs } = await db.from("conversation_messages").select("*")
          .in("thread_id", threadIds).order("created_at", { ascending: true });
        const msgsByThread = new Map<string, ConversationMessage[]>();
        for (const m of rawMsgs ?? []) {
          const authorPerson = peopleMap.get(m.author_id);
          const author: ConversationAuthor | undefined = authorPerson
            ? { id: authorPerson.id, display_name: authorPerson.display_name, role: authorPerson.role }
            : undefined;
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
            created_at: t.created_at, updated_at: t.updated_at, messages: msgs, last_activity_at: lastActivity,
          };
        });
      }
    } catch {
      // Preserve the existing fallback for installations without conversation tables.
      threads = [];
    }
  }

  return {
    asOf: new Date().toISOString(),
    viewer: { id: profile.id, role: profile.role, display_name: profile.display_name },
    planter, people, church, categories: categories ?? [], objectives,
    checkIns: checkIns ?? [], prayers: prayers ?? [], sharedPrayers: sharedPrayers ?? [],
    activities: children[0]?.data ?? [], progress: children[1]?.data ?? [],
    messages: children[2]?.data ?? [], teamMessages, threads,
  } as WorkspaceData;
}

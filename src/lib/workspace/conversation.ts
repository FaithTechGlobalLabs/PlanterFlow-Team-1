import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConversationThread,
  ConversationMessage,
  ConversationAuthor,
  LifecycleStatus,
  ThreadEntityType,
  SaveResult,
  Person
} from "./types";

export async function loadThreadsForEntities(
  entityType: ThreadEntityType,
  entityIds: string[],
  peopleMap?: Map<string, Person>
): Promise<ConversationThread[]> {
  if (entityIds.length === 0) return [];
  const db = await createClient();

  const { data: threadsData, error: threadErr } = await db
    .from("conversation_threads")
    .select("*")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds)
    .order("updated_at", { ascending: false });

  if (threadErr || !threadsData) return [];

  const threadIds = threadsData.map((t) => t.id);
  if (threadIds.length === 0) return [];

  const { data: messagesData, error: msgErr } = await db
    .from("conversation_messages")
    .select("*")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: true });

  if (msgErr || !messagesData) return [];

  const messagesByThread = new Map<string, ConversationMessage[]>();
  for (const rawMsg of messagesData) {
    const authorPerson = peopleMap?.get(rawMsg.author_id);
    const author: ConversationAuthor | undefined = authorPerson
      ? { id: authorPerson.id, display_name: authorPerson.display_name, role: authorPerson.role }
      : undefined;

    const message: ConversationMessage = {
      id: rawMsg.id,
      thread_id: rawMsg.thread_id,
      author_id: rawMsg.author_id,
      author,
      body: rawMsg.body,
      created_at: rawMsg.created_at,
      updated_at: rawMsg.updated_at,
    };

    if (!messagesByThread.has(rawMsg.thread_id)) {
      messagesByThread.set(rawMsg.thread_id, []);
    }
    messagesByThread.get(rawMsg.thread_id)!.push(message);
  }

  return threadsData.map((t) => {
    const msgs = messagesByThread.get(t.id) ?? [];
    const lastMsgDate = msgs.length > 0 ? msgs[msgs.length - 1].created_at : t.created_at;
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
      last_activity_at: lastMsgDate,
    };
  });
}

export async function loadConversationThread(
  entityType: ThreadEntityType,
  entityId: string,
  people?: Person[]
): Promise<ConversationThread | null> {
  const peopleMap = people ? new Map(people.map((p) => [p.id, p])) : undefined;
  const threads = await loadThreadsForEntities(entityType, [entityId], peopleMap);
  return threads[0] ?? null;
}

export async function getOrCreateThread(
  db: SupabaseClient,
  entityType: ThreadEntityType,
  entityId: string,
  planterId: string,
  orgId: string,
  title?: string
): Promise<{ id: string; error?: string }> {
  const { data: existing } = await db
    .from("conversation_threads")
    .select("id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const { data: created, error } = await db
    .from("conversation_threads")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      planter_id: planterId,
      org_id: orgId,
      title: title ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { id: "", error: error.message };
  return { id: created.id };
}

export async function postThreadMessage(params: {
  entityType: ThreadEntityType;
  entityId: string;
  planterId: string;
  orgId: string;
  authorId: string;
  body: string;
  title?: string;
}): Promise<SaveResult> {
  const db = await createClient();
  const threadRes = await getOrCreateThread(
    db,
    params.entityType,
    params.entityId,
    params.planterId,
    params.orgId,
    params.title
  );

  if (threadRes.error || !threadRes.id) {
    return { ok: false, error: threadRes.error ?? "Failed to initialize conversation thread." };
  }

  const { data: msg, error: msgErr } = await db
    .from("conversation_messages")
    .insert({
      thread_id: threadRes.id,
      author_id: params.authorId,
      body: params.body,
    })
    .select("id")
    .single();

  if (msgErr) {
    return { ok: false, error: "Failed to post conversation message." };
  }

  await db
    .from("conversation_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadRes.id);

  return { ok: true, id: msg.id };
}

export async function updateThreadStatus(
  threadId: string,
  status: LifecycleStatus
): Promise<SaveResult> {
  const db = await createClient();

  const { data: thread, error: threadErr } = await db
    .from("conversation_threads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", threadId)
    .select("id, entity_type, entity_id")
    .single();

  if (threadErr) {
    return { ok: false, error: "Failed to update thread lifecycle status." };
  }

  if (thread.entity_type === "prayer") {
    await db
      .from("prayer_requests")
      .update({
        resolved: status === "resolved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", thread.entity_id);
  }

  return { ok: true, id: thread.id };
}

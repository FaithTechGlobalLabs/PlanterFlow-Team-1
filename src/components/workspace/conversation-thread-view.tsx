"use client";

import type { ReactNode } from "react";
import { SaveForm } from "./workspace";
import type { ConversationThread, Person, ThreadEntityType, SaveResult, LifecycleStatus } from "@/lib/workspace/types";

export interface ConversationThreadViewProps {
  thread: ConversationThread | null;
  entityType: ThreadEntityType;
  entityId: string;
  planterId: string;
  viewer: Person;
  people: Person[];
  title?: string;
  allowStatusChange?: boolean;
  perform?: (form: FormData) => Promise<SaveResult>;
  onSaved?: () => void;
  emptyState?: ReactNode;
}

function date(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function time(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(value)) + " UTC";
}

export function ConversationThreadView({
  thread,
  entityType,
  entityId,
  planterId,
  viewer,
  people,
  title,
  allowStatusChange = true,
  perform,
  onSaved,
  emptyState,
}: ConversationThreadViewProps) {
  const peopleMap = new Map(people.map((p) => [p.id, p]));
  const messages = thread?.messages ?? [];
  const status: LifecycleStatus = thread?.status ?? "active";

  const getAuthorName = (authorId: string) => {
    if (authorId === viewer.id) return viewer.display_name;
    const person = peopleMap.get(authorId);
    if (person) return person.display_name;
    return viewer.role === "planter" ? "Your Catalyst" : "Planter";
  };

  const getAuthorRole = (authorId: string) => {
    if (authorId === viewer.id) return viewer.role;
    const person = peopleMap.get(authorId);
    return person?.role ?? (viewer.role === "planter" ? "catalyst" : "planter");
  };

  return (
    <section className="ff-panel ff-conversation-thread">
      <div className="ff-section-heading">
        <div>
          <h2>{title ?? "Threaded Conversation"}</h2>
          <span className={`ff-status status-${status}`}>
            {status === "active" ? "Active" : status === "resolved" ? "Resolved" : "Archived"}
          </span>
        </div>
        {allowStatusChange && thread && (
          <SaveForm
  key={`${thread.id}-${status}`}
  intent="conversation_status"
  perform={perform}
  showSubmit={false}
  onSaved={onSaved}
>
  <input type="hidden" name="thread_id" value={thread.id} />

  <select
    name="status"
    defaultValue={status}
    aria-label="Thread status"
    onChange={event => event.currentTarget.form?.requestSubmit()}
  >
    <option value="active">Active</option>
    <option value="resolved">Resolved</option>
    <option value="archived">Archived</option>
  </select>
</SaveForm>
        )}
      </div>

      <p className="ff-muted">A shared conversation space between Planter and Catalyst.</p>

      <div className="ff-messages" style={{ marginTop: "1rem" }}>
        {messages.map((m) => {
          const authorRole = getAuthorRole(m.author_id);
          const isMine = m.author_id === viewer.id;
          return (
            <article key={m.id} className={isMine ? "is-mine" : ""}>
              <header>
                <strong>
                  {getAuthorName(m.author_id)}{" "}
                  <small style={{ fontWeight: "normal", opacity: 0.8 }}>({authorRole})</small>
                </strong>
                <time dateTime={m.created_at}>
                  {date(m.created_at)} · {time(m.created_at)}
                </time>
              </header>
              <p>{m.body}</p>
            </article>
          );
        })}
      </div>

      {messages.length === 0 && (
        <div style={{ padding: "1rem 0" }}>
          {emptyState ?? <p className="ff-empty">Start a conversation. Share encouragement or ask for support.</p>}
        </div>
      )}

      {status !== "archived" && (
        <div style={{ marginTop: "1.5rem" }}>
          <SaveForm intent="conversation_message" perform={perform} submit="Send reply" onSaved={onSaved}>
            <input type="hidden" name="entity_type" value={entityType} />
            <input type="hidden" name="entity_id" value={entityId} />
            <input type="hidden" name="planter_id" value={planterId} />
            {title && <input type="hidden" name="title" value={title} />}
            <label>
              Your reply
              <textarea required name="body" maxLength={2000} placeholder="Write a thoughtful reply or update…" />
            </label>
          </SaveForm>
        </div>
      )}
    </section>
  );
}

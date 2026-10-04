"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Objective, SaveResult } from "@/lib/workspace/types";
import {
  OBJECTIVE_STATUSES, OBJECTIVE_STATUS_LABELS, normalizeObjectiveStatus,
  type ObjectiveStatus,
} from "@/lib/workspace/objective-status";

type Perform = (form: FormData) => Promise<SaveResult>;

export function ObjectiveStatusControl({ objective, perform, onMoved, disabled = false }: {
  objective: Objective;
  perform: Perform;
  onMoved?: (status: ObjectiveStatus) => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(normalizeObjectiveStatus(objective.status));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  function move(next: ObjectiveStatus) {
    if (next === status || pending || disabled) return;
    setError("");
    setConfirmation("");
    startTransition(async () => {
      const form = new FormData();
      form.set("intent", "objective_status");
      form.set("objective_id", objective.id);
      form.set("status", next);
      try {
        const result = await perform(form);
        if (!result.ok) {
          setError(result.error ?? "We couldn't move this objective. Please try again.");
          return;
        }
        setStatus(next);
        setConfirmation(`Moved to ${OBJECTIVE_STATUS_LABELS[next]}.`);
        onMoved?.(next);
        router.refresh();
      } catch {
        setError("Connection interrupted. Refresh to check the saved status before trying again.");
      }
    });
  }

  return <div className="ff-status-control">
    <label className="ff-status-control-label">
      Move to
      <select
        className="ff-status-control-select"
        aria-label={`Move ${objective.title} to`}
        value={status}
        disabled={pending || disabled}
        onChange={event => move(event.target.value as ObjectiveStatus)}
      >
        {OBJECTIVE_STATUSES.map(value => <option className="ff-status-control-option" key={value} value={value}>{OBJECTIVE_STATUS_LABELS[value]}</option>)}
      </select>
    </label>
    {pending && <p className="ff-status-control-pending" role="status">Saving status…</p>}
    {confirmation && <p className="ff-status-control-confirmation" role="status">{confirmation}</p>}
    {error && <p role="alert" className="ff-error ff-status-control-error">{error}</p>}
  </div>;
}

export function ObjectiveBoard({ objectives, categoryTitle, canManage, perform, onOpen }: {
  objectives: Objective[];
  categoryTitle: (id: string) => string;
  canManage: boolean;
  perform: Perform;
  onOpen: (objective: Objective) => void;
}) {
  // Parent keys this board by server statuses so a refresh reconciles local moves.
  const [moves, setMoves] = useState<Record<string, ObjectiveStatus>>({});
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [dragged, setDragged] = useState<string | null>(null);
  const [target, setTarget] = useState<ObjectiveStatus | null>(null);
  const [error, setError] = useState("");

  async function guardedPerform(form: FormData): Promise<SaveResult> {
    if (!canManage || busy.current) return { ok: false, error: "Please wait for the current move to finish." };
    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    try { return await perform(form); }
    finally { busy.current = false; setSaving(false); }
  }

  function moved(id: string, title: string, next: ObjectiveStatus) {
    setMoves(current => ({ ...current, [id]: next }));
    setNotice(`${title} moved to ${OBJECTIVE_STATUS_LABELS[next]}.`);
  }

  async function drop(next: ObjectiveStatus) {
    const objective = objectives.find(o => o.id === dragged);
    setDragged(null);
    setTarget(null);
    if (!canManage || busy.current || !objective ||
      (moves[objective.id] ?? normalizeObjectiveStatus(objective.status)) === next) return;
    const form = new FormData();
    form.set("intent", "objective_status");
    form.set("objective_id", objective.id);
    form.set("status", next);
    try {
      const result = await guardedPerform(form);
      if (!result.ok) { setError(result.error ?? "We couldn't move this objective. Please try again."); return; }
      moved(objective.id, objective.title, next);
      router.refresh();
    } catch {
      setError("Connection interrupted. Refresh to check the saved status before trying again.");
    }
  }

  return <>
    <p className="ff-field-help ff-board-instructions">{canManage
      ? "Drag an objective using its handle into another column, or choose Move to. Changes save automatically."
      : "Open an objective to see its progress. Your planter manages its status."}</p>
    {saving && <p className="ff-board-saving" role="status">Saving status…</p>}
    {error && <p role="alert" className="ff-error ff-board-error">{error}</p>}
    {notice && <p role="status" className="ff-notice ff-board-notice">{notice}</p>}
    <div className="ff-board" role="region" aria-label="Objective board" tabIndex={0}>
      {OBJECTIVE_STATUSES.map(status => {
        const cards = objectives.filter(o => (moves[o.id] ?? normalizeObjectiveStatus(o.status)) === status);
        return <section key={status} className={`ff-board-column status-${status}${target === status ? " is-drop-target" : ""}`} aria-label={OBJECTIVE_STATUS_LABELS[status]}
          onDragOver={event => {
            if (!canManage || !dragged || saving) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setTarget(status);
          }}
          onDragLeave={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setTarget(null);
          }}
          onDrop={event => { event.preventDefault(); void drop(status); }}
        >
          <header className="ff-board-heading"><h3 className="ff-board-column-title">{OBJECTIVE_STATUS_LABELS[status]}</h3><span className="ff-board-column-count" aria-label={`${cards.length} objectives`}>{cards.length}</span></header>
          {cards.length === 0 && <p className="ff-board-empty">No objectives here.</p>}
          {cards.map(objective => <article key={objective.id} className={`ff-board-card${dragged === objective.id ? " is-dragging" : ""}`}>
            {canManage && <div className="ff-board-drag-handle"
              draggable={!saving}
              title="Drag to another column, or use Move to below"
              onDragStart={event => {
                if (busy.current) { event.preventDefault(); return; }
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", objective.id);
                const card = event.currentTarget.closest("article");
                if (card) {
                  const bounds = card.getBoundingClientRect();
                  event.dataTransfer.setDragImage(card, event.clientX - bounds.left, event.clientY - bounds.top);
                }
                setDragged(objective.id);
                setError("");
              }}
              onDragEnd={() => { setDragged(null); setTarget(null); }}
            ><span className="ff-board-drag-icon" aria-hidden="true">⠿</span> Drag to move</div>}
            <button className="ff-board-open" onClick={() => onOpen(objective)} aria-label={`Open ${objective.title}`}>
              <span className="ff-eyebrow ff-board-card-category">{categoryTitle(objective.category_id)}</span>
              <h4 className="ff-board-card-title">{objective.title}</h4>
              {objective.description && <p className="ff-board-card-description">{objective.description}</p>}
              <small className="ff-board-card-schedule">{objective.cadence === "weekly" ? "Weekly" : "Monthly"}{objective.due_date ? ` · Target ${objective.due_date}` : ""}</small>
              {objective.team_visible && <span className="ff-board-shared">Shared with Church Team</span>}
            </button>
            {canManage && <ObjectiveStatusControl
              objective={{ ...objective, status }} perform={guardedPerform} disabled={saving}
              onMoved={next => {
                moved(objective.id, objective.title, next);
              }}
            />}
          </article>)}
        </section>;
      })}
    </div>
  </>;
}

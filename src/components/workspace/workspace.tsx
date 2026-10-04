"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Link } from "@/i18n/routing";
import { saveWorkspace } from "@/app/[locale]/dashboard/actions";
import { signOut } from "@/app/[locale]/actions";
import type { Activity, Objective, WorkspaceData, SaveResult } from "@/lib/workspace/types";
import "./workspace.css";
import { DashboardInsights } from "./dashboard-insights";

type IconName = "home" | "leaf" | "heart" | "chat" | "arrow" | "plus" | "check" | "globe" | "close";
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10H3Z" /><path d="M9 20v-7h6v7" /></>,
    leaf: <><path d="M20 3C8 2 2 8 5 16c8 4 15-1 15-13Z" /><path d="m3 21 12-12" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    chat: <path d="M21 11a9 9 0 0 1-9 9H3l1.7-4A9 9 0 1 1 21 11Z" />,
    arrow: <><path d="M4 12h16M14 6l6 6-6 6" /></>,
    plus: <path d="M12 5v14M5 12h14" />, check: <path d="m5 12 4 4L19 6" />,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function date(value: string) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value)); }
function initials(name: string) { return name.split(" ").map(n => n[0]).slice(0, 2).join(""); }
function Empty({ children }: { children: ReactNode }) { return <p className="ff-empty">{children}</p>; }

export function Globe() {
  return <div className="ff-world" aria-hidden="true"><div className="ff-orbit ff-orbit-one" /><div className="ff-orbit ff-orbit-two" /><div className="ff-sphere"><div className="ff-land" /><div className="ff-latitude" /><div className="ff-longitude" /><span className="ff-map-pin"><span /></span></div></div>;
}

export function SaveForm({ intent, children, onSaved, submit = "Save", perform = saveWorkspace }: { intent: string; children: ReactNode; onSaved?: (result: SaveResult) => void; submit?: string; perform?: (form: FormData) => Promise<SaveResult> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(""); setSaved(false);
    startTransition(async () => {
      try {
        const result = await perform(form);
        if (!result.ok) { setError(result.error ?? "We couldn't save. Please try again."); return; }
        setSaved(true); formRef.current?.reset(); router.refresh(); onSaved?.(result);
      } catch { setError("Connection interrupted. Your text is still here. Please try again."); }
    });
  }
  return <form ref={formRef} onSubmit={handleSubmit} className="ff-form"><input type="hidden" name="intent" value={intent} /><fieldset disabled={pending}>{children}</fieldset>{error && <p role="alert" className="ff-error">{error}</p>}{saved && <p role="status" className="ff-success">Saved successfully.</p>}<button className="ff-button ff-primary" disabled={pending} type="submit">{pending ? "Saving…" : submit}{!pending && <Icon name="arrow" size={17} />}</button></form>;
}

export function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <dialog ref={node => { dialog.current = node; if (node && !node.open) node.showModal(); }} className="ff-modal" aria-label={title} onCancel={close} onClick={e => { if (e.target === dialog.current) close(); }}><div className="ff-modal-heading"><h2>{title}</h2><button className="ff-icon-button" onClick={close} aria-label="Close dialog"><Icon name="close" /></button></div>{children}</dialog>;
}

export function Workspace({ data, preview = false, initialView, initialObjective }: { data: WorkspaceData; preview?: boolean; initialView?: string; initialObjective?: string }) {
  const validObjective = data.objectives.some(objective => objective.id === initialObjective) ? initialObjective! : null;
  const [view, setView] = useState(validObjective ? "objectives" : ["overview", "objectives", "updates", "prayers"].includes(initialView ?? "") ? initialView! : "overview");
  const [selected, setSelected] = useState<string | null>(validObjective);
  const [modal, setModal] = useState<"objective" | "prayer" | null>(null);  const [editObjective, setEditObjective] = useState<Objective | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityForm, setActivityForm] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const isOwner = data.viewer.id === data.planter.id;
  const catalyst = data.viewer.role === "catalyst";
  const objective = data.objectives.find(o => o.id === selected);
  const latest = data.checkIns[0];
const [heroSlide, setHeroSlide] = useState(0);

useEffect(() => {
  if (view !== "overview") return;

  const timer = window.setInterval(() => {
    setHeroSlide(current => (current + 1) % 2);
  }, 7000);

  return () => window.clearInterval(timer);
}, [view]);
  const active = data.objectives.filter(o => o.status === "active");
  const completed = data.objectives.filter(o => o.status === "done");
  const ordinaryCategories = data.categories.filter(c => c.kind === "objective");
  const perform = preview ? async (): Promise<SaveResult> => ({ ok: false, error: "This is a visual preview with sample data. Sign in to the connected workspace to save changes." }) : saveWorkspace;
  function updateAddress(next: string, objectiveId?: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    if (objectiveId) url.searchParams.set("objective", objectiveId);
    else url.searchParams.delete("objective");
    window.history.replaceState(null, "", url);
  }
  function navigate(next: string) { setView(next); setSelected(null); setNotice(""); updateAddress(next); }
  function openObjective(item: Objective) { setSelected(item.id); setView("objectives"); setActivityForm(false); setEditingActivity(null); updateAddress("objectives", item.id); }
  function saved() { setModal(null); setEditObjective(null); setNotice("Saved. Your Catalyst can see your update."); }
  const categoryTitle = (id: string) => data.categories.find(c => c.id === id)?.title ?? "Objective";
  const authorName = (id: string) =>
  data.people.find(p => p.id === id)?.display_name ??
  (id === data.viewer.id
    ? data.viewer.display_name
    : id === data.planter.id
      ? data.planter.display_name
      : "Unknown author");  const heading = objective ? objective.title : view === "overview" ? (isOwner ? `A little progress. Lasting fruit.` : `${data.planter.display_name}’s journey`) : view === "objectives" ? "A vision, put into practice." : view === "prayers" ? "You don’t have to carry it alone." : "Every step tells a story.";

  return <div className="ff-app">
    <header className="ff-topbar"><Link href="/dashboard" className="ff-brand"><Brand /><span className="ff-edition">with SEND Network</span></Link><div className="ff-topbar-right"><span className="ff-connected"><i />{preview ? "Sample data preview" : "Your planting journey"}</span><span className="ff-avatar">{initials(data.viewer.display_name)}</span><span>{data.viewer.display_name}</span></div></header>
    <aside className="ff-sidebar"><div className="ff-church"><span className="ff-church-icon"><Icon name="leaf" size={23} /></span><div><strong>{data.church?.name ?? "First Fruits"}</strong><small>{data.church?.city ?? "Your planting community"}</small></div></div><p className="ff-nav-label">YOUR WORKSPACE</p><nav aria-label="Workspace">{([{ id: "overview", label: "Overview", icon: "home" }, { id: "objectives", label: "Objectives", icon: "leaf" }, { id: "updates", label: "Check-ins & progress", icon: "chat" }, { id: "prayers", label: "Prayer & support", icon: "heart" }] as const).map(item => <button key={item.id} className={`ff-nav-item ${view === item.id ? "is-active" : ""}`} onClick={() => navigate(item.id)} aria-current={view === item.id ? "page" : undefined}><Icon name={item.icon} />{item.label}{item.id === "objectives" && <span>{active.length}</span>}</button>)}</nav>
      {catalyst && <div className="ff-planter-switch"><p className="ff-nav-label">YOUR PLANTERS</p>{data.people.filter(p => p.role === "planter").map(p => <Link key={p.id} href={`/dashboard?planter=${p.id}`} className={p.id === data.planter.id ? "is-active" : ""}>{p.display_name}</Link>)}<Link href="/invite-pastor">+ Invite a planter</Link></div>}
      <div className="ff-sidebar-bottom">{catalyst && <Link className="ff-home-link" href={preview ? "/preview?role=catalyst" : "/dashboard"}>← All planters</Link>}<Link className="ff-home-link" href={preview ? "/preview?role=catalyst" : "/"}>{preview ? "View Catalyst preview" : "← Back to home"}</Link><div className="ff-care-note"><Icon name="heart" /><strong>Growth takes a community.</strong><p>Your Catalyst is here to walk with you, through the wins and the hard weeks.</p><button onClick={() => navigate("prayers")}>Find support <Icon name="arrow" size={15} /></button></div>{!preview && <form action={signOut}><button className="ff-signout">Sign out</button></form>}<span className="ff-footer-brand">Small steps. Deep roots.</span></div>
    </aside>
    <main className="ff-main">
      {preview && <div className="ff-preview-banner">Design preview · All names and activity are fictional. Saving is available in the connected workspace.</div>}
      <div className="ff-breadcrumb"><Icon name="home" size={14} /><span>Workspace</span><span>/</span><span>{objective ? "Objective detail" : view === "overview" ? "Overview" : view === "prayers" ? "Prayer & support" : view === "updates" ? "Check-ins & progress" : "Objectives"}</span></div>
      <div className="ff-page-heading"><div><p className="ff-eyebrow">{objective ? categoryTitle(objective.category_id) : isOwner ? `YOUR JOURNEY, ${data.planter.display_name.split(" ")[0].toUpperCase()}` : "WALKING ALONGSIDE"}</p><h1>{heading}</h1><p>{objective ? objective.description || "Give this objective a little attention today." : "Notice the growth. Share the challenges. Take the next faithful step."}</p></div>{isOwner && !objective && <button
  className="ff-button ff-primary"
  onClick={() => {
    setEditObjective(null);
    setModal("objective");
  }}
>
  <Icon name="plus" size={17} />
  Create objective
</button>}</div>
      {notice && <div className="ff-notice" role="status"><Icon name="check" size={18} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><Icon name="close" size={15} /></button></div>}

      {view === "overview" && <>
        <section
  className="ff-hero"
  aria-label="Workspace highlights"
  aria-roledescription="carousel">
  <div className="ff-hero-content">
    <div
      key={heroSlide}
      className="ff-hero-slide"
      role="group"
      aria-roledescription="slide"
      aria-label={`${heroSlide + 1} of 2`}
    >
      {heroSlide === 0 ? (
        <>
          <span className="ff-pill">
            <i /> YOUR FIELD OF POSSIBILITY
          </span>

          <h2>
            Good things
            <br />
            are taking root.
          </h2>

          <p>
            {data.church?.vision ||
              "Every conversation, every act of care, every small step is part of a bigger story."}
          </p>

          <div className="ff-hero-actions">
            <span>
              {data.church?.city || "Rooted in your community"}
            </span>
          </div>
        </>
      ) : (
        <>
          <span className="ff-pill">
            <i /> ROOM FOR THE WHOLE YOU
          </span>

          <h2>
            {latest
              ? "Thank you for showing up."
              : "How are you, really?"}
          </h2>

          <p>
            {latest
              ? `Your last check-in was ${date(latest.created_at)}. Every honest update helps your Catalyst know how to support you.`
              : "A short reflection can open a meaningful conversation. Share a win, a challenge, or what you need prayer for."}
          </p>

          <div className="ff-hero-actions">
            <button
              className="ff-button ff-dark"
              onClick={() =>
                navigate(isOwner ? "objectives" : "updates")
              }
            >
              {isOwner ? "Explore  your objectives" : "Read check-ins"}
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </>
      )}
    </div>

  </div>

  <Globe />
</section>
        <div className="ff-stats"><button className="ff-stat" onClick={() => navigate("objectives")}><span><Icon name="leaf" />Active objectives</span><strong>{active.length.toString().padStart(2, "0")}</strong><small>{completed.length} completed · one step at a time</small></button><button className="ff-stat" onClick={() => navigate("updates")}><span><Icon name="chat" />Progress shared</span><strong>{data.progress.length.toString().padStart(2, "0")}</strong><small>{data.progress[0] ? `Latest update ${date(data.progress[0].created_at)}` : "Your first update starts the story"}</small></button><button className="ff-stat" onClick={() => navigate("prayers")}><span><Icon name="heart" />Prayers carried together</span><strong>{data.prayers.filter(p => !p.resolved).length.toString().padStart(2, "0")}</strong><small>A space for what’s on your heart</small></button></div>
        <div className="ff-overview-grid"><section className="ff-panel"><div className="ff-section-heading"><div><p className="ff-eyebrow">KEEP GROWING</p><h2>Your next faithful steps</h2></div><button className="ff-text-button" onClick={() => navigate("objectives")}>View all <Icon name="arrow" size={15} /></button></div>{active.slice(0, 3).map((o, index) => <button key={o.id} className="ff-objective-row" onClick={() => openObjective(o)}><span className={`ff-category-icon tone-${index % 3}`}><Icon name="leaf" /></span><span><small>{categoryTitle(o.category_id)}</small><strong>{o.title}</strong><em>{data.activities.filter(a => a.objective_id === o.id).length} activities · {o.cadence}</em></span><Icon name="arrow" size={17} /></button>)}{!active.length && <Empty>A small, specific goal is a good place to start. Add your first objective below.</Empty>}{isOwner && <button className="ff-add-row" onClick={() => { setEditObjective(null); setModal("objective"); }}><Icon name="plus" size={18} />Plant a new objective</button>}</section>
        </div>
      </>}

      {view === "objectives" && !objective && <section className="ff-panel"><div className="ff-section-heading"><div><h2>Your objectives</h2><p>Turn your vision into small, meaningful actions.</p></div>{isOwner && <button className="ff-button ff-primary" onClick={() => { setEditObjective(null); setModal("objective"); }}><Icon name="plus" size={17} />New objective</button>}</div><label className="ff-search"><span>Find an objective</span><input placeholder="Search by title or category…" value={query} onChange={e => setQuery(e.target.value)} /></label><div className="ff-objective-grid">{data.objectives.filter(o => `${o.title} ${categoryTitle(o.category_id)}`.toLowerCase().includes(query.toLowerCase())).map((o, index) => <button className="ff-objective-card" key={o.id} onClick={() => openObjective(o)}><div><span className={`ff-category-icon tone-${index % 3}`}><Icon name="leaf" /></span><span className={`ff-status status-${o.status}`}>{o.status === "done" ? "Completed" : o.status}</span></div><p className="ff-eyebrow">{categoryTitle(o.category_id)}</p><h3>{o.title}</h3><p>{o.description || "One faithful step at a time."}</p><footer>{data.activities.filter(a => a.objective_id === o.id).length} activities · {o.cadence}<Icon name="arrow" size={17} /></footer></button>)}</div>{!data.objectives.length && <Empty>No objectives yet. Add a goal you can begin working toward this week.</Empty>}{data.objectives.length > 0 && !data.objectives.some(o => `${o.title} ${categoryTitle(o.category_id)}`.toLowerCase().includes(query.toLowerCase())) && <Empty>No objectives match your search.</Empty>}</section>}

      {objective && <><button className="ff-text-button ff-back" onClick={() => navigate("objectives")}>← All objectives</button><div className="ff-detail-grid"><div><section className="ff-panel"><div className="ff-section-heading"><h2>The next small steps</h2><span className={`ff-status status-${objective.status}`}>{objective.status}</span></div><p className="ff-muted">Repeatable activities help you put this objective into practice.</p>{data.activities.filter(a => a.objective_id === objective.id).map(a => <div className="ff-activity" key={a.id}><span className="ff-activity-dot" /><div><strong>{a.description}</strong><small>{a.cadence === "weekly" ? "Every week" : "Every month"}</small></div>{isOwner && <button className="ff-text-button" onClick={() => { setEditingActivity(a); setActivityForm(true); }}>Edit</button>}</div>)}{!data.activities.some(a => a.objective_id === objective.id) && <Empty>No activities yet. What’s one repeatable action that would move this forward?</Empty>}{objective.due_date && (
  <p className="ff-muted">
    <strong>Target date: </strong>
    {new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${objective.due_date}T00:00:00Z`))}
  </p>
)}{isOwner && !activityForm && <button className="ff-add-row" onClick={() => { setEditingActivity(null); setActivityForm(true); }}><Icon name="plus" size={17} />Add an activity</button>}{activityForm && <SaveForm key={editingActivity?.id ?? "new"} intent="activity" perform={perform} submit={editingActivity ? "Save activity" : "Add activity"} onSaved={() => setActivityForm(false)}><input type="hidden" name="objective_id" value={objective.id} />{editingActivity && <input type="hidden" name="id" value={editingActivity.id} />}<label>Activity<input name="description" defaultValue={editingActivity?.description} required maxLength={500} placeholder="e.g. Meet a neighbour for coffee" /></label><label>Cadence<select name="cadence" defaultValue={editingActivity?.cadence ?? "weekly"}><option value="weekly">Every week</option><option value="monthly">Every month</option></select></label><button className="ff-text-button" type="button" onClick={() => setActivityForm(false)}>Cancel</button></SaveForm>}</section>
        <section className="ff-panel"><div className="ff-section-heading"><h2>Progress, in your words</h2><Icon name="leaf" /></div>{isOwner && <SaveForm intent="progress" perform={perform} submit="Share progress"><input name="objective_id" type="hidden" value={objective.id} /><label>
  How is this objective progressing?
  <textarea
    name="note"
    required
    maxLength={2000}
    placeholder="What moved forward? What is getting in the way? What support would help?"
  />
</label><div className="ff-form-row"><label>Related activity<select name="activity_id"><option value="">Whole objective</option>{data.activities.filter(a => a.objective_id === objective.id).map(a => <option key={a.id} value={a.id}>{a.description}</option>)}</select></label><label>Number (optional)<input name="value" type="number" min="0" max="1000000000" step="any" placeholder="e.g. 3" /></label></div></SaveForm>}<div className="ff-timeline">{data.progress.filter(p => p.objective_id === objective.id).map(p => <article key={p.id}><span className="ff-timeline-dot" /><small>
  {authorName(p.author_id)} ·{" "}
  <time dateTime={p.created_at}>
    {date(p.created_at)} ·{" "}
    {new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(p.created_at))} UTC
  </time>
</small><p>{p.note}</p>{p.value !== null && <span className="ff-pill">Recorded: {p.value}</span>}</article>)}</div>{!data.progress.some(p => p.objective_id === objective.id) && <Empty>Your progress story will appear here.</Empty>}</section></div>
        <div><section className="ff-panel ff-dialogue"><div className="ff-section-heading"><h2>Walk together</h2><Icon name="chat" /></div><p className="ff-muted">A conversation between you and your Catalyst.</p><div className="ff-messages">{data.messages.filter(m => m.objective_id === objective.id).map(m => <article key={m.id} className={m.author_id === data.viewer.id ? "is-mine" : ""}><header><strong>{authorName(m.author_id)}</strong><time dateTime={m.created_at}>{date(m.created_at)} · {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(m.created_at))} UTC</time></header><p>{m.body}</p></article>)}</div>{!data.messages.some(m => m.objective_id === objective.id) && <Empty>Start a conversation. Share encouragement or ask for support.</Empty>}<SaveForm intent="message" perform={perform} submit="Send reply"><input type="hidden" name="objective_id" value={objective.id} /><label>Your message<textarea required name="body" maxLength={2000} placeholder="Write a thoughtful reply…" /></label></SaveForm></section><section className="ff-panel ff-objective-settings"><p className="ff-eyebrow">ABOUT THIS OBJECTIVE</p><p><strong>{categoryTitle(objective.category_id)}</strong></p><p className="ff-muted">Visible to the planter and their Catalyst. Personal growth is never scored.</p>{isOwner && <><button className="ff-button ff-white" onClick={() => { setEditObjective(objective); setModal("objective"); }}>Edit objective</button><SaveForm intent="objective_status" perform={perform} submit="Update status"><input type="hidden" name="objective_id" value={objective.id} /><label>Status<select name="status" defaultValue={objective.status}><option value="active">Active</option><option value="paused">Paused</option><option value="done">Completed</option></select></label></SaveForm></>}</section></div></div></>}

      {view === "updates" && <div className="ff-detail-grid"><section className="ff-panel"><div className="ff-section-heading"><h2>Your check-ins</h2>{isOwner && <button className="ff-text-button" onClick={() => navigate("objectives")}>
  Open your objectives <Icon name="arrow" size={16} />
</button>}</div><p className="ff-muted">An honest picture of the journey. Visible to the planter and their Catalyst.</p>{data.checkIns.map(c => <article className="ff-update" key={c.id}><header><time dateTime={c.created_at}>{date(c.created_at)}</time><span className="ff-status">{c.feeling}</span></header><p>{c.note}</p><small>Planting momentum: {c.momentum === "moving" ? "Moving forward" : c.momentum === "stuck" ? "Could use support" : "Steady"}</small>{c.support && <div className="ff-support"><Icon name="heart" size={17} /><div><strong>Support requested</strong><p>{c.support}</p></div></div>}</article>)}{!data.checkIns.length && <Empty>No check-ins yet. Start with how you’re feeling today.</Empty>}</section><section className="ff-panel"><h2>Recent progress</h2>{data.progress.map(p => <button className="ff-update ff-progress-link" key={p.id} onClick={() => { const o = data.objectives.find(o => o.id === p.objective_id); if (o) openObjective(o); }}><small>{date(p.created_at)} · {data.objectives.find(o => o.id === p.objective_id)?.title}</small><p>{p.note}</p><span className="ff-text-button">Open objective <Icon name="arrow" size={15} /></span></button>)}{!data.progress.length && <Empty>Updates from your objectives will appear here.</Empty>}</section></div>}

      {view === "prayers" && <div className="ff-detail-grid"><section className="ff-panel"><div className="ff-section-heading"><h2>Prayer requests</h2>{isOwner && <button className="ff-button ff-primary" onClick={() => setModal("prayer")}><Icon name="plus" size={17} />Ask for prayer</button>}</div><p className="ff-muted">Choose whether to share with your Catalyst or with your organization.</p>{data.prayers.map(p => <article className="ff-prayer" key={p.id}><span className="ff-category-icon tone-2"><Icon name="heart" /></span><div><small>{date(p.created_at)} · {p.visibility === "private" ? "Planter + Catalyst" : "Shared with organization"}</small><p>{p.body}</p><SaveForm intent="prayer_visibility" perform={perform} submit="Update sharing"><input name="id" type="hidden" value={p.id} /><label>Who can see this?<select name="visibility" defaultValue={p.visibility}><option value="private">Planter and Catalyst</option><option value="organization">Everyone in the organization</option></select></label></SaveForm></div></article>)}{!data.prayers.length && <Empty>No prayer requests yet. There’s room here for whatever is on your heart.</Empty>}</section><section className="ff-panel ff-checkin-card"><Icon name="heart" size={30} /><h2>Support starts with a conversation.</h2><p>Prayer requests and honest check-ins help your Catalyst understand where encouragement, resources, or a listening ear could make a difference.</p><p className="ff-muted">Requests for help never lower a score or change a church’s standing here.</p>{latest?.support && <div className="ff-support"><div><strong>From the latest check-in</strong><p>{latest.support}</p></div></div>}</section></div>}
      {view === "prayers" && <section className="ff-panel"><div className="ff-section-heading"><h2>Praying with your community</h2><Icon name="heart" /></div><p className="ff-muted">Requests other planters have shared with your organization.</p>{data.sharedPrayers?.map(p => <article className="ff-update" key={p.id}><small>{date(p.created_at)} · Shared by a planter in your organization</small><p>{p.body}</p></article>)}{!data.sharedPrayers?.length && <Empty>When someone shares a prayer request with the organization, you’ll find it here.</Empty>}</section>}
      {view === "overview" && <DashboardInsights data={data} openObjective={openObjective} openSupport={() => navigate("prayers")} />}
      <footer className="ff-main-footer"><Icon name="leaf" size={16} />First Fruits<span>Faithfulness in the everyday.</span></footer>
    </main>

{modal === "objective" && (
  <Modal
    title={editObjective ? "Edit your objective" : "Plant a new objective"}
    close={() => setModal(null)}
  >
    <p className="ff-muted">
      Start with something meaningful and achievable.
    </p>

    <SaveForm
      intent="objective"
      perform={perform}
      submit={editObjective ? "Save objective" : "Create objective"}
      onSaved={saved}
    >
      {editObjective && (
        <input type="hidden" name="id" value={editObjective.id} />
      )}

      <label>
        Category
        <select
          name="category_id"
          defaultValue={editObjective?.category_id ?? ""}
          required
        >
          <option value="" disabled>
            Choose an area of growth
          </option>
          {ordinaryCategories.map(c => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>

      <label>
        What are you working toward?
        <input
          name="title"
          required
          maxLength={160}
          defaultValue={editObjective?.title}
          placeholder="e.g. Build relationships in our neighbourhood"
        />
      </label>

      <label>
        Why does it matter? (optional)
        <textarea
          name="description"
          maxLength={2000}
          defaultValue={editObjective?.description ?? ""}
          placeholder="A little context for you and your Catalyst…"
        />
      </label>

      <label>
        Target date (optional)
        <input
          type="date"
          name="due_date"
          defaultValue={editObjective?.due_date ?? ""}
        />
      </label>

      <label>
        Check-in frequency
        <select
          name="cadence"
          defaultValue={editObjective?.cadence ?? "weekly"}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>

      <p className="ff-field-help">
        Your objective and updates are visible to your Catalyst.
      </p>
    </SaveForm>
  </Modal>
)}    {modal === "prayer" && <Modal title="What’s on your heart?" close={() => setModal(null)}><SaveForm intent="prayer" perform={perform} submit="Save prayer request" onSaved={saved}><label>Your prayer request<textarea name="body" required maxLength={2000} placeholder="Share as much or as little as you feel comfortable with." /></label><label>Who would you like to share with?<select name="visibility" defaultValue="private"><option value="private">Just me and my Catalyst</option><option value="organization">Everyone in my organization</option></select></label><p className="ff-field-help">Your Catalyst can also change sharing with your organization.</p></SaveForm></Modal>}
  </div>;
}


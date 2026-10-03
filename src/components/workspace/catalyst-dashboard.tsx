"use client";
import { useState } from "react";
import { Brand } from "@/components/ui/Brand";
import { Link } from "@/i18n/routing";
import { signOut } from "@/app/[locale]/actions";
import { saveCategory } from "@/app/[locale]/dashboard/category-actions";
import type { CatalystData, Category, SaveResult } from "@/lib/workspace/types";
import { Icon, Globe, Modal, SaveForm } from "./workspace";
import "./workspace.css";

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value)) : "No update yet";

export function CatalystDashboard({ data, preview = false }: { data: CatalystData; preview?: boolean }) {
  const [view, setView] = useState("community");
  const [search, setSearch] = useState("");
  const [supportOnly, setSupportOnly] = useState(false);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [removing, setRemoving] = useState<Category | null>(null);
  const [notice, setNotice] = useState("");
  const planters = data.people.filter(person => person.role === "planter");
  const latestCheckIn = (id: string) => data.checkIns.find(checkIn => checkIn.planter_id === id);
  const needsSupport = (id: string) => { const latest = latestCheckIn(id); return Boolean(latest?.support.trim() || latest?.momentum === "stuck"); };
  const supportCount = planters.filter(person => needsSupport(person.id)).length;
  const activeObjectives = data.objectives.filter(objective => objective.status === "active");
  const personName = (id: string) => data.people.find(person => person.id === id)?.display_name ?? "Planter";
  const churchFor = (id: string) => data.churches.find(church => church.pastor_id === id);
  const detailHref = (id: string, section?: string, objective?: string) => preview
    ? `/preview?role=catalyst&planter=${encodeURIComponent(id)}${section ? `&view=${section}` : ""}${objective ? `&objective=${encodeURIComponent(objective)}` : ""}`
    : `/dashboard?planter=${encodeURIComponent(id)}${section ? `&view=${section}` : ""}${objective ? `&objective=${encodeURIComponent(objective)}` : ""}`;
  const latestMessages = data.objectives.flatMap(objective => {
    const message = data.messages.find(message => message.objective_id === objective.id);
    return message && message.author_id === objective.planter_id ? [{ objective, message }] : [];
  });
  const perform = preview ? async (): Promise<SaveResult> => ({ ok: false, error: "This is a visual preview. Sign in as a Catalyst to manage categories." }) : saveCategory;
  function saved() { setEditing(null); setRemoving(null); setNotice("Category changes saved for your organization."); }
  const filtered = planters.filter(person => {
    const church = churchFor(person.id);
    return `${person.display_name} ${church?.name ?? ""} ${church?.city ?? ""}`.toLowerCase().includes(search.toLowerCase()) && (!supportOnly || needsSupport(person.id));
  });
  const nav = [
    { id: "community", label: "Your community", icon: "globe" },
    { id: "support", label: "Support & conversations", icon: "chat" },
    { id: "prayers", label: "Prayer requests", icon: "heart" },
    { id: "categories", label: "Objective categories", icon: "leaf" },
  ] as const;
  return <div className="ff-app">
    <header className="ff-topbar"><Link href={preview ? "/preview?role=catalyst" : "/dashboard"} className="ff-brand"><Brand /><span className="ff-edition">with SEND Network</span></Link><div className="ff-topbar-right"><span className="ff-connected"><i/>{preview ? "Sample data preview" : data.organization}</span><span className="ff-avatar">{data.viewer.display_name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span><span>{data.viewer.display_name}</span></div></header>
    <aside className="ff-sidebar"><div className="ff-church"><span className="ff-church-icon"><Icon name="globe" size={23}/></span><div><strong>{data.organization}</strong><small>Catalyst workspace</small></div></div><p className="ff-nav-label">WALKING ALONGSIDE</p><nav aria-label="Catalyst workspace">{nav.map(item => <button key={item.id} className={`ff-nav-item ${view === item.id ? "is-active" : ""}`} aria-current={view === item.id ? "page" : undefined} onClick={() => setView(item.id)}><Icon name={item.icon}/>{item.label}</button>)}</nav><div className="ff-sidebar-bottom"><div className="ff-care-note"><Icon name="heart"/><strong>People before numbers.</strong><p>Let the updates open a conversation. Progress looks different for every planter.</p></div><Link className="ff-home-link" href={preview ? "/preview" : "/"}>{preview ? "View planter preview" : "← Back to home"}</Link>{!preview && <form action={signOut}><button className="ff-signout">Sign out</button></form>}</div></aside>
    <main className="ff-main">
      {preview && <div className="ff-preview-banner">Design preview · Fictional organization and sample records. Changes are not saved.</div>}
      <div className="ff-breadcrumb"><Icon name="home" size={14}/><span>Workspace</span><span>/</span><span>{nav.find(item => item.id === view)?.label}</span></div>
      <div className="ff-page-heading"><div><p className="ff-eyebrow">{data.organization.toUpperCase()}</p><h1>{view === "community" ? "Every planter. A story worth knowing." : view === "support" ? "Be there for the next step." : view === "prayers" ? "Carry their prayers together." : "Give their vision room to grow."}</h1><p>{view === "categories" ? "Shape the areas your planters use to organize their objectives." : "Stay close to the growth, the challenges, and the people behind them."}</p></div>{!preview && <Link href="/invite-pastor" className="ff-button ff-primary"><Icon name="plus" size={17}/>Invite a planter</Link>}</div>
      {notice && <div className="ff-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><Icon name="close" size={15}/></button></div>}
      {view === "community" && <>
        <section className="ff-hero ff-catalyst-hero"><div className="ff-hero-content"><span className="ff-pill"><i/> A SHARED CALLING</span><h2>Rooted in community.<br/>Growing together.</h2><p>See where your planters are taking steps, and where a conversation could make a difference.</p><button className="ff-button ff-dark" onClick={() => setView("support")}>See support & conversations <Icon name="arrow" size={17}/></button></div><Globe/></section>
        <div className="ff-stats ff-catalyst-stats"><button className="ff-stat" onClick={() => setSupportOnly(false)}><span><Icon name="globe"/>Planters in your community</span><strong>{planters.length}</strong><small>One organization, many planting journeys</small></button><div className="ff-stat"><span><Icon name="leaf"/>Active objectives</span><strong>{activeObjectives.length}</strong><small>Defined by your planters</small></div><button className="ff-stat" onClick={() => { setSupportOnly(true); }}><span><Icon name="heart"/>Support in latest check-ins</span><strong>{supportCount}</strong><small>Start with a listening ear</small></button></div>
        <section className="ff-panel"><div className="ff-section-heading"><div><p className="ff-eyebrow">YOUR PEOPLE</p><h2>Planter journeys</h2></div><span className="ff-status">{filtered.length} planters</span></div><div className="ff-table-controls"><label className="ff-search"><span>Find a planter or church</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, church, or city…"/></label><label className="ff-check-filter"><input type="checkbox" checked={supportOnly} onChange={event => setSupportOnly(event.target.checked)}/>Support mentioned in latest check-in</label></div><div className="ff-table-scroll"><table className="ff-planter-table"><thead><tr><th scope="col">Planter & church</th><th scope="col">Active objectives</th><th scope="col">Latest progress</th><th scope="col">Latest check-in</th><th scope="col">Workspace</th></tr></thead><tbody>{filtered.map(person => {
          const church = churchFor(person.id);
          const objectives = data.objectives.filter(objective => objective.planter_id === person.id);
          const latestProgress = data.progress.find(progress => objectives.some(objective => objective.id === progress.objective_id));
          const checkIn = latestCheckIn(person.id);
          return <tr key={person.id}><td><strong>{person.display_name}</strong><small>{church ? `${church.name}${church.city ? ` · ${church.city}` : ""}` : "Church setup in progress"}</small></td><td>{objectives.filter(objective => objective.status === "active").length}</td><td>{formatDate(latestProgress?.created_at)}</td><td><span className="ff-status">{checkIn?.feeling ?? "Not yet shared"}</span>{needsSupport(person.id) && <small>Support mentioned</small>}</td><td><Link className="ff-text-button" href={detailHref(person.id)} aria-label={`Open ${person.display_name}'s workspace`}>Open workspace →</Link></td></tr>;
        })}</tbody></table></div>{!filtered.length && <p className="ff-empty">{planters.length ? "No planters match these filters." : "Invite your first planter to begin. Their journey will appear here once they accept."}</p>}</section>
      </>}
      {view === "support" && <div className="ff-detail-grid"><section className="ff-panel"><div className="ff-section-heading"><h2>Support mentioned</h2><span className="ff-status">Latest check-ins</span></div><p className="ff-muted">These are self-reported needs, not assessments or overdue tasks.</p>{planters.filter(person => needsSupport(person.id)).map(person => <article className="ff-update" key={person.id}><header><strong>{person.display_name}</strong><small>{formatDate(latestCheckIn(person.id)?.created_at)}</small></header><p>{latestCheckIn(person.id)?.support || "This planter said they could use support with their planting work."}</p><Link href={detailHref(person.id, "updates")} className="ff-text-button">Read check-in →</Link></article>)}{!supportCount && <p className="ff-empty">No support needs were mentioned in the latest check-ins. You can still open any planter’s workspace and offer encouragement.</p>}</section><section className="ff-panel"><h2>Conversations to pick up</h2><p className="ff-muted">Objectives where the most recent message is from the planter.</p>{latestMessages.map(({ objective, message }) => <article className="ff-update" key={message.id}><small>{personName(objective.planter_id)} · {formatDate(message.created_at)}</small><h3>{objective.title}</h3><p>{message.body}</p><Link href={detailHref(objective.planter_id, "objectives", objective.id)} className="ff-text-button">Read & reply →</Link></article>)}{!latestMessages.length && <p className="ff-empty">No planter conversations are waiting for a reply.</p>}</section></div>}
      {view === "prayers" && <section className="ff-panel"><div className="ff-section-heading"><h2>Prayer across your community</h2><span className="ff-status">{data.prayers.length} requests</span></div><p className="ff-muted">As a Catalyst, you can see private and organization-shared requests in your organization.</p><div className="ff-prayer-grid">{data.prayers.map(prayer => <article className="ff-prayer-summary" key={prayer.id}><Icon name="heart"/><small>{personName(prayer.planter_id)} · {formatDate(prayer.created_at)}</small><p>{prayer.body}</p><span className="ff-status">{prayer.visibility === "private" ? "Planter + Catalyst" : "Shared with organization"}</span><Link href={detailHref(prayer.planter_id, "prayers")} className="ff-text-button">Open request & sharing →</Link></article>)}</div>{!data.prayers.length && <p className="ff-empty">Prayer requests will appear here when your planters share them.</p>}</section>}
      {view === "categories" && <section className="ff-panel"><div className="ff-section-heading"><div><h2>Objective categories</h2><p>Changes apply to everyone in your organization.</p></div><button className="ff-button ff-primary" onClick={() => setEditing("new")}><Icon name="plus" size={17}/>Add category</button></div>{data.categories.map(category => {
        const used = data.objectives.filter(objective => objective.category_id === category.id).length;
        return <article className="ff-category-row" key={category.id}><span className="ff-category-icon tone-0"><Icon name={category.kind === "prayer" ? "heart" : "leaf"}/></span><div><h3>{category.title}</h3><p>{category.description || "No description yet."}</p><small>{category.kind === "prayer" ? "Dedicated prayer workflow" : `${used} objectives`}</small></div><button className="ff-button ff-white" onClick={() => setEditing(category)} aria-label={`Edit ${category.title}`}>Edit</button>{category.kind !== "prayer" && !used && <button className="ff-text-button" onClick={() => setRemoving(category)} aria-label={`Remove ${category.title}`}>Remove</button>}</article>;
      })}</section>}
      <footer className="ff-main-footer"><Icon name="leaf" size={16}/>First Fruits<span>Care for the people. Notice the growth.</span></footer>
    </main>
    {editing && <Modal title={editing === "new" ? "Add a category" : "Edit category"} close={() => setEditing(null)}><SaveForm intent="category" perform={perform} submit="Save category" onSaved={saved}>{editing !== "new" && <input type="hidden" name="id" value={editing.id}/>}<label>Title<input required name="title" maxLength={120} defaultValue={editing === "new" ? "" : editing.title} placeholder="e.g. Serve the community"/></label><label>Description<textarea name="description" maxLength={1000} defaultValue={editing === "new" ? "" : editing.description ?? ""} placeholder="Help planters understand what belongs here."/></label>{editing !== "new" && editing.kind === "prayer" && <p className="ff-field-help">Renaming this category keeps its dedicated prayer workflow.</p>}</SaveForm></Modal>}
    {removing && <Modal title="Remove unused category?" close={() => setRemoving(null)}><p className="ff-muted">Remove “{removing.title}” from your organization? Categories with objectives cannot be removed.</p><SaveForm intent="remove_category" perform={perform} submit="Remove category" onSaved={saved}><input type="hidden" name="id" value={removing.id}/></SaveForm></Modal>}
  </div>;
}

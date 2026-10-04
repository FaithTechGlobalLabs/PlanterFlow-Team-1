"use client";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { SendNetworkLogo } from "@/components/ui/SendNetworkLogo";
import { Link } from "@/i18n/routing";
import { saveWorkspace } from "@/app/[locale]/dashboard/actions";
import type {
  Activity,
  Objective,
  WorkspaceData,
  SaveResult,
} from "@/lib/workspace/types";
import "./workspace.css";
import { AccountMenu } from "./account-menu";
import { ObjectiveBoard, ObjectiveStatusControl } from "./objective-board";
import {
  isOpenObjective,
  normalizeObjectiveStatus,
  OBJECTIVE_STATUS_LABELS,
} from "@/lib/workspace/objective-status";
import { DashboardInsights } from "./dashboard-insights";
import {
  PlanterGarden,
  NextTending,
  RhythmIndicator,
  TeamSnapshot,
  PlanterJourney,
} from "@/components/planter/planter-garden";
import "@/components/planter/planter.css";
import { ConversationThreadView } from "./conversation-thread-view";
import { ExportReportButton } from "./export-report-button";
type IconName =
  | "home"
  | "leaf"
  | "heart"
  | "chat"
  | "arrow"
  | "plus"
  | "check"
  | "globe"
  | "close";
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10H3Z" />
        <path d="M9 20v-7h6v7" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C8 2 2 8 5 16c8 4 15-1 15-13Z" />
        <path d="m3 21 12-12" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    chat: <path d="M21 11a9 9 0 0 1-9 9H3l1.7-4A9 9 0 1 1 21 11Z" />,
    arrow: (
      <>
        <path d="M4 12h16M14 6l6 6-6 6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
function date(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="ff-empty">{children}</p>;
}
export function Globe() {
  return (
    <div className="ff-world" aria-hidden="true">
      <div className="ff-orbit ff-orbit-one" />
      <div className="ff-orbit ff-orbit-two" />
      <div className="ff-sphere">
        <div className="ff-land" />
        <div className="ff-latitude" />
        <div className="ff-longitude" />
        <span className="ff-map-pin">
          <span />
        </span>
      </div>
    </div>
  );
}
export function SaveForm({
  intent,
  children,
  onSaved,
  submit = "Save",
  perform = saveWorkspace,
  showSubmit = true,
  onDraftChange,
  className,
}: {
  intent: string;
  children: ReactNode;
  onSaved?: (result: SaveResult) => void;
  submit?: string;
  perform?: (form: FormData) => Promise<SaveResult>;
  showSubmit?: boolean;
  onDraftChange?: (form: FormData) => void;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        const result = await perform(form);
        if (!result.ok) {
          setError(result.error ?? "We couldn't save. Please try again.");
          return;
        }
        setSaved(true);
        if (showSubmit) formRef.current?.reset();
        router.refresh();
        onSaved?.(result);
      } catch {
        setError(
          "Connection interrupted. Your text is still here. Please try again.",
        );
      }
    });
  }
  return (
    <form ref={formRef} onSubmit={handleSubmit}
      onChange={event => onDraftChange?.(new FormData(event.currentTarget))}
      className={["ff-form", className].filter(Boolean).join(" ")}>
      <input type="hidden" name="intent" value={intent} />
      <fieldset disabled={pending}>{children}</fieldset>
      {error && (
        <p role="alert" className="ff-error">
          {error}
        </p>
      )}
      {!showSubmit && pending && (
        <p role="status" className="ff-muted">
          Saving…
        </p>
      )}
      {saved && (
        <p role="status" className="ff-success">
          Your update is saved.
        </p>
      )}
      {showSubmit && (
        <button
          className="ff-button ff-primary"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving…" : submit}
          {!pending && <Icon name="arrow" size={17} />}
        </button>
      )}
    </form>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <dialog
      ref={(node) => {
        dialog.current = node;
        if (node && !node.open) node.showModal();
      }}
      className="ff-modal"
      aria-label={title}
      onCancel={close}
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
    >
      <div className="ff-modal-heading">
        <h2>{title}</h2>
        <button
          className="ff-icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
type ObjectiveDraft = {
  category_id: string;
  title: string;
  description: string;
  due_date: string;
  cadence: string;
  team_visible: boolean;
};

export function Workspace({
  data,
  preview = false,
  initialView,
  initialObjective,
}: {
  data: WorkspaceData;
  preview?: boolean;
  initialView?: string;
  initialObjective?: string;
}) {
  const validObjective = data.objectives.some(
    (objective) => objective.id === initialObjective,
  )
    ? initialObjective!
    : null;
  const [view, setView] = useState(
    validObjective
      ? "objectives"
      : [
            "overview",
            "objectives",
            "updates",
            "prayers",
            ...(data.viewer.role === "planter" &&
            data.viewer.id === data.planter.id
              ? ["today", "team", "journey"]
              : []),
          ].includes(initialView ?? "")
        ? initialView!
        : "overview",
  );
  const [navExpanded, setNavExpanded] = useState(false);
  const [selected, setSelected] = useState<string | null>(validObjective);
  const [modal, setModal] = useState<"objective" | "prayer" | null>(null);
  const [editObjective, setEditObjective] = useState<Objective | null>(null);
  const [objectiveDrafts, setObjectiveDrafts] = useState<Record<string, ObjectiveDraft>>({});
  const objectiveDraftKey = editObjective?.id ?? "new";
  const objectiveDraft = objectiveDrafts[objectiveDraftKey];
  function clearObjectiveDraft(key: string) {
    setObjectiveDrafts(current => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityForm, setActivityForm] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const isOwner =
    data.viewer.role === "planter" && data.viewer.id === data.planter.id;
  const catalyst = data.viewer.role === "catalyst";
  const objective = data.objectives.find((o) => o.id === selected);
  const isPeer = data.viewer.role === "peer";
  const canContribute = isOwner || (isPeer && objective?.team_visible === true);
  const teamReplies = (data.teamMessages ?? []).filter(
    (m) => m.objective_id === objective?.id,
  );
  const teamRepliesAvailable = data.teamMessages !== undefined;
  const canReplyToTeam =
    objective?.team_visible === true && (canContribute || catalyst);
  const latest = isPeer ? undefined : data.checkIns[0];
  const [heroSlide, setHeroSlide] = useState(0);
  useEffect(() => {
    if (
      view !== "overview" ||
      isOwner ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % 2);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [view, isOwner]);
  const active = data.objectives.filter((o) => isOpenObjective(o.status));
  const completed = data.objectives.filter(
    (o) => o.has_completed || normalizeObjectiveStatus(o.status) === "complete",
  );
  const ordinaryCategories = data.categories.filter(
    (c) => c.kind === "objective",
  );
  const perform = preview
    ? async (): Promise<SaveResult> => ({
        ok: false,
        error:
          "This is a visual preview with sample data. Sign in to the connected workspace to save changes.",
      })
    : saveWorkspace;
  function updateAddress(next: string, objectiveId?: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    if (objectiveId) url.searchParams.set("objective", objectiveId);
    else url.searchParams.delete("objective");
    window.history.replaceState(null, "", url);
  }
  function navigate(next: string) {
    setNavExpanded(false);
    setView(next);
    setSelected(null);
    setNotice("");
    updateAddress(next);
  }
  function openObjective(item: Objective) {
    setSelected(item.id);
    setView("objectives");
    setActivityForm(false);
    setEditingActivity(null);
    updateAddress("objectives", item.id);
  }
  function saved() {
    setModal(null);
    setEditObjective(null);
    setNotice("Saved. Your update is part of the journey.");
  }
  const categoryTitle = (id: string) =>
    data.categories.find((c) => c.id === id)?.title ?? "Objective";
  const authorName = (id: string) =>
    data.people.find((p) => p.id === id)?.display_name ??
    (id === data.viewer.id
      ? data.viewer.display_name
      : id === data.planter.id
        ? data.planter.display_name
        : "Unknown author");
  const heading = objective
    ? objective.title
    : view === "overview"
      ? isOwner
        ? `Your living church.`
        : `${data.planter.display_name}’s journey`
      : view === "objectives"
        ? "A vision, put into practice."
        : view === "prayers"
          ? "You don’t have to carry it alone."
          : view === "team"
            ? "The people growing with you."
            : view === "today"
              ? "A little attention, where it matters."
              : "Every step tells a story.";
  return (
    <div className={`ff-app ${isOwner ? "ff-planter-app" : ""}`}>
      {isOwner && (
        <a href="#workspace-main" className="ff-skip">
          Skip to content
        </a>
      )}
      <header className="ff-topbar">
        <Link href="/dashboard" className="ff-brand">
          <Brand />
        </Link>
        <div className="ff-topbar-right">
          <SendNetworkLogo className="ff-topbar__partner-logo h-5 w-auto" />
          <span className="ff-connected">
            <i />
            {preview ? "Sample data preview" : "Your planting journey"}
          </span>
          <AccountMenu name={data.viewer.display_name} preview={preview} />
        </div>
      </header>
      <aside className={`ff-sidebar ${navExpanded ? "is-expanded" : ""}`}>
        <button
          className="planter-work-nav-toggle"
          aria-expanded={navExpanded}
          aria-controls="planter-workspace-nav"
          onClick={() => setNavExpanded(!navExpanded)}
        >
          Workspace navigation · {view === "overview" ? "Garden" : view} ⌄
        </button>
        <div className="ff-church">
          <span className="ff-church-icon">
            <Icon name="leaf" size={23} />
          </span>
          <div className="ff-church-info">
            <strong className="ff-church-title">
              {data.church?.name ?? "First Fruits"}
            </strong>
            <small className="ff-church-subtitle">
              {data.church?.city ?? "Your planting community"}
            </small>
          </div>
        </div>
        <p className="ff-nav-label">YOUR WORKSPACE</p>
        <nav id="planter-workspace-nav" aria-label="Workspace">
          {(
            [
              ...(isOwner
                ? [
                    { id: "overview", label: "Garden", icon: "home" as const },
                    { id: "today", label: "Today", icon: "check" as const },
                  ]
                : [
                    {
                      id: "overview",
                      label: "Overview",
                      icon: "home" as const,
                    },
                  ]),
              { id: "objectives", label: "Objectives", icon: "leaf" },
              ...(!isOwner
                ? [
                    {
                      id: "updates",
                      label: isPeer ? "Progress" : "Check-ins & progress",
                      icon: "chat" as const,
                    },
                  ]
                : []),
              {
                id: "prayers",
                label: isPeer ? "Shared prayers" : "Prayer & support",
                icon: "heart",
              },
              ...(isOwner
                ? [
                    { id: "team", label: "Team", icon: "chat" as const },
                    { id: "journey", label: "Journey", icon: "leaf" as const },
                  ]
                : []),
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={`ff-nav-item ${view === item.id ? "is-active" : ""}`}
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.id === "objectives" && <span>{active.length}</span>}
            </button>
          ))}
        </nav>
        {catalyst && (
          <div className="ff-planter-switch">
            <p className="ff-nav-label">YOUR PLANTERS</p>
            {data.people
              .filter((p) => p.role === "planter")
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard?planter=${p.id}`}
                  className={p.id === data.planter.id ? "is-active" : ""}
                >
                  {p.display_name}
                </Link>
              ))}
            <Link href="/invite-pastor">+ Invite a planter</Link>
          </div>
        )}
        <div className="ff-sidebar-bottom">
          {catalyst && (
            <Link
              className="ff-home-link"
              href={preview ? "/preview?role=catalyst" : "/dashboard"}
            >
              ← All planters
            </Link>
          )}
          <Link
            className="ff-home-link"
            href={preview ? "/preview?role=catalyst" : "/"}
          >
            {preview ? "View Catalyst preview" : "← Back to home"}
          </Link>
          <div className="ff-care-note">
            <Icon name="heart" />
            <strong>Growth takes a community.</strong>
            <p>
              Your Catalyst is here to walk with you, through the wins and the
              hard weeks.
            </p>
            <button onClick={() => navigate("prayers")}>
              Find support <Icon name="arrow" size={15} />
            </button>
          </div>
          <span className="ff-footer-brand">Small steps. Deep roots.</span>
        </div>
      </aside>
      <main id="workspace-main" className="ff-main">
        {preview && (
          <div className="ff-preview-banner">
            Design preview · All names and activity are fictional. Saving is
            available in the connected workspace.
          </div>
        )}
        <div className="ff-breadcrumb">
          <Icon name="home" size={14} />
          <span>Workspace</span>
          <span>/</span>
          <span>
            {objective
              ? "Objective detail"
              : view === "overview"
                ? isOwner
                  ? "Garden"
                  : "Overview"
                : view === "prayers"
                  ? isPeer
                    ? "Shared prayers"
                    : "Prayer & support"
                  : view === "updates"
                    ? isPeer
                      ? "Progress"
                      : "Check-ins & progress"
                    : view === "today"
                      ? "Today"
                      : view === "team"
                        ? "Team"
                        : view === "journey" || (isOwner && view === "updates")
                          ? "Journey"
                          : "Objectives"}
          </span>
        </div>
        <div className="ff-page-heading">
          <div className="ff-page-heading-text">
            <p className="ff-eyebrow">
              {objective
                ? categoryTitle(objective.category_id)
                : isOwner
                  ? `YOUR JOURNEY, ${data.planter.display_name.split(" ")[0].toUpperCase()}`
                  : "WALKING ALONGSIDE"}
            </p>
            <h1 className="ff-page-title">{heading}</h1>
            <p className="ff-page-description">
              {objective
                ? objective.description ||
                  "Give this objective a little attention today."
                : "Notice the growth. Share the challenges. Take the next faithful step."}
            </p>
          </div>
          <div className="ff-page-heading-actions flex items-center gap-2">
            {!preview && (
              <ExportReportButton
                planterId={data.planter.id}
                planterName={data.planter.display_name}
              />
            )}
            {isOwner && !objective && ["overview", "today"].includes(view) && (
              <button
                className="ff-button ff-primary"
                onClick={() => {
                  setEditObjective(null);
                  setModal("objective");
                }}
              >
                <Icon name="plus" size={17} />
                Create objective
              </button>
            )}
          </div>
        </div>
        {notice && (
          <div className="ff-notice" role="status">
            <Icon name="check" size={18} />
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        )}
        {isOwner && view === "overview" && (
          <>
            <PlanterGarden
              data={data}
              openObjective={openObjective}
              createObjective={() => {
                setEditObjective(null);
                setModal("objective");
              }}
            />
            <div className="planter-work-grid">
              <NextTending data={data} openObjective={openObjective} />
              <RhythmIndicator data={data} />
            </div>
            <section className="ff-panel">
              <div className="ff-section-heading">
                <h2 className="ff-section-title">Your objective branches</h2>
                <button
                  className="ff-text-button"
                  onClick={() => navigate("objectives")}
                >
                  View all objectives
                </button>
              </div>
              {active.slice(0, 3).map((o) => (
                <button
                  key={o.id}
                  className="ff-objective-row"
                  onClick={() => openObjective(o)}
                >
                  <span>
                    <small>{categoryTitle(o.category_id)}</small>
                    <strong>{o.title}</strong>
                    <em>
                      {o.team_visible
                        ? "Shared with Church Team"
                        : "Planter + Catalyst"}
                    </em>
                  </span>
                  <Icon name="arrow" />
                </button>
              ))}
            </section>
          </>
        )}
        {isOwner && view === "today" && (
          <section className="planter-today">
            <p className="planter-eyebrow">WHAT DESERVES YOUR ATTENTION</p>
            <h2>One meaningful step is enough.</h2>
            <NextTending data={data} openObjective={openObjective} />
            <div className="planter-today-actions">
              {(data.threads ?? [])
                .filter(
                  (t) =>
                    t.status === "active" &&
                    t.messages.length &&
                    t.messages[t.messages.length - 1].author_id !==
                      data.viewer.id,
                )
                .slice(0, 1)
                .map((t) => (
                  <button key={t.id} onClick={() => navigate("prayers")}>
                    Return to{" "}
                    {t.entity_type === "prayer"
                      ? "a prayer conversation"
                      : "a support conversation"}
                    <small>{t.title || "Private with your Catalyst"}</small>
                  </button>
                ))}
              {data.progress
                .filter((p) => p.author_id !== data.viewer.id)
                .slice(0, 1)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const o = data.objectives.find(
                        (o) => o.id === p.objective_id,
                      );
                      if (o) openObjective(o);
                    }}
                  >
                    Notice a contribution
                    <small>
                      {authorName(p.author_id)} · {p.note}
                    </small>
                  </button>
                ))}
            </div>
          </section>
        )}
        {isOwner && view === "team" && (
          <TeamSnapshot data={data} preview={preview} full />
        )}
        {isOwner && (view === "journey" || view === "updates") && (
          <PlanterJourney data={data} openObjective={openObjective} />
        )}
        {view === "overview" && !isOwner && (
          <>
            <section
              className="ff-hero"
              aria-label="Workspace highlights"
              aria-roledescription="carousel"
            >
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
                      <h2 className="ff-hero-title">
                        Good things
                        <br />
                        are taking root.
                      </h2>
                      <p className="ff-hero-description">
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
                        <i />{" "}
                        {isPeer ? "GROW TOGETHER" : "ROOM FOR THE WHOLE YOU"}
                      </span>
                      <h2 className="ff-hero-title">
                        {isPeer
                          ? "Take the next step together."
                          : latest
                            ? "Thank you for showing up."
                            : "How are you, really?"}
                      </h2>
                      <p className="ff-hero-description">
                        {isPeer
                          ? "Explore the objectives your planter has shared, add activities, and share your progress."
                          : latest
                            ? `Your last check-in was ${date(latest.created_at)}. Every honest update helps your Catalyst know how to support you.`
                            : "A short reflection can open a meaningful conversation. Share a win, a challenge, or what you need prayer for."}
                      </p>
                      <div className="ff-hero-actions">
                        <button
                          className="ff-button ff-dark"
                          onClick={() =>
                            navigate(
                              isOwner || isPeer ? "objectives" : "updates",
                            )
                          }
                        >
                          {isPeer
                            ? "Explore shared objectives"
                            : isOwner
                              ? "Explore your objectives"
                              : "Read check-ins"}
                          <Icon name="arrow" size={17} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <Globe />
            </section>
            <div className="ff-stats">
              <button
                className="ff-stat"
                onClick={() => navigate("objectives")}
              >
                <span>
                  <Icon name="leaf" />
                  Open objectives
                </span>
                <strong>{active.length.toString().padStart(2, "0")}</strong>
                <small>
                  {completed.length} recorded outcomes · one step at a time
                </small>
              </button>
              <button className="ff-stat" onClick={() => navigate("updates")}>
                <span>
                  <Icon name="chat" />
                  Progress shared
                </span>
                <strong>
                  {data.progress.length.toString().padStart(2, "0")}
                </strong>
                <small>
                  {data.progress[0]
                    ? `Latest update ${date(data.progress[0].created_at)}`
                    : "Your first update starts the story"}
                </small>
              </button>
              <button className="ff-stat" onClick={() => navigate("prayers")}>
                <span>
                  <Icon name="heart" />
                  Prayers carried together
                </span>
                <strong>
                  {data.prayers
                    .filter((p) => !p.resolved)
                    .length.toString()
                    .padStart(2, "0")}
                </strong>
                <small>A space for what’s on your heart</small>
              </button>
            </div>
            <div className="ff-overview-grid">
              <section className="ff-panel">
                <div className="ff-section-heading">
                  <div className="ff-section-heading-text">
                    <p className="ff-eyebrow">KEEP GROWING</p>
                    <h2 className="ff-section-title">
                      Your next faithful steps
                    </h2>
                  </div>
                  <button
                    className="ff-text-button"
                    onClick={() => navigate("objectives")}
                  >
                    View all <Icon name="arrow" size={15} />
                  </button>
                </div>
                {active.slice(0, 3).map((o, index) => (
                  <button
                    key={o.id}
                    className="ff-objective-row"
                    onClick={() => openObjective(o)}
                  >
                    <span className={`ff-category-icon tone-${index % 3}`}>
                      <Icon name="leaf" />
                    </span>
                    <span>
                      <small>{categoryTitle(o.category_id)}</small>
                      <strong>{o.title}</strong>
                      <em>
                        {
                          data.activities.filter((a) => a.objective_id === o.id)
                            .length
                        }{" "}
                        activities · {o.cadence}
                      </em>
                    </span>
                    <Icon name="arrow" size={17} />
                  </button>
                ))}
                {!active.length && (
                  <Empty>
                    {isPeer
                      ? "No open shared objectives yet."
                      : "A small, specific goal is a good place to start. Add your first objective below."}
                  </Empty>
                )}
                {isOwner && (
                  <button
                    className="ff-add-row"
                    onClick={() => {
                      setEditObjective(null);
                      setModal("objective");
                    }}
                  >
                    <Icon name="plus" size={18} />
                    Plant a new objective
                  </button>
                )}
              </section>
            </div>
          </>
        )}
        {view === "objectives" && !objective && (
          <section className="ff-panel">
            <div className="ff-section-heading">
              <div className="ff-section-heading-text">
                <h2 className="ff-section-title">
                  {isPeer ? "Shared objectives" : "Your objectives"}
                </h2>
                <p>Turn your vision into small, meaningful actions.</p>
              </div>
              {isOwner && (
                <button
                  className="ff-button ff-primary"
                  onClick={() => {
                    setEditObjective(null);
                    setModal("objective");
                  }}
                >
                  <Icon name="plus" size={17} />
                  New objective
                </button>
              )}
            </div>
            <label className="ff-search">
              <span>Find an objective</span>
              <input
                placeholder="Search by title or category…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <ObjectiveBoard
              key={JSON.stringify(data.objectives.map((o) => [o.id, o.status]))}
              objectives={data.objectives.filter((o) =>
                `${o.title} ${categoryTitle(o.category_id)}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )}
              categoryTitle={categoryTitle}
              canManage={isOwner}
              perform={perform}
              onOpen={openObjective}
            />
            {!data.objectives.length && (
              <Empty>
                {isPeer
                  ? "Your planter has not shared any objectives with your Church Team yet."
                  : "Your first branch starts here. Create an objective for what you want to nurture next."}
              </Empty>
            )}
            {data.objectives.length > 0 &&
              !data.objectives.some((o) =>
                `${o.title} ${categoryTitle(o.category_id)}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && <Empty>No objectives match your search.</Empty>}
          </section>
        )}
        {objective && (
          <>
            <button
              className="ff-text-button ff-back"
              onClick={() => navigate("objectives")}
            >
              ← All objectives
            </button>
            <div className="ff-detail-grid">
              <div>
                <section className="ff-panel">
                  <div className="ff-section-heading">
                    <h2 className="ff-section-title">The next small steps</h2>
                    <span
                      className={`ff-status status-${normalizeObjectiveStatus(objective.status)}`}
                    >
                      {
                        OBJECTIVE_STATUS_LABELS[
                          normalizeObjectiveStatus(objective.status)
                        ]
                      }
                    </span>
                  </div>
                  <p className="ff-muted">
                    Repeatable activities help you put this objective into
                    practice.
                  </p>
                  {data.activities
                    .filter((a) => a.objective_id === objective.id)
                    .map((a) => (
                      <div className="ff-activity" key={a.id}>
                        <span className="ff-activity-dot" />
                        <div>
                          <strong>{a.description}</strong>
                          <small>
                            {a.cadence === "weekly"
                              ? "Every week"
                              : "Every month"}
                          </small>
                        </div>
                        {canContribute && (
                          <button
                            className="ff-text-button"
                            onClick={() => {
                              setEditingActivity(a);
                              setActivityForm(true);
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    ))}
                  {!data.activities.some(
                    (a) => a.objective_id === objective.id,
                  ) && (
                    <Empty>
                      No activities yet. What’s one repeatable action that would
                      move this forward?
                    </Empty>
                  )}
                  {objective.due_date && (
                    <p className="ff-muted">
                      <strong>Target date: </strong>
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(`${objective.due_date}T00:00:00Z`))}
                    </p>
                  )}
                  {canContribute && !activityForm && (
                    <button
                      className="ff-add-row"
                      onClick={() => {
                        setEditingActivity(null);
                        setActivityForm(true);
                      }}
                    >
                      <Icon name="plus" size={17} />
                      Add an activity
                    </button>
                  )}
                  {canContribute && activityForm && (
                    <SaveForm
                      key={editingActivity?.id ?? "new"}
                      intent="activity"
                      perform={perform}
                      submit={
                        editingActivity ? "Save activity" : "Add activity"
                      }
                      onSaved={() => setActivityForm(false)}
                    >
                      <input
                        type="hidden"
                        name="objective_id"
                        value={objective.id}
                      />
                      {editingActivity && (
                        <input
                          type="hidden"
                          name="id"
                          value={editingActivity.id}
                        />
                      )}
                      <label>
                        Activity
                        <input
                          name="description"
                          defaultValue={editingActivity?.description}
                          required
                          maxLength={500}
                          placeholder="e.g. Meet a neighbour for coffee"
                        />
                      </label>
                      <label>
                        Cadence
                        <select
                          name="cadence"
                          defaultValue={editingActivity?.cadence ?? "weekly"}
                        >
                          <option value="weekly">Every week</option>
                          <option value="monthly">Every month</option>
                        </select>
                      </label>
                      <button
                        className="ff-text-button"
                        type="button"
                        onClick={() => setActivityForm(false)}
                      >
                        Cancel
                      </button>
                    </SaveForm>
                  )}
                </section>
                <section className="ff-panel">
                  <div className="ff-section-heading">
                    <h2 className="ff-section-title">
                      Progress, in your words
                    </h2>
                    <Icon name="leaf" />
                  </div>
                  {canContribute && (
                    <SaveForm
                      intent="progress"
                      perform={perform}
                      submit="Share progress"
                    >
                      <input
                        name="objective_id"
                        type="hidden"
                        value={objective.id}
                      />
                      <label>
                        How is this objective progressing?
                        <textarea
                          name="note"
                          required
                          maxLength={2000}
                          placeholder="What moved forward? What is getting in the way? What support would help?"
                        />
                      </label>
                      <div className="ff-form-row">
                        <label>
                          Related activity
                          <select name="activity_id">
                            <option value="">Whole objective</option>
                            {data.activities
                              .filter((a) => a.objective_id === objective.id)
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.description}
                                </option>
                              ))}
                          </select>
                        </label>
                        <label>
                          Number (optional)
                          <input
                            name="value"
                            type="number"
                            min="0"
                            max="1000000000"
                            step="any"
                            placeholder="e.g. 3"
                          />
                        </label>
                      </div>
                    </SaveForm>
                  )}
                  <div className="ff-timeline">
                    {data.progress
                      .filter((p) => p.objective_id === objective.id)
                      .map((p) => (
                        <article key={p.id}>
                          <span className="ff-timeline-dot" />
                          <small>
                            {authorName(p.author_id)} ·{" "}
                            <time dateTime={p.created_at}>
                              {date(p.created_at)} ·{" "}
                              {new Intl.DateTimeFormat("en", {
                                hour: "numeric",
                                minute: "2-digit",
                                timeZone: "UTC",
                              }).format(new Date(p.created_at))}{" "}
                              UTC
                            </time>
                          </small>
                          <p>{p.note}</p>
                          {p.value !== null && (
                            <span className="ff-pill">Recorded: {p.value}</span>
                          )}
                        </article>
                      ))}
                  </div>
                  {!data.progress.some(
                    (p) => p.objective_id === objective.id,
                  ) && <Empty>Your progress story will appear here.</Empty>}
                </section>
              </div>
              <div>
                {(objective.team_visible || teamReplies.length > 0) && (
                  <section className="ff-panel ff-dialogue">
                    <div className="ff-section-heading">
                      <h2 className="ff-section-title">
                        Church Team conversation
                      </h2>
                      <Icon name="chat" />
                    </div>
                    <p className="ff-muted">
                      {objective.team_visible
                        ? "Replies here are shared with your Church Team, planter, and Catalyst."
                        : "Team sharing is off. This history is visible only to the planter and Catalyst."}
                    </p>
                    {!teamRepliesAvailable ? (
                      <Empty>
                        Team replies are not available yet. Please try again
                        later.
                      </Empty>
                    ) : (
                      <>
                        <div className="ff-messages">
                          {teamReplies.map((m) => (
                            <article
                              key={m.id}
                              className={
                                m.author_id === data.viewer.id ? "is-mine" : ""
                              }
                            >
                              <header>
                                <strong>{authorName(m.author_id)}</strong>
                                <time dateTime={m.created_at}>
                                  {date(m.created_at)} ·{" "}
                                  {new Intl.DateTimeFormat("en", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    timeZone: "UTC",
                                  }).format(new Date(m.created_at))}{" "}
                                  UTC
                                </time>
                              </header>
                              <p>{m.body}</p>
                            </article>
                          ))}
                        </div>
                        {!teamReplies.length && (
                          <Empty>
                            Share encouragement or discuss the next step with
                            your team.
                          </Empty>
                        )}
                        {canReplyToTeam && (
                          <SaveForm
                            key={`team-${objective.id}`}
                            intent="team_message"
                            perform={perform}
                            submit="Send team reply"
                          >
                            <input
                              type="hidden"
                              name="objective_id"
                              value={objective.id}
                            />
                            <label>
                              Your team reply
                              <textarea
                                name="body"
                                required
                                maxLength={2000}
                                placeholder="Write a reply to your Church Team…"
                              />
                            </label>
                          </SaveForm>
                        )}
                      </>
                    )}
                  </section>
                )}
                {!isPeer && (
                  <section className="ff-panel ff-dialogue">
                    <div className="ff-section-heading">
                      <h2 className="ff-section-title">
                        Catalyst conversation
                      </h2>
                      <Icon name="chat" />
                    </div>
                    <p className="ff-muted">
                      Private conversation between the planter and Catalyst. Not
                      shared with the Church Team.
                    </p>
                    <div className="ff-messages">
                      {data.messages
                        .filter((m) => m.objective_id === objective.id)
                        .map((m) => (
                          <article
                            key={m.id}
                            className={
                              m.author_id === data.viewer.id ? "is-mine" : ""
                            }
                          >
                            <header>
                              <strong>{authorName(m.author_id)}</strong>
                              <time dateTime={m.created_at}>
                                {date(m.created_at)} ·{" "}
                                {new Intl.DateTimeFormat("en", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  timeZone: "UTC",
                                }).format(new Date(m.created_at))}{" "}
                                UTC
                              </time>
                            </header>
                            <p>{m.body}</p>
                          </article>
                        ))}
                    </div>
                    {!data.messages.some(
                      (m) => m.objective_id === objective.id,
                    ) && (
                      <Empty>
                        Start a conversation. Share encouragement or ask for
                        support.
                      </Empty>
                    )}
                    <SaveForm
                      intent="message"
                      perform={perform}
                      submit="Send reply"
                    >
                      <input
                        type="hidden"
                        name="objective_id"
                        value={objective.id}
                      />
                      <label>
                        Your message
                        <textarea
                          required
                          name="body"
                          maxLength={2000}
                          placeholder="Write a thoughtful reply…"
                        />
                      </label>
                    </SaveForm>
                  </section>
                )}
                <section className="ff-panel ff-objective-settings">
                  <p className="ff-eyebrow">ABOUT THIS OBJECTIVE</p>
                  <p>
                    <strong>{categoryTitle(objective.category_id)}</strong>
                  </p>
                  <p className="ff-muted">
                    {objective.team_visible
                      ? "Shared with the Church Team and Catalyst."
                      : "Visible to the planter and their Catalyst."}{" "}
                    Personal growth is never scored.
                  </p>
                  {isOwner && (
                    <>
                      <button
                        className="ff-button ff-white"
                        onClick={() => {
                          setEditObjective(objective);
                          setModal("objective");
                        }}
                      >
                        Edit objective
                      </button>
                      <ObjectiveStatusControl
                        key={`${objective.id}:${objective.status}`}
                        objective={objective}
                        perform={perform}
                      />
                    </>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
        {view === "updates" && !isOwner && (
          <div className={isPeer ? "" : "ff-detail-grid"}>
            {!isPeer && (
              <section className="ff-panel">
                <div className="ff-section-heading">
                  <h2 className="ff-section-title">Your check-ins</h2>
                  {isOwner && (
                    <button
                      className="ff-text-button"
                      onClick={() => navigate("objectives")}
                    >
                      Open your objectives <Icon name="arrow" size={16} />
                    </button>
                  )}
                </div>
                <p className="ff-muted">
                  An honest picture of the journey. Visible to the planter and
                  their Catalyst.
                </p>
                {data.checkIns.map((c) => (
                  <article className="ff-update" key={c.id}>
                    <header>
                      <time dateTime={c.created_at}>{date(c.created_at)}</time>
                      <span className="ff-status">{c.feeling}</span>
                    </header>
                    <p>{c.note}</p>
                    <small>
                      Planting momentum:{" "}
                      {c.momentum === "moving"
                        ? "Moving forward"
                        : c.momentum === "stuck"
                          ? "Could use support"
                          : "Steady"}
                    </small>
                    {c.support && (
                      <div className="ff-support">
                        <Icon name="heart" size={17} />
                        <div>
                          <strong>Support requested</strong>
                          <p>{c.support}</p>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
                {!data.checkIns.length && (
                  <Empty>
                    No check-ins yet. Start with how you’re feeling today.
                  </Empty>
                )}
              </section>
            )}
            <section className="ff-panel">
              <h2 className="ff-section-title">Recent progress</h2>
              {data.progress.map((p) => (
                <button
                  className="ff-update ff-progress-link"
                  key={p.id}
                  onClick={() => {
                    const o = data.objectives.find(
                      (o) => o.id === p.objective_id,
                    );
                    if (o) openObjective(o);
                  }}
                >
                  <small>
                    {date(p.created_at)} ·{" "}
                    {
                      data.objectives.find((o) => o.id === p.objective_id)
                        ?.title
                    }
                  </small>
                  <p>{p.note}</p>
                  <span className="ff-text-button">
                    Open objective <Icon name="arrow" size={15} />
                  </span>
                </button>
              ))}
              {!data.progress.length && (
                <Empty>Updates from your objectives will appear here.</Empty>
              )}
            </section>
          </div>
        )}
        {view === "prayers" && (
          <div className={isPeer ? "" : "ff-detail-grid"}>
            <section className="ff-panel">
              <div className="ff-section-heading">
                <h2 className="ff-section-title">Prayer requests</h2>
                {isOwner && (
                  <button
                    className="ff-button ff-primary"
                    onClick={() => setModal("prayer")}
                  >
                    <Icon name="plus" size={17} />
                    Ask for prayer
                  </button>
                )}
              </div>
              <p className="ff-muted">
                {isPeer
                  ? "Prayer requests shared with your organization."
                  : "Choose whether to share with your Catalyst or with your organization."}
              </p>
              {data.prayers.map((p) => (
                <article className="ff-prayer" key={p.id}>
                  <span className="ff-category-icon tone-2">
                    <Icon name="heart" />
                  </span>
                  <div>
                    <small>
                      {date(p.created_at)} ·{" "}
                      {p.visibility === "private"
                        ? "Planter + Catalyst"
                        : "Shared with organization"}
                    </small>
                    <p>{p.body}</p>
                    {p.planter_id === data.viewer.id && (
                      <SaveForm
                        intent="prayer_visibility"
                        perform={perform}
                        submit="Update sharing"
                      >
                        <input name="id" type="hidden" value={p.id} />
                        <label>
                          Who can see this?
                          <select name="visibility" defaultValue={p.visibility}>
                            <option value="private">
                              Planter and Catalyst
                            </option>
                            <option value="organization">
                              Everyone in the organization
                            </option>
                          </select>
                        </label>
                      </SaveForm>
                    )}
                    {!isPeer && (
                      <ConversationThreadView
                        thread={
                          data.threads?.find(
                            (t) =>
                              t.entity_type === "prayer" &&
                              t.entity_id === p.id,
                          ) ?? null
                        }
                        entityType="prayer"
                        entityId={p.id}
                        planterId={p.planter_id}
                        viewer={data.viewer}
                        people={data.people}
                        title="Prayer conversation"
                        perform={perform}
                      />
                    )}
                  </div>
                </article>
              ))}
              {!data.prayers.length && (
                <Empty>
                  No prayer requests yet. There’s room here for whatever is on
                  your heart.
                </Empty>
              )}
            </section>
            {!isPeer && (
              <section className="ff-panel ff-checkin-card">
                <Icon name="heart" size={30} />
                <h2>Support starts with a conversation.</h2>
                <p>
                  Prayer requests and honest check-ins help your Catalyst
                  understand where encouragement, resources, or a listening ear
                  could make a difference.
                </p>
                <p className="ff-muted">
                  Requests for help never lower a score or change a church’s
                  standing here.
                </p>
                {latest?.support && (
                  <div className="ff-support">
                    <div>
                      <strong>From the latest check-in</strong>
                      <p>{latest.support}</p>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
        {view === "prayers" &&
          !isPeer &&
          data.checkIns.some((c) => c.support) && (
            <section className="ff-panel">
              <h2>Support conversations</h2>
              <p className="ff-muted">
                Private between you and your Catalyst. These are existing
                support requests from your journey.
              </p>
              {data.checkIns
                .filter((c) => c.support)
                .map((c) => (
                  <ConversationThreadView
                    key={c.id}
                    thread={
                      data.threads?.find(
                        (t) =>
                          t.entity_type === "support" && t.entity_id === c.id,
                      ) ?? null
                    }
                    entityType="support"
                    entityId={c.id}
                    planterId={data.planter.id}
                    viewer={data.viewer}
                    people={data.people}
                    title={c.support}
                    perform={perform}
                  />
                ))}
            </section>
          )}
        {view === "prayers" && (
          <section className="ff-panel">
            <div className="ff-section-heading">
              <h2 className="ff-section-title">Praying with your community</h2>
              <Icon name="heart" />
            </div>
            <p className="ff-muted">
              Requests other planters have shared with your organization.
            </p>
            {data.sharedPrayers?.map((p) => (
              <article className="ff-update" key={p.id}>
                <small>
                  {date(p.created_at)} · Shared by a planter in your
                  organization
                </small>
                <p>{p.body}</p>
              </article>
            ))}
            {!data.sharedPrayers?.length && (
              <Empty>
                When someone shares a prayer request with the organization,
                you’ll find it here.
              </Empty>
            )}
          </section>
        )}
        {view === "overview" && !isPeer && !isOwner && (
          <DashboardInsights
            data={data}
            openObjective={openObjective}
            openSupport={() => navigate("prayers")}
          />
        )}
        <footer className="ff-main-footer">
          <Icon name="leaf" size={16} />
          First Fruits
          <span className="ff-footer-tagline">
            Faithfulness in the everyday.
          </span>
        </footer>
      </main>
      {isOwner && modal === "objective" && (
        <Modal
          title={
            editObjective ? "Edit your objective" : "Plant a new objective"
          }
          close={() => setModal(null)}
        >
          <p className="ff-muted objective-form-introduction">
            Start with something meaningful and achievable.
          </p>
          <SaveForm
            intent="objective"
            className="objective-form"
            perform={perform}
            submit={editObjective ? "Save objective" : "Create objective"}
            onDraftChange={form => setObjectiveDrafts(current => ({
              ...current,
              [objectiveDraftKey]: {
                category_id: String(form.get("category_id") ?? ""),
                title: String(form.get("title") ?? ""),
                description: String(form.get("description") ?? ""),
                due_date: String(form.get("due_date") ?? ""),
                cadence: String(form.get("cadence") ?? "weekly"),
                team_visible: form.get("team_visible") === "on",
              },
            }))}
            onSaved={() => { clearObjectiveDraft(objectiveDraftKey); saved(); }}
          >
            {editObjective && (
              <input type="hidden" name="id" value={editObjective.id} />
            )}
            <label className="objective-form-field objective-form-category-field">
              Category
              <select
                className="objective-form-category-select"
                name="category_id"
                defaultValue={objectiveDraft?.category_id ?? editObjective?.category_id ?? ""}
                required
              >
                <option value="" disabled>
                  Choose an area of growth
                </option>
                {ordinaryCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="objective-form-field objective-form-title-field">
              What are you working toward?
              <input
                className="objective-form-title-input"
                name="title"
                required
                maxLength={160}
                defaultValue={objectiveDraft?.title ?? editObjective?.title ?? ""}
                placeholder="e.g. Build relationships in our neighbourhood"
              />
            </label>
            <label className="objective-form-field objective-form-description-field">
              Why does it matter? (optional)
              <textarea
                className="objective-form-description-textarea"
                name="description"
                maxLength={2000}
                defaultValue={objectiveDraft?.description ?? editObjective?.description ?? ""}
                placeholder="A little context for you and your Catalyst…"
              />
            </label>
            <label className="objective-form-field objective-form-target-date-field">
              Target date (optional)
              <input
                type="date"
                className="objective-form-target-date-input"
                name="due_date"
                defaultValue={objectiveDraft?.due_date ?? editObjective?.due_date ?? ""}
              />
            </label>
            <input type="hidden" name="team_visible_present" value="1" />
            <label
              className="objective-form-field objective-form-team-sharing-field"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                className="objective-form-team-sharing-checkbox"
                name="team_visible"
                defaultChecked={objectiveDraft?.team_visible ?? editObjective?.team_visible ?? false}
                style={{
                  width: "16px",
                  height: "16px",
                  margin: 0,
                  flexShrink: 0,
                  accentColor: "#315c49",
                }}
              />
              <span className="objective-form-team-sharing-label">Share with Church Team</span>
            </label>
            <label className="objective-form-field objective-form-progress-rhythm-field">
              Progress rhythm
              <select
                className="objective-form-progress-rhythm-select"
                name="cadence"
                defaultValue={objectiveDraft?.cadence ?? editObjective?.cadence ?? "weekly"}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <p className="ff-field-help objective-form-visibility-help">
              Your objective and updates are visible to your Catalyst. Select
              sharing to also include your Church Team. Private conversations
              stay private.
            </p>
            <button type="button" className="ff-text-button objective-form-discard-draft-button" onClick={() => {
              clearObjectiveDraft(objectiveDraftKey);
              setModal(null);
              setEditObjective(null);
            }}>Discard draft</button>
          </SaveForm>
        </Modal>
      )}{" "}
      {isOwner && modal === "prayer" && (
        <Modal title="What’s on your heart?" close={() => setModal(null)}>
          <SaveForm
            intent="prayer"
            perform={perform}
            submit="Save prayer request"
            onSaved={saved}
          >
            <label>
              Your prayer request
              <textarea
                name="body"
                required
                maxLength={2000}
                placeholder="Share as much or as little as you feel comfortable with."
              />
            </label>
            <label>
              Who would you like to share with?
              <select name="visibility" defaultValue="private">
                <option value="private">Just me and my Catalyst</option>
                <option value="organization">
                  Everyone in my organization
                </option>
              </select>
            </label>
            <p className="ff-field-help">
              Your Catalyst can also change sharing with your organization.
            </p>
          </SaveForm>
        </Modal>
      )}
    </div>
  );
}

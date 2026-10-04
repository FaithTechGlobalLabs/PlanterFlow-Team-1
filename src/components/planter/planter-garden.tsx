"use client";
import type { Objective, WorkspaceData } from "@/lib/workspace/types";
import {
  gardenDate,
  gardenSummary,
  journeyMoments,
  stageLabels,
} from "@/lib/workspace/garden";
import { ChurchTree } from "@/components/garden/church-tree";
import { Link } from "@/i18n/routing";
import "@/components/garden/garden.css";
import "./planter.css";

export function PlanterGarden({
  data,
  openObjective,
  createObjective,
  preview = false,
}: {
  data: WorkspaceData;
  openObjective?: (objective: Objective) => void;
  createObjective?: () => void;
  preview?: boolean;
}) {
  const summary = gardenSummary(data);
  return (
    <section
      className="planter-landscape"
      aria-label="Your living church garden"
    >
      <div className="planter-landscape-copy">
        <p className="planter-eyebrow">ROOTED IN YOUR COMMUNITY</p>
        <h2>{data.church?.name || "Your church"}</h2>
        <p>
          {data.church?.vision ||
            "Keep tending what matters most, with the people beside you."}
        </p>
        <span className="planter-stage">
          {summary.stage ? stageLabels[summary.stage] : "Your planting journey"}
        </span>
        <p className="planter-tree-summary">
          {summary.active.length} active objective{summary.active.length === 1 ? "" : "s"} · {summary.shared} shared
          with your Church Team · {summary.completed} completed objective{summary.completed === 1 ? "" : "s"} ·{" "}
          {data.progress.length} progress updates
        </p>
        <div className="planter-branches" aria-label="Objective branches">
          {data.objectives.slice(0, 4).map((o) =>
            openObjective ? (
              <button key={o.id} onClick={() => openObjective(o)}>
                {o.title}
                <span>
                  {o.status === "done" ? "Completed · fruit" : o.status}
                </span>
              </button>
            ) : (
              <Link
                key={o.id}
                href={`${preview ? "/preview" : "/dashboard"}?view=objectives&objective=${o.id}`}
              >
                {o.title}
                <span>
                  {o.status === "done" ? "Completed · fruit" : o.status}
                </span>
              </Link>
            ),
          )}
        </div>
        {!data.objectives.length && (
          <div>
            <p>
              Your first branch starts here. Create an objective for what you
              want to nurture next.
            </p>
            {createObjective ? (
              <button
                className="ff-button ff-primary"
                onClick={createObjective}
              >
                Create objective
              </button>
            ) : (
              <Link
                className="ff-button ff-primary"
                href={`${preview ? "/preview" : "/dashboard"}?view=objectives`}
              >
                View objectives
              </Link>
            )}
          </div>
        )}
      </div>
      <div className={`planter-tree-plot stage-${summary.stage ?? "unknown"}`}>
        <div className="planter-sun" />
        <ChurchTree
          completed={summary.completed}
          stage={summary.stage ?? undefined}
        />
        <span className="planter-soil" />
        <p>Deep roots. A shared journey.</p>
      </div>
    </section>
  );
}
export function NextTending({
  data,
  openObjective,
  preview = false,
}: {
  data: WorkspaceData;
  openObjective?: (objective: Objective) => void;
  preview?: boolean;
}) {
  const { next } = gardenSummary(data);
  const latest = next
    ? data.progress
        .filter((p) => p.objective_id === next.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    : null;
  return (
    <section className="planter-next">
      <p className="planter-eyebrow">ONE THING WORTH TENDING</p>
      <h2>{next?.title || "Your garden is steady today."}</h2>
      <p>
        {next
          ? latest
            ? `Last progress shared ${gardenDate(latest.created_at)}`
            : "Choose one small step for this objective."
          : "There is room to notice what has grown and consider what comes next."}
      </p>
      {next && openObjective ? (
        <button
          className="ff-button ff-primary"
          onClick={() => openObjective(next)}
        >
          Continue objective
        </button>
      ) : (
        <Link
          className="ff-button ff-primary"
          href={`${preview ? "/preview" : "/dashboard"}?view=objectives${next ? `&objective=${next.id}` : ""}`}
        >
          {next ? "Continue objective" : "View objectives"}
        </Link>
      )}
    </section>
  );
}
export function RhythmIndicator({ data }: { data: WorkspaceData }) {
  const { days } = gardenSummary(data);
  return (
    <section className="planter-rhythm">
      <p className="planter-eyebrow">YOUR RHYTHM</p>
      <h2>
        {days.filter(Boolean).length} {days.filter(Boolean).length === 1 ? "day" : "days"} with objective progress this week
      </h2>
      <div className="planter-rhythm-days" aria-hidden="true">
        {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
          <span key={i} className={days[i] ? "is-tended" : ""}>
            {label}
          </span>
        ))}
      </div>
      <p>
        Monday–Sunday · UTC · Your own saved progress updates.
        <br />
        Every small act counts. There is no streak to lose.
      </p>
    </section>
  );
}
export function TeamSnapshot({
  data,
  preview = false,
  full = false,
}: {
  data: WorkspaceData;
  preview?: boolean;
  full?: boolean;
}) {
  const team = data.team;
  return (
    <section className="planter-team">
      <p className="planter-eyebrow">CULTIVATING TOGETHER</p>
      <h2>Your Church Team</h2>
      {!team || team.unavailable ? (
        <p>
          We couldn’t load the full team snapshot. Your invitation and objective
          sharing controls are still available.
        </p>
      ) : (
        <>
          {team.members.length ? (
            <>
              <p>
                {team.members.length}{" "}
                {team.members.length === 1 ? "person" : "people"} growing with
                you
              </p>
              <ul className="planter-members">
                {team.members.map((p) => (
                  <li key={p.id}>
                    <span aria-hidden="true">{p.display_name.slice(0, 1)}</span>
                    <div>
                      <strong>{p.display_name}</strong>
                      <small>
                        Church Team member · Joined {gardenDate(p.joined_at)}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>
              Build this with people you trust. Invite someone to join your
              Church Team.
            </p>
          )}
          {team.invitations.length > 0 && (
            <>
              <p>
                {team.invitations.length}{" "}
                {team.invitations.length === 1 ? "invitation" : "invitations"}{" "}
                pending
              </p>
              {full && (
                <ul className="planter-invitations">
                  {team.invitations.map((i) => (
                    <li key={i.id}>
                      {i.email}
                      <small>
                        Pending · Expires {gardenDate(i.expires_at)}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
      {preview ? (
        <p className="planter-preview-note">
          Sample team · Invitations are available after sign-in.
        </p>
      ) : (
        <Link className="ff-button ff-white" href="/invite-team">
          Invite team member
        </Link>
      )}
      {full && (
        <>
          <h3>Shared objective access</h3>
          <p>
            Members can contribute only to objectives you share. Private
            Catalyst dialogue and personal check-ins stay private.
          </p>
          <ul className="planter-sharing">
            {data.objectives.map((o) => (
              <li key={o.id}>
                <Link
                  href={`${preview ? "/preview" : "/dashboard"}?view=objectives&objective=${o.id}`}
                >
                  {o.title}
                </Link>
                <span>
                  {o.team_visible
                    ? "Shared with Church Team"
                    : "Planter + Catalyst"}
                </span>
              </li>
            ))}
          </ul>
          <p>
            Open an objective and choose Edit objective to change “Share with
            Church Team”.
          </p>
        </>
      )}
    </section>
  );
}
export function PlanterJourney({
  data,
  openObjective,
}: {
  data: WorkspaceData;
  openObjective: (objective: Objective) => void;
}) {
  const moments = journeyMoments(data);
  return (
    <section className="planter-journey">
      <p className="planter-eyebrow">A LIVING RECORD</p>
      <h2>Small steps, lasting roots.</h2>
      <p>
        {data.objectives.filter((o) => o.status === "done").length} completed
        objectives. Fruit marks explicit completion; completion dates are not
        recorded yet.
      </p>
      <ol>
        {moments.map((m) => (
          <li key={m.id}>
            <time dateTime={m.at}>{gardenDate(m.at)}</time>
            <div>
              <small>{m.detail}</small>
              {m.objectiveId ? (
                <button
                  onClick={() => {
                    const o = data.objectives.find(
                      (o) => o.id === m.objectiveId,
                    );
                    if (o) openObjective(o);
                  }}
                >
                  {m.title}
                </button>
              ) : (
                <p>{m.title}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {!moments.length && (
        <p>Your progress will grow here as you update your objectives.</p>
      )}
    </section>
  );
}

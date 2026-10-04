"use client";
import type { WorkspaceData } from "@/lib/workspace/types";
import { PlanterHomeShell } from "./planter-shell";
import { Link } from "@/i18n/routing";
import {
  PlanterGarden,
  NextTending,
  RhythmIndicator,
  TeamSnapshot,
} from "./planter-garden";
import "./planter.css";

export function PlanterHome({
  data,
  preview = false,
}: {
  data: WorkspaceData;
  preview?: boolean;
}) {
  const recentSupport = [
    ...data.messages,
    ...(data.threads ?? []).flatMap((t) => t.messages),
  ]
    .filter((m) => m.author_id !== data.viewer.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return (
    <PlanterHomeShell
      name={data.viewer.display_name}
      preview={preview}
      showBack={false}
    >
      {preview && (
        <p className="planter-preview-note">
          Design preview · Fictional records. Saving and invitations require
          sign-in.
        </p>
      )}
      <div className="planter-home-heading">
        <div>
          <p className="planter-eyebrow">YOUR CHURCH</p>
          <h1>
            Welcome,{" "}
            {data.viewer.display_name.trim().split(/\s+/)[0] || "friend"}.
          </h1>
          <p>The living church you are cultivating with your team.</p>
        </div>
        <div className="planter-home-actions">
          <Link
            className="ff-button ff-primary"
            href={preview ? "/preview" : "/dashboard"}
          >
            Open workspace
          </Link>
          {!preview && (
            <Link className="ff-button ff-white" href="/invite-team">
              Invite team member
            </Link>
          )}
          <Link
            className="planter-link"
            href={`${preview ? "/preview" : "/dashboard"}?view=team`}
          >
            View team
          </Link>
        </div>
      </div>
      <PlanterGarden data={data} preview={preview} />
      <div className="planter-home-grid planter-home-rhythm">
        <NextTending data={data} preview={preview} />
        <RhythmIndicator data={data} />
      </div>
      <div className="planter-home-grid">
        <TeamSnapshot data={data} preview={preview} />
        <section className="planter-support">
          <p className="planter-eyebrow">WALKING ALONGSIDE</p>
          <h2>Room for prayer and support.</h2>
          <p>
            {recentSupport
              ? "There is a conversation update from someone walking alongside you."
              : "Share what is on your heart, or return to a conversation with your Catalyst."}
          </p>
          <Link
            className="planter-link"
            href={`${preview ? "/preview" : "/dashboard"}?view=${recentSupport && "objective_id" in recentSupport ? `objectives&objective=${recentSupport.objective_id}` : "prayers"}`}
          >
            {recentSupport && "objective_id" in recentSupport
              ? "Open Catalyst conversation →"
              : "Open prayer & support →"}
          </Link>
          <p className="planter-small">
            Private Catalyst dialogue stays separate from your Church Team
            conversations.
          </p>
        </section>
      </div>
      <footer className="planter-footer">
        First Fruits · A living record of how we show up for what matters.
      </footer>
    </PlanterHomeShell>
  );
}

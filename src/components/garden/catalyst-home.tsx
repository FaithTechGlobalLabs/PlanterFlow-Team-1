"use client";
import { useState, type ReactNode } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { GardenScene } from "./garden-scene";
import { ChurchPanel } from "./church-panel";
import {
  needsPresence,
  type GardenChurch,
} from "@/app/[locale]/catalyst/garden-status";
import { StatusBadges } from "@/app/[locale]/catalyst/church-list";

export function CatalystHome({
  greeting,
  garden,
  loadFailed,
  invitations,
  isAdmin,
}: {
  greeting: string;
  garden: GardenChurch[];
  loadFailed: boolean;
  invitations: ReactNode;
  isAdmin: boolean;
}) {
  const t = useTranslations("catalyst.garden");
  const tStage = useTranslations("home.planter.stage");
  const format = useFormatter();
  const [selectedId, select] = useState<string>();
  const [search, setSearch] = useState("");
  const selected = garden.find((church) => church.churchId === selectedId);
  const presence = garden.filter(needsPresence);
  const status = (church: GardenChurch) =>
    church.supportRequested
      ? t("support_requested")
      : church.replyDue
        ? t("review_check_in")
        : church.checkInDue
          ? t("check_in_due")
          : "No immediate action needed";
  const filtered = garden.filter((church) =>
    `${church.churchName} ${church.pastorName} ${church.city ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <header className="garden-heading">
        <div className="garden-header-text">
          <p className="garden-eyebrow">YOUR GARDEN</p>
          <h1 className="garden-title">{greeting}</h1>
          <p className="garden-description">Your garden grows through the pastors and churches you support.</p>
          {!loadFailed && (
            <p className="garden-summary">
              {t("summary", {
                churches: garden.length,
                support: garden.filter((c) => c.supportRequested).length,
                due: garden.filter((c) => c.replyDue).length,
              })}
            </p>
          )}
        </div>
        <div className="garden-actions">
          <Button variant="primary" href="/invite-pastor" fullWidth={false}>
            + Invite a pastor
          </Button>
          <Button variant="secondary" href="/dashboard" fullWidth={false}>
            Open workspace →
          </Button>
        </div>
      </header>
      {loadFailed ? (
        <section className="garden-surface garden-load-error" role="alert">
          <h2>Your garden couldn’t load.</h2>
          <p>{t("load_error")}</p>
          <a href="" className="garden-text-link">
            Try again
          </a>
        </section>
      ) : (
        <div className="garden-home-grid">
          <GardenScene
            plots={garden.map((c) => ({
              id: c.churchId,
              name: c.churchName,
              pastor: c.pastorName || "Pastor",
              status: status(c),
              attention: needsPresence(c),
              completed: c.completedObjectives,
            }))}
            onSelect={select}
            selectedId={selectedId}
          />
          <section className="garden-presence" aria-labelledby="presence-title">
            <p className="garden-eyebrow">A LITTLE PRESENCE GOES A LONG WAY</p>
            <h2 id="presence-title" className="garden-presence-title">Where your presence helps</h2>
            {presence.length ? (
              <ul className="garden-presence-list">
                {presence.slice(0, 4).map((church) => (
                  <li key={church.churchId} className="garden-presence-item">
                    <p className="garden-status">{status(church)}</p>
                    <h3 className="garden-presence-church-name">{church.churchName}</h3>
                    <p className="garden-presence-pastor-name">{church.pastorName || "Pastor"}</p>
                    <Link
                      href={`/catalyst/planters/${church.pastorId}`}
                      className="garden-text-link"
                    >
                      {church.supportRequested ? "Respond" : "Review church"} →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="garden-quiet">
                <h3 className="garden-quiet-title">
                  {garden.length
                    ? "Your garden is quiet today."
                    : "Make room for a new journey."}
                </h3>
                <p className="garden-quiet-description">
                  {garden.length
                    ? "Nothing needs your attention right now. There is always room for encouragement."
                    : "Start by inviting a pastor. You’ll see their updates here when they join."}
                </p>
              </div>
            )}
            {presence.length > 4 && (
              <a href="#churches" className="garden-text-link">
                View all {presence.length} churches needing presence →
              </a>
            )}
          </section>
        </div>
      )}
      <section id="churches" className="garden-directory">
        <div className="garden-section-heading">
          <div className="garden-directory-header-text">
            <p className="garden-eyebrow">GROWING TOGETHER</p>
            <h2 className="garden-directory-title">Your churches</h2>
          </div>
          {!loadFailed && (
            <label className="garden-search">
              Find a church
              <input
                type="search"
                placeholder="Search church, pastor, or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          )}
        </div>
        {!loadFailed &&
          (filtered.length ? (
            <ul className="garden-church-list">
              {filtered.map((church) => (
                <li key={church.churchId} className="garden-church-item">
                  <button
                    className="garden-church-button"
                    onClick={() => select(church.churchId)}
                    aria-label={`Explore ${church.churchName}`}
                  >
                    <span className="garden-church-info">
                      <strong className="garden-church-name">{church.churchName}</strong>
                      <small className="garden-church-meta">
                        {[church.pastorName, church.city]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </span>
                    <span className="garden-status">{status(church)}</span>
                    <span className="garden-church-arrow" aria-hidden="true">↗</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="garden-quiet">
              {garden.length
                ? "No churches match your search."
                : "Your garden starts here. Invite your first pastor to begin."}
            </p>
          ))}
      </section>
      <section id="invitations" className="garden-surface garden-invitations">
        <div className="garden-section-heading">
          <div className="garden-invitations-header-text">
            <p className="garden-eyebrow">NEW BEGINNINGS</p>
            <h2 className="garden-invitations-title">Pastor invitations</h2>
            <p className="garden-invitations-description">Keep track of the invitations you’ve sent.</p>
          </div>
          <Link href="/invite-pastor" className="garden-text-link">
            Invite a pastor →
          </Link>
        </div>
        {invitations}
        {isAdmin && (
          <Link href="/invite-catalyst" className="garden-text-link">
            Invite a Catalyst →
          </Link>
        )}
      </section>
      {selected && (
        <ChurchPanel
          title={selected.churchName}
          close={() => select(undefined)}
        >
          <p className="garden-panel-subtitle">
            {selected.pastorName || "Pastor"}
            {selected.city ? ` · ${selected.city}` : ""}
          </p>
          {selected.stage && (
            <p className="garden-stage">{tStage(selected.stage)}</p>
          )}
          <StatusBadges church={selected} />
          {selected.currentObjective && (
            <section className="garden-panel-objective-section">
              <p className="garden-eyebrow">CURRENT OBJECTIVE</p>
              <h3 className="garden-panel-objective-title">{selected.currentObjective}</h3>
            </section>
          )}
          <section className="garden-panel-checkin-section">
            <p className="garden-eyebrow">LATEST CHECK-IN</p>
            <p className="garden-panel-checkin-date">
              {selected.lastCheckInAt
                ? format.dateTime(new Date(selected.lastCheckInAt), {
                    dateStyle: "medium",
                  })
                : "No check-in shared yet."}
            </p>
          </section>
          {Boolean(selected.completedObjectives) && (
            <p className="garden-panel-completed-count">
              {selected.completedObjectives} objectives completed. A moment
              worth remembering.
            </p>
          )}
          <div className="garden-panel-actions">
            <Button
              variant="primary"
              href={`/catalyst/planters/${selected.pastorId}`}
              fullWidth
            >
              {selected.supportRequested ? "Respond & review" : "Review church"}
            </Button>
            <Button
              variant="secondary"
              href={`/dashboard?planter=${encodeURIComponent(selected.pastorId)}`}
              fullWidth
            >
              Open church workspace
            </Button>
          </div>
        </ChurchPanel>
      )}
    </>
  );
}

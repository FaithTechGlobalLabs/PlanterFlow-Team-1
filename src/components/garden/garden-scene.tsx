"use client";
import { useState } from "react";
import { ChurchTree } from "./church-tree";
import type { TreeStage } from "@/lib/tree-stage";
import { TreeMeaning } from "./tree-meaning";
import { useTranslations } from "next-intl";

export type GardenPlot = {
  id: string;
  name: string;
  pastor: string;
  status: string;
  statusClass?: string;
  attention?: boolean;
  completed?: number;
  stage?: TreeStage | null;
  planned?: boolean;
  progress?: number;
  branches?: number;
};

function getPlotStatusClass(plot: GardenPlot) {
  if (plot.statusClass) return plot.statusClass;
  const s = plot.status.toLowerCase();
  if (plot.attention || s.includes("support"))
    return "status-badge-support garden-status-support";
  if (s.includes("review") || s.includes("due")) {
    return s.includes("review")
      ? "status-badge-review garden-status-review"
      : "status-badge-due garden-status-due";
  }
  return "status-badge-quiet garden-status-quiet";
}
export function GardenScene({
  plots,
  onSelect,
  selectedId,
  emptyTitle = "Your garden starts here.",
  emptyBody = "Invite your first pastor. Their church will take its place here when they join.",
}: {
  plots: GardenPlot[];
  onSelect: (id: string) => void;
  selectedId?: string;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const tTree = useTranslations("tree");
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(plots.length / 6);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const visible = plots.slice(currentPage * 6, currentPage * 6 + 6);
  return (
    <section
      className={`garden-scene ${plots.length ? "" : "garden-scene-empty"}`}
      aria-label="Church garden"
    >
      <div className="garden-landscape" aria-hidden="true">
        <div className="garden-sun" />
        <div className="garden-hill garden-hill-back" />
        <div className="garden-hill garden-hill-front" />
        <div className="garden-path" />
      </div>
      <div className="garden-scene-caption">
        <span className="garden-scene-eyebrow">A GARDEN OF PEOPLE</span>
        <span className="garden-scene-prompt">
          {plots.length
            ? "Select a church to walk alongside its journey"
            : "Room for a new beginning"}
        </span>
      </div>
      {plots.length ? (
        <ul className="garden-plots">
          {visible.map((plot, i) => (
            <li key={plot.id} className="garden-plot-item">
              <button
                className={`garden-plot ${selectedId === plot.id ? "is-selected" : ""}`}
                onClick={() => onSelect(plot.id)}
                aria-label={`Explore ${plot.name}, ${plot.pastor}. ${plot.status}. ${plot.planned ? tTree("planned") : plot.stage ? tTree(`stage.${plot.stage}`) : tTree("missing_date")}. ${tTree("counts", { progress: plot.progress ?? 0, completed: plot.completed ?? 0 })}`}
                aria-pressed={selectedId === plot.id}
              >
                <ChurchTree
                  variant={i}
                  completed={plot.completed}
                  stage={plot.stage ?? undefined}
                  progress={plot.progress}
                  branches={plot.branches}
                />
                <span className="garden-plot-label">
                  <strong>{plot.name}</strong>
                  <span className="garden-plot-pastor">{plot.pastor}</span>
                  <small className="garden-plot-stage">
                    {plot.planned
                      ? tTree("planned")
                      : plot.stage
                        ? tTree(`stage.${plot.stage}`)
                        : tTree("missing_date")}
                  </small>
                  <small
                    className={`garden-plot-attention ${getPlotStatusClass(plot)}`}
                  >
                    {plot.status}
                  </small>
                  {Boolean(plot.completed) && (
                    <small className="garden-plot-completed-badge">
                      {plot.completed} recorded outcomes
                    </small>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="garden-empty">
          <ChurchTree />
          <h2 className="garden-empty-title">{emptyTitle}</h2>
          <p className="garden-empty-body">{emptyBody}</p>
        </div>
      )}
      {pageCount > 1 && (
        <nav className="garden-pagination" aria-label="Garden pages">
          <button
            className="garden-pagination-btn garden-pagination-prev"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            ← Previous
          </button>
          <span className="garden-pagination-info" aria-live="polite">
            {currentPage * 6 + 1}–{Math.min(currentPage * 6 + 6, plots.length)}{" "}
            of {plots.length} churches
          </span>
          <button
            className="garden-pagination-btn garden-pagination-next"
            disabled={currentPage === pageCount - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            Next →
          </button>
        </nav>
      )}
      <p className="garden-scene-note">
        Every church has its own story. Every act of care matters.
      </p>
      <TreeMeaning />
    </section>
  );
}

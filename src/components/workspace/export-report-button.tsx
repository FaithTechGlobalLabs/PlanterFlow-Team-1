"use client";

import { useState } from "react";

export function ExportReportButton({
  planterId,
  className = "",
}: {
  planterId: string;
  planterName?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/export/planter/${planterId}.pdf`);
      if (!response.ok) {
        let errorMsg = "Export failed.";
        try {
          const body = await response.json();
          if (body.error) errorMsg = body.error;
        } catch {
          // ignore json parse failure
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `planter-report-${planterId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setLoading(false);
    } catch {
      setError("An unexpected error occurred while exporting.");
      setLoading(false);
    }
  }

  return (
    <div className={`ff-export-wrapper inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="ff-export-button inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--color-sage-dark,#b2bfa0)] bg-[var(--color-canvas,#fbfbfa)] text-[var(--color-ink,#283618)] hover:bg-[var(--color-sage,#e8eedc)] transition-colors disabled:opacity-60 disabled:cursor-wait"
        aria-label="Export PDF report"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" aria-hidden="true" />
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export PDF Report</span>
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="ff-export-error text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5">
          {error}
        </p>
      )}
    </div>
  );
}
